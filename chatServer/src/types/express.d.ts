import { IUser } from '../core/domain/interfaces/IUser';


declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
