import { IUser } from "../../core/domain/interfaces/IUser";

export interface IUserRepository {
  // Find a user by email
  findByEmail(email: string): Promise<IUser | null>;

  // Find a user by username
  findByUsername(username: string): Promise<IUser | null>;

  // Save a new user
  save(user: IUser): Promise<IUser>;

  // Find a user by ID
  findById(id: unknown): Promise<IUser | null>;

  // Find a user by email and role
  findByEmailAndRole(email: string, role: string): Promise<IUser | null>;

  // Find users based on a query
  find(query: object): Promise<IUser[]>;

  // Update user password by email
  findByEmailAndUpdatePwd(email: string, passwordHash: string): Promise<boolean>;

  // Find users and count based on a query (for pagination)
  findAndCount(
    query: object,
    page: number,
    limit: number
  ): Promise<{ users: IUser[]; totalCount: number }>;

  update(query: object, update: object): Promise<void>;

  updateById(id: string, update: Partial<IUser>): Promise<IUser | null> 
}