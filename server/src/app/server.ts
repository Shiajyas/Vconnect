import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import session from "express-session";
import { logger } from "../infrastructure/utils/logger";
import corsMiddleware from "../presentation/middleware/corsMiddleware";
import userAuthRoutes from "../presentation/routes/users/userAuthRoutes"
import adminAuthRoutes from "../presentation/routes/admin/adminAuthRoutes"

// import authRoutes from "../../presentation/routes/authRoutes"

class App {
  public app: Application;
  private port: number;

  constructor(port: number) {
    this.app = express();
    this.port = port;

    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private initializeMiddlewares(): void {
    // CORS Middleware
    this.app.use(corsMiddleware);

    this.app.use((req:Request, res:Response, next:NextFunction) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      next();
    });

    // Session Middleware
    this.app.use(
      session({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Adjust for HTTPS
      })
    );


    // Body Parser Middleware
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // Logger Middleware
    this.app.use((req, res, next) => {
      logger(`Incoming request: ${req.method} ${req.url}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Test Route
    this.app.get("/test", (req, res) => {
      res.status(200).json({ message: "GET route is working!" });
    });

    // Authentication Routes
    this.app.use("/", userAuthRoutes);
    this.app.use("/admin", adminAuthRoutes );
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
    });
  }
}

export default App;
