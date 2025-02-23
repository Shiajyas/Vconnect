
import { IUser } from "../../core/domain/interfaces/IUser";

export interface InotificationService{
    getUnreadCount(userId: string): Promise<number>;
}