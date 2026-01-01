const express = require('express');
const router = express.Router();

const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/eventController');
const { createEventSchema, updateEventSchema, paginationSchema } = require('../validators/schemas');
const validate = require('../validators/validate');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', validate(paginationSchema, 'query'), getEvents);
router.get('/:id', getEventById);

// Protected routes - Admin only
router.post('/', authenticate, authorize('admin'), validate(createEventSchema), createEvent);
router.put('/:id', authenticate, authorize('admin'), validate(updateEventSchema), updateEvent);
router.delete('/:id', authenticate, authorize('admin'), deleteEvent);

module.exports = router;
