/**
 * API Routes Aggregator
 *
 * Combines all route modules into a single router
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const eventRoutes = require('./eventRoutes');
const bookingRoutes = require('./bookingRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/bookings', bookingRoutes);

// API root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Event & Ticket System API v1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refreshtoken: 'POST /api/auth/refresh-token',
        profile: 'GET /api/auth/profile',
        logout: 'GET /api/auth/logout',

      },
      events: {
        list: 'GET /api/events',
        get: 'GET /api/events/:id',
        create: 'POST /api/events (Admin)',
        update: 'PUT /api/events/:id (Admin)',
        delete: 'DELETE /api/events/:id (Admin)'
      },
      bookings: {
        create: 'POST /api/bookings',
        myTickets: 'GET /api/bookings/my-tickets',
        get: 'GET /api/bookings/:id',
        cancel: 'DELETE /api/bookings/:id'
      }
    }
  });
});

module.exports = router;
