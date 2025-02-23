
import { IUser } from "../../core/domain/interfaces/IUser";

export interface IUserService {
    getSuggestions(userId: string): Promise<IUser[]>;

  }