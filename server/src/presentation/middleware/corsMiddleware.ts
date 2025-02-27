import cors from "cors";

const corsMiddleware = cors({
  origin: ["http://localhost:3001","http://192.168.1.2:3001"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
});

export default corsMiddleware;
