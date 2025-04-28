import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import session from "express-session";
import morgan from "morgan";
import corsMiddleware from "../presentation/middleware/corsMiddleware";
import userAuthRoutes from "../presentation/routes/users/userAuthRoutes";
import adminAuthRoutes from "../presentation/routes/admin/adminAuthRoutes";
import notificationRoutes from "../presentation/routes/users/notificationRoutes";
import postRoutes from "../presentation/routes/users/postRoutes";
import {userRoutes} from "../presentation/routes/users/userRoutes"; 
import http from "http"; 
import {initializeSocket} from "../infrastructure/socket/SocketServer";
import cookieParser from "cookie-parser";



class App {
  public app: Application;
  private port: number;
  private server: http.Server;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.server = http.createServer(this.app);

    this.initializeMiddlewares();
    initializeSocket(this.server);
    this.initializeRoutes();
  }

  private initializeMiddlewares(): void {
    this.app.use(corsMiddleware);
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      next();
    });

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true, }));
    this.app.use(cookieParser());
    this.app.use(morgan("dev")); 
    

    // Express-Session Setup
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "your-secure-random-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: false, // Secure only in production
          sameSite: "lax" ,
          maxAge: 24 * 60 * 60 * 1000, // 1-day expiration
        },
      })
    );

    this.app.use((req, res, next) => {
      next();
    });
  }

  private initializeRoutes(): void {
    this.app.get("/test", (req, res) => {
      res.status(200).json({ message: "GET route is working!" });
    });

    this.app.use("/api", userAuthRoutes);
    this.app.use("/api/admin", adminAuthRoutes);
    this.app.use("/api/users", userRoutes())
    this.app.use("/api/users/notification",notificationRoutes)
    this.app.use("/api/users/posts", postRoutes);
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
    });
  }
}

export default App;
