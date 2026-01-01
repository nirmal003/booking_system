/**
 * Booking Controller
 * Handles ticket booking operations with concurrency control
 */

const { Booking, User } = require('../models');
const Event = require('../models/Mongoose/event');
const { sequelize } = require('../config/mysqldb');
const mongoose = require('mongoose');
const Logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorMiddleware');
const ErrorHandler = require('../utils/customErrorHandler');

// @desc    Book a ticket for an event
// @route   POST /api/bookings
// @access  Private
const bookTicket = asyncHandler(async (req, res, next) => {
  const { eventId, ticketCount } = req.body;
  const userId = req.user.id;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return next(new ErrorHandler('Invalid event ID', 400));
  }

  // Start MongoDB session for transaction
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  // Start MySQL transaction
  const mysqlTransaction = await sequelize.transaction();

  try {
    // This ensures that only one request can decrement tickets at a time
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        availableTickets: { $gte: ticketCount }
      },
      {
        $inc: { availableTickets: -ticketCount }
      },
      {
        new: true,
        session: mongoSession,
        runValidators: true
      }
    );

    // If event is null, either event doesn't exist or not enough tickets
    if (!event) {
      // Check if event exists at all
      const existingEvent = await Event.findById(eventId);
      if (!existingEvent) {
        return next(new ErrorHandler('Event not found', 404));
      }

      // Log failed booking attempt
      await Logger.warning('Booking failed - insufficient tickets', {
        eventId,
        userId,
        requestedTickets: ticketCount,
        availableTickets: existingEvent.availableTickets
      }, req);

      return next(new ErrorHandler(
        `Insufficient tickets available. Only ${existingEvent.availableTickets} tickets remaining.`, 400
      ));
    }

    // Check if event date has passed
    if (new Date(event.date) < new Date()) {
      // Restore tickets
      await Event.findByIdAndUpdate(eventId, {
        $inc: { availableTickets: ticketCount }
      });

      return next(new ErrorHandler('Cannot book tickets for past events', 400));
    }

    // Create booking record in MySQL
    const booking = await Booking.create(
      {
        userId,
        eventId: event._id.toString(),
        eventName: event.name,
        ticketCount,
        status: 'confirmed'
      },
      { transaction: mysqlTransaction }
    );

    // Commit both transactions
    await mongoSession.commitTransaction();
    await mysqlTransaction.commit();

    // Log successful booking
    await Logger.info('Ticket booked successfully', {
      bookingId: booking.id,
      userId,
      eventId: event._id,
      eventName: event.name,
      ticketCount
    }, req);

    // Fetch complete booking with user details
    const completeBooking = await Booking.findByPk(booking.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Ticket booked successfully',
      data: {
        booking: completeBooking,
        event: {
          id: event._id,
          name: event.name,
          date: event.date,
          location: event.location,
          availableTickets: event.availableTickets
        }
      }
    });
  } catch (error) {
    // Rollback both transactions on error
    await mongoSession.abortTransaction();
    await mysqlTransaction.rollback();

    // Log error
    await Logger.error('Booking failed with error', {
      error: error.message,
      userId: req.user.id,
      eventId: req.body.eventId
    }, req);

    throw error;
  } finally {
    mongoSession.endSession();
  }
});

// @desc    Get user's bookings
// @route   GET /api/bookings/my-tickets
// @access  Private
const getMyTickets = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get bookings with pagination
  const { count, rows: bookings } = await Booking.findAndCountAll({
    where: { userId },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email']
    }],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  // Fetch event details from MongoDB for each booking
  const bookingsWithEvents = await Promise.all(
    bookings.map(async (booking) => {
      const bookingJson = booking.toJSON();

      try {
        const event = await Event.findById(bookingJson.eventId).lean();
        bookingJson.eventDetails = event || null;
      } catch (error) {
        console.error(`Error fetching event ${bookingJson.eventId}:`, error);
        bookingJson.eventDetails = null;
      }

      return bookingJson;
    })
  );

  res.status(200).json({
    success: true,
    data: {
      bookings: bookingsWithEvents,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const booking = await Booking.findOne({
    where: { id },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email']
    }]
  });

  if (!booking) {
    return next(new ErrorHandler('Booking not found', 404));
  }

  // Check if user owns this booking or is admin
  if (booking.userId !== userId && req.user.role !== 'admin') {
    return next(new ErrorHandler('Access denied', 403));
  }

  // Fetch event details from MongoDB
  const bookingJson = booking.toJSON();
  try {
    const event = await Event.findById(bookingJson.eventId).lean();
    bookingJson.eventDetails = event || null;
  } catch (error) {
    console.error(`Error fetching event ${bookingJson.eventId}:`, error);
    bookingJson.eventDetails = null;
  }

  res.status(200).json({
    success: true,
    data: { booking: bookingJson }
  });
});

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private
const cancelBooking = asyncHandler(async (req, res, next) => {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  const mysqlTransaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findOne({
      where: { id },
      transaction: mysqlTransaction
    });

    if (!booking) {
      return next(new ErrorHandler('Booking not found', 404));
    }

    // Check if user owns this booking
    if (booking.userId !== userId && req.user.role !== 'admin') {
      return next(new ErrorHandler('Access denied', 403));
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return next(new ErrorHandler('Booking already cancelled', 400));
    }

    // Restore tickets in MongoDB
    const event = await Event.findByIdAndUpdate(
      booking.eventId,
      { $inc: { availableTickets: booking.ticketCount } },
      { new: true, session: mongoSession }
    );

    if (!event) {
      return next(new ErrorHandler('Associated event not found', 404));
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save({ transaction: mysqlTransaction });

    await mongoSession.commitTransaction();
    await mysqlTransaction.commit();

    // Log cancellation
    await Logger.info('Booking cancelled', {
      bookingId: booking.id,
      userId,
      eventId: booking.eventId,
      ticketCount: booking.ticketCount
    }, req);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    await mysqlTransaction.rollback();

    await Logger.error('Booking cancellation failed', {
      error: error.message,
      bookingId: req.params.id
    }, req);

    throw error;
  } finally {
    mongoSession.endSession();
  }
});

module.exports = {
  bookTicket,
  getMyTickets,
  getBookingById,
  cancelBooking
};
