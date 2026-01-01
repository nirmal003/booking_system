const express = require('express');
const router = express.Router();

const { bookTicket, getMyTickets, getBookingById, cancelBooking } = require('../controllers/bookingController');
const { bookTicketSchema, paginationSchema } = require('../validators/schemas');
const validate = require('../validators/validate');
const { authenticate } = require('../middleware/auth');
const { bookingLimiter } = require('../middleware/security');

// All booking routes require authentication
router.use(authenticate);

router.post('/', bookingLimiter, validate(bookTicketSchema), bookTicket);
router.get('/my-tickets', validate(paginationSchema, 'query'), getMyTickets);
router.get('/:id', getBookingById);
router.delete('/:id', cancelBooking);

module.exports = router;
