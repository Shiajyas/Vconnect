import { IUser } from "./IUser";

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  save(user: IUser): Promise<IUser>;
  findById(id: unknown): Promise<IUser | null>;
  findByEmailAndRole(email: string, role: string): Promise<IUser | null>
  find(query: object): Promise<IUser[]>;
  findByEmailAndUpdatePwd(email:string,passwordHash: string) : Promise <Boolean>
}
