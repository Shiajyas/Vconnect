import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../../core/domain/models/userModel";

interface DecodedToken {
  id: string;
}

export class AuthMiddleware {
  static async authenticate(req: Request & { user?: any }, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get token from Authorization header and strip "Bearer " prefix if present
      const token = req.header("Authorization")?.replace("Bearer ", "");
      console.log("Token:", token);

      // Check if token exists
      if (!token) {
         res.status(401).json({ msg: "Token is missing or invalid" });
         return
      }

      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "") as DecodedToken;

      // Check if the token is valid
      if (!decoded) {
        res.status(401).json({ msg: "Invalid token" });
        return
      }

      // Find user by ID from the decoded token
      const user = await User.findById(decoded.id);
      if (!user) {
        res.status(404).json({ msg: "User not found" });
        return
      }

      // Attach the user to the request object
      req.user = user;
      next();
    } catch (err: any) {
      console.error("Error in Auth Middleware:", err.message);

      if (err.name === "TokenExpiredError") {
        res.status(401).json({ msg: "Token has expired" });
        return 
      }

      res.status(500).json({ msg: "Internal server error" });
    }
  }
}

export default AuthMiddleware;
