/**
 * Event Controller
 * Handles CRUD operations for events
 */

const Event = require('../models/Mongoose/event');
const Logger = require('../utils/logger');
const ApiFeatures = require("../utils/apiFeatures");
const { asyncHandler } = require('../middleware/errorMiddleware');
const ErrorHandler = require('../utils/customErrorHandler');
const mongoose = require('mongoose');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = asyncHandler(async (req, res, next) => {
  const { name, description, date, location, totalTickets, metadata } = req.body;

  const event = await Event.create({
    name,
    description,
    date,
    location,
    totalTickets,
    availableTickets: totalTickets,
    metadata: metadata || {},
    createdBy: req.user.id.toString()
  });

  // Log event creation
  await Logger.info('Event created', {
    eventId: event._id,
    eventName: event.name,
    createdBy: req.user.id
  }, req);

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: { event }
  });
});

// @desc    Get all events with pagination
// @route   GET /api/events
// @access  Public
const getEvents = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};

  // Filter by upcoming events only (optional)
  if (req.query.upcoming === 'true') {
    query.date = { $gte: new Date() };
  }

  // Search by name or location
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { location: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const events = await Event.find(query)
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalEventCount = await Event.countDocuments();

  // const ApiFeature = new ApiFeatures(Event.find(), req.query)
  //   .search()
  //   .filter()
  //   .pagination(limit);

  // const events = await ApiFeature.query;

  res.status(200).json({
    success: true,
    data: {
      events,
      pagination: {
        page,
        limit,
        totalEventCount,
        pages: Math.ceil(totalEventCount / limit)
      }
    }
  });
});

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler('Invalid event ID', 400));
  }

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler('Event not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { event }
  });
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler('Invalid event ID', 400));
  }

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler('Event not found', 404));
  }

  // Update fields
  const allowedUpdates = ['name', 'description', 'date', 'location', 'metadata'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      event[field] = req.body[field];
    }
  });

  // Handle totalTickets update carefully
  if (req.body.totalTickets !== undefined) {
    const ticketsSold = event.totalTickets - event.availableTickets;
    if (req.body.totalTickets < ticketsSold) {
      return next(new ErrorHandler(
        `Cannot reduce total tickets below ${ticketsSold} (tickets already sold)`,
        400
      ));
    }
    event.availableTickets = req.body.totalTickets - ticketsSold;
    event.totalTickets = req.body.totalTickets;
  }

  await event.save();

  // Log event update
  await Logger.info('Event updated', {
    eventId: event._id,
    eventName: event.name,
    updatedBy: req.user.id
  }, req);

  res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: { event }
  });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler('Invalid event ID', 400));
  }

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler('Event not found', 404));
  }

  // Check if tickets have been sold
  const ticketsSold = event.totalTickets - event.availableTickets;
  if (ticketsSold > 0) {
    return next(new ErrorHandler(
      `Cannot delete event. ${ticketsSold} tickets have been sold.`,
      400
    ));
  }

  await Event.findByIdAndDelete(id);

  // Log event deletion
  await Logger.warning('Event deleted', {
    eventId: id,
    eventName: event.name,
    deletedBy: req.user.id
  }, req);

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
});

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
