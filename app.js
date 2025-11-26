const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const mongoHost = process.env.MONGO_HOST || 'mongo';
const mongoUser = process.env.MONGO_INITDB_ROOT_USERNAME || 'root';
const mongoPass = process.env.MONGO_INITDB_ROOT_PASSWORD || 'example';
const mongoDb   = process.env.MONGO_DB || 'appdb';

const mongoUri = process.env.MONGO_URI
  || `mongodb://${mongoUser}:${encodeURIComponent(mongoPass)}@${mongoHost}:27017/${mongoDb}?authSource=admin`;

function connectWithRetry(attempts = 0) {
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connected to db'))
  .catch((err) => {
    console.log(`Mongo connect failed (attempt ${attempts}):`, err.message);
    setTimeout(() => connectWithRetry(attempts + 1), 3000);
  });
}

connectWithRetry();

// Add cookie parser middleware
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

// CORS configuration
app.use((req, res, next) => {
    const origin = req.get('origin');
    
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
});

// Serve static frontend files
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log(' CSRF Test endpoint called!');
  console.log('Request headers:', req.headers);
  console.log('Request origin:', req.get('origin'));
  console.log('Cookies:', req.cookies);
  res.json({ 
    message: 'Hello World from CSRF target endpoint!', 
    timestamp: new Date().toISOString(),
    status: 'success',
    csrf_demo: 'This endpoint was called by CSRF attack!'
  });
});

// Routes
const userRoutes = require('./routes/user');
app.use('/api/auth', userRoutes);

module.exports = app;