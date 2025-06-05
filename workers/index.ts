import dotenv from 'dotenv';
dotenv.config();

// import { emailQueue } from '../lib/queue';
import './emailWorker';
import { startHealthServer } from './health.ts';

// Start health check server
const port = process.env.WORKER_PORT ? parseInt(process.env.WORKER_PORT) : 3001;
startHealthServer(port);

console.log('🚀 Worker started in', process.env.NODE_ENV || 'development');