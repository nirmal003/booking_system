const SystemLog = require('../models/Mongoose/systemLog');

class Logger {
  static async log(level, action, details = {}, req = null) {
    try {
      const logEntry = {
        level,
        action,
        details,
        timestamp: new Date()
      };

      // Extract user info if available
      if (req && req.user) {
        logEntry.userId = req.user.id.toString();
      }

      // Extract IP and User Agent
      if (req) {
        logEntry.ipAddress = req.ip || req.connection.remoteAddress;
        logEntry.userAgent = req.get('user-agent');
      }

      // Add event ID if present in details
      if (details.eventId) {
        logEntry.eventId = details.eventId.toString();
      }

      await SystemLog.create(logEntry);
    } catch (error) {
      console.error('Failed to create system log:', error);
    }
  }

  static async info(action, details = {}, req = null) {
    return this.log('info', action, details, req);
  }

  static async warning(action, details = {}, req = null) {
    return this.log('warning', action, details, req);
  }

  static async error(action, details = {}, req = null) {
    return this.log('error', action, details, req);
  }

  static async critical(action, details = {}, req = null) {
    return this.log('critical', action, details, req);
  }
}

module.exports = Logger;
