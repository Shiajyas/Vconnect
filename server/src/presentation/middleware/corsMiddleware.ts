import cors from "cors";

const corsMiddleware = cors({
  origin: "http://localhost:3001",
  credentials: true,
});

export default corsMiddleware;
