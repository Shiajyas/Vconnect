import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import session from "express-session";
import morgan from "morgan";
import corsMiddleware from "../presentation/middleware/corsMiddleware";
import userAuthRoutes from "../presentation/routes/users/userAuthRoutes";
import adminAuthRoutes from "../presentation/routes/admin/adminAuthRoutes";
import notificationRoutes from "../presentation/routes/users/notificationRoutes";
import postRoutes from "../presentation/routes/users/postRoutes";
import { userRoutes } from "../presentation/routes/users/userRoutes";
import http from "http";
import cookieParser from "cookie-parser";

// === SocketIO Chat/Call ===
import { initializeSocket } from "../infrastructure/socket/SocketServer";

import { Server as IOServer } from "socket.io";

export class App {
  public app: Application;
  private port: number;
  private server: http.Server;
  private mediaServer: http.Server;

  constructor(port: number) {
    this.app = express();
    this.port = port;

    // Main server
    this.server = http.createServer(this.app);

    // Media server (runs on a separate port or can be attached to same app with a different path)
    this.mediaServer = http.createServer(); // no express attached for lightweight streaming

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSocketServers();
  }

  private initializeMiddlewares(): void {
    this.app.use(corsMiddleware);
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      next();
    });

    this.app.use(bodyParser.json({ limit: "50mb" }));
    this.app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
    this.app.use(cookieParser());
    this.app.use(morgan("dev"));

    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "your-secure-random-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1000,
        },
      })
    );
  }

  private initializeRoutes(): void {
    this.app.get("/test", (req, res) => {
      res.status(200).json({ message: "GET route is working!" });
    });

    this.app.use("/api", userAuthRoutes);
    this.app.use("/api/admin", adminAuthRoutes);
    this.app.use("/api/users", userRoutes());
    this.app.use("/api/users/notification", notificationRoutes);
    this.app.use("/api/users/posts", postRoutes);
  }

  private async initializeSocketServers(): Promise<void> {
    // 1. Initialize standard chat/call socket
    initializeSocket(this.server);

    // 2. Initialize Media server with Redis adapter
    const io = new IOServer(this.mediaServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
      },
    });


  }

  //write the start method

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`Main server running on http://localhost:${this.port}`);
    });

    // Optional: choose separate port for media server
    const mediaPort = Number(process.env.MEDIA_PORT) || this.port + 1;
    this.mediaServer.listen(mediaPort, () => {
      console.log(`Media server running on http://localhost:${mediaPort}`);
    });
  }
}

export default App;
