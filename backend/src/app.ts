import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/index';
import routes from './routes/index';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:5000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: config.missingEnvVars.length === 0 ? 'ok' : 'degraded',
    environment: config.nodeEnv,
    missingEnvVars: config.missingEnvVars
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

app.use(errorHandler);

export default app;
