import { IUser } from './IUser';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  files?: Express.Multer.File;
}
