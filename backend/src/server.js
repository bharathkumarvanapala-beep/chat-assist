import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import v1Router from './routes/v1/index.js';
import { zeroLogPolicy, validateInputPayload } from './middleware/privacyMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Privacy Configurations
app.use(cors({
  origin: '*', // Allow frontend development server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cloud-consent', 'x-admin-key']
}));

app.use(express.json({ limit: '500kb' })); // Allow payloads for bulk import
app.use(zeroLogPolicy); // Enforce zero logging of sensitive texts
app.use(validateInputPayload); // Sanitize and check inputs

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Hindi Assist Translation & Learning Backend',
    tagline: 'Understand every message. Reply naturally.',
    languages: ['English', 'Hindi', 'Telugu'],
    health: '/api/health',
    privacy: 'Zero-Log Policy Active'
  });
});

// API Routes (v1 REST endpoints and legacy routes)
app.use('/api/v1', v1Router);
app.use('/api', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested API route does not exist.' });
});

// Safe Error Handler (prevents leaking internal stack traces)
app.use((err, req, res, next) => {
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected processing error occurred. No user data was retained.'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  HINDI ASSIST BACKEND API (Privacy-First)`);
    console.log(`  Status: Running on http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Zero-Log Policy: ENABLED`);
    console.log(`  Default Cloud AI: OFF (On-device prioritized)`);
    console.log(`====================================================`);
  });
}

export default app;
