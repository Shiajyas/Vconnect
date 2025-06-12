import express, { Application, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import http from 'http';
import redis from '../infrastructure/utils/redisClient';
import { initializeSocket } from '../infrastructure/socket/SocketServer';

export class App {
  public app: Application;
  private port: number;
  private server: http.Server;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.server = http.createServer(this.app);

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSocketServers();
  }

  private initializeMiddlewares(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(morgan('dev'));
    this.app.use(
      session({
        secret: 'test',
        resave: false,
        saveUninitialized: false,
      })
    );
  }

  private initializeRoutes(): void {
    this.app.get('/test', (req: Request, res: Response) => {
      res.status(200).json({ message: 'GET /test working' });
    });

    this.app.get('/health/redis', async (req: Request, res: Response) => {
      console.log('🔁 /health/redis hit');
      try {
        const pong = await redis.ping();
        console.log('✅ Redis ping:', pong);
        res.json({ status: 'ok', redis: pong });
      } catch (error) {
        console.error('❌ Redis health check failed', error);
        res.status(500).json({ status: 'error', message: 'Redis not reachable' });
      }
    });
  }

  private initializeSocketServers(): void {  
    initializeSocket(this.server);
  }     
   
  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`🚀 chat server running on http://localhost:${this.port}`);
    }); 
  }
}

export default App;
