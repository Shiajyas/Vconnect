import cors from 'cors';

const corsMiddleware = cors({
  origin: [
    'http://localhost:3001',
    'http://192.168.1.7:3001',
    'https://test-social-api-f.loca.lt',
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
});

export default corsMiddleware;
