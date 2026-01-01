/**
 * SystemLog Model
 * Mongoose schema for system activity logs stored in MongoDB
 */

const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: {
      values: ['info', 'warning', 'error', 'critical'],
      message: 'Log level must be one of: info, warning, error, critical'
    },
    default: 'info',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    maxlength: [200, 'Action cannot exceed 200 characters'],
    index: true
  },
  userId: {
    type: String,
    default: null,
    index: true,
    comment: 'User ID associated with this action'
  },
  eventId: {
    type: String,
    default: null,
    index: true,
    comment: 'Event ID associated with this action'
  },
  bookingId: {
    type: String,
    default: null,
    comment: 'Booking ID associated with this action'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    comment: 'Additional details about the action'
  },
  ipAddress: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true;
        // Basic IP validation (IPv4 and IPv6)
        const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Pattern.test(v) || ipv6Pattern.test(v) || v === '::1' || v === 'localhost';
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    default: null,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  responseTime: {
    type: Number,
    default: null,
    comment: 'Response time in milliseconds'
  },
  statusCode: {
    type: Number,
    default: null,
    comment: 'HTTP status code'
  }
}, {
  timestamps: false, // We use our own timestamp field
  collection: 'system_logs'
});

/**
 * Compound indexes for efficient queries
 */
systemLogSchema.index({ level: 1, timestamp: -1 });
systemLogSchema.index({ userId: 1, timestamp: -1 });
systemLogSchema.index({ action: 1, timestamp: -1 });
systemLogSchema.index({ timestamp: -1 }); // Most recent logs first

/**
 * Static method: Get recent logs
 */
systemLogSchema.statics.getRecent = function(limit = 50, level = null) {
  const query = level ? { level } : {};
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Static method: Get logs by user
 */
systemLogSchema.statics.getByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Static method: Get logs by level
 */
systemLogSchema.statics.getByLevel = function(level, startDate = null, endDate = null) {
  const query = { level };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return this.find(query).sort({ timestamp: -1 });
};

/**
 * Static method: Get error logs
 */
systemLogSchema.statics.getErrors = function(limit = 50) {
  return this.find({ level: { $in: ['error', 'critical'] } })
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Static method: Clean old logs (for maintenance)
 */
systemLogSchema.statics.cleanOldLogs = function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
    level: { $nin: ['error', 'critical'] } // Keep errors and critical logs
  });
};

/**
 * Static method: Get statistics
 */
systemLogSchema.statics.getStatistics = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$level',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

/**
 * Pre-save hook: Ensure timestamp is set
 */
systemLogSchema.pre('save', function(next) {
  if (!this.timestamp) {
    this.timestamp = new Date();
  }
  next();
});

/**
 * Instance method: Check if log is old
 */
systemLogSchema.methods.isOld = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return this.timestamp < cutoffDate;
};

const SystemLog = mongoose.model('SystemLog', systemLogSchema);

module.exports = SystemLog;
