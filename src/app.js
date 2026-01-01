const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const {
  generalLimiter,
  sanitizeData,
  preventHPP,
  sanitizeInput
} = require('./middleware/security');

const routes = require('./routes');

const app = express();

app.set('trust proxy', 1);

// SECURITY MIDDLEWARE

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'no-referrer'
  }
}));

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001'];

    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeData());
app.use(preventHPP());
app.use(sanitizeInput);

app.use('/api/', generalLimiter);

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Event & Ticket System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      bookings: '/api/bookings'
    },
  });
});

app.use('/api', routes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;
