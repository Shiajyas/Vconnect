import { IUser } from "../../core/domain/interfaces/IUser";
import { IUserRepository } from "../../core/domain/interfaces/IUserRepository";
import User from "../../core/domain/models/userModel";

export class UserRepository implements IUserRepository {
  // Find a user by email
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await User.findOne({ email });
    return user ? (user.toObject() as IUser) : null;
  }

  // Find a user by username
  async findByUsername(username: string): Promise<IUser | null> {
    const user = await User.findOne({ username }).select("-password");
    return user ? (user.toObject() as IUser)  : null;
  }

  // Save a new user
  async save(user: IUser): Promise<IUser> {
    const newUser = new User(user);
    const savedUser = await newUser.save();
    return savedUser.toObject() as IUser;
  }

  // Find a user by ID
  async findById(id: string): Promise<IUser | null> {
    const user = await User.findById(id).select("-password");
    return user ? (user.toObject() as IUser) : null;
  }

  async findByEmailAndRole(email: string, role: string): Promise<IUser | null> {
    const user = await User.findOne({ email, role: role });
    console.log(user,3);
    
    return user ? (user.toObject() as IUser) : null;
  }

  async find(query: object): Promise<IUser[]> {
    try {
      const users = await User.find(query).select("-password");
      return users as IUser[]
    } catch (error) {
      throw new Error("Error finding users");
    }
  }

  async findByEmailAndUpdatePwd(email: string, passwordHash: string): Promise<boolean> {
    try {
      const result = await User.updateOne(
        { email },
        { $set: { password: passwordHash } } 
      );
  
      if (result.matchedCount === 0) {
        throw new Error("User not found");
      }
  
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("An unknown error occurred");
      }
      return false;
    }
  }
  
  
}
