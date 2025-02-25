import cors from "cors";

const corsMiddleware = cors({
  origin: ["http://localhost:3001","http://localhost:3009"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
});

export default corsMiddleware;
