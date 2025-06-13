import cors from 'cors';

const corsMiddleware = cors({
  origin: [
    'http://localhost:3001',
    'http://192.168.1.7:3001',
    'https://vconnect-smoky.vercel.app',
    'https://vconnect.work.gd'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Requested-With',
    'bypass-tunnel-reminder',
  ],
  optionsSuccessStatus: 200,
});

export default corsMiddleware;
