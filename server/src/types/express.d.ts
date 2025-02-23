import { IUser } from "../core/domain/interfaces/IUser";
import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
