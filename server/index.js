import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import familyRoutes from './routes/families.js';
import iuranRoutes from './routes/iuran.js';
import statistikRoutes from './routes/statistik.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/khaul-massal';

mongoose.connect(MONGODB_URI, {
  bufferCommands: false,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 5
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Routes
    app.use('/api/families', familyRoutes);
    app.use('/api/iuran', iuranRoutes);
    app.use('/api/statistik', statistikRoutes);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        message: 'Khaul Massal API is running',
        timestamp: new Date().toISOString()
      });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ 
        error: 'Terjadi kesalahan pada server',
        message: err.message 
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ 
        error: 'Endpoint tidak ditemukan' 
      });
    });

    // Start server only after successful database connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:3000`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });