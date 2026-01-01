/**
 * Event Model
 * Mongoose schema for events stored in MongoDB
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [200, 'Event name cannot exceed 200 characters'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    minlength: [10, 'Event description must be at least 10 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(value) {
        // Only validate on creation or if date is being updated
        if (this.isNew || this.isModified('date')) {
          return value > new Date();
        }
        return true;
      },
      message: 'Event date must be in the future'
    },
    index: true
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    minlength: [3, 'Event location must be at least 3 characters']
  },
  totalTickets: {
    type: Number,
    required: [true, 'Total tickets count is required'],
    min: [1, 'Total tickets must be at least 1'],
    max: [100000, 'Total tickets cannot exceed 100,000'],
    validate: {
      validator: Number.isInteger,
      message: 'Total tickets must be an integer'
    }
  },
  availableTickets: {
    type: Number,
    required: true,
    min: [0, 'Available tickets cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Available tickets must be an integer'
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    comment: 'Flexible metadata for event details (speakers, tags, etc.)'
  },
  createdBy: {
    type: String,
    required: true,
    comment: 'User ID who created this event'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual property: Calculate tickets sold
 */
eventSchema.virtual('ticketsSold').get(function() {
  return this.totalTickets - this.availableTickets;
});

/**
 * Virtual property: Check if event is sold out
 */
eventSchema.virtual('isSoldOut').get(function() {
  return this.availableTickets === 0;
});

/**
 * Virtual property: Check if event is upcoming
 */
eventSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

/**
 * Indexes for efficient queries
 */
eventSchema.index({ date: 1 }); // Ascending date for upcoming events
eventSchema.index({ name: 'text', description: 'text' }); // Text search
eventSchema.index({ location: 1 }); // Search by location
eventSchema.index({ availableTickets: 1 }); // Filter by availability
eventSchema.index({ createdBy: 1 }); // Query by creator

/**
 * Pre-save hook: Set availableTickets initially
 */
eventSchema.pre('save', function(next) {
  if (this.isNew && this.availableTickets === undefined) {
    this.availableTickets = this.totalTickets;
  }
  next();
});

/**
 * Pre-save hook: Validate availableTickets <= totalTickets
 */
eventSchema.pre('save', function(next) {
  if (this.availableTickets > this.totalTickets) {
    next(new Error('Available tickets cannot exceed total tickets'));
  }
  next();
});

/**
 * Static method: Find upcoming events
 */
eventSchema.statics.findUpcoming = function(limit = 10) {
  return this.find({ date: { $gte: new Date() } })
    .sort({ date: 1 })
    .limit(limit);
};

/**
 * Static method: Find available events
 */
eventSchema.statics.findAvailable = function(limit = 10) {
  return this.find({
    date: { $gte: new Date() },
    availableTickets: { $gt: 0 }
  })
    .sort({ date: 1 })
    .limit(limit);
};

/**
 * Instance method: Check if tickets are available
 */
eventSchema.methods.hasAvailableTickets = function(count = 1) {
  return this.availableTickets >= count;
};

/**
 * Instance method: Book tickets (without saving)
 */
eventSchema.methods.reserveTickets = function(count) {
  if (!this.hasAvailableTickets(count)) {
    throw new Error(`Only ${this.availableTickets} tickets available`);
  }
  this.availableTickets -= count;
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
