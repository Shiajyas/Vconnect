import { IUser } from "../../core/domain/interfaces/IUser";

export const tempStorage: { [key: string]: { otp: string; userData: IUser; generatedAt: number } } = {};
