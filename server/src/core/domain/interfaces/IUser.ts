import mongoose, { Document } from "mongoose";

// Make sure `id` is required
export interface IUser extends Document {
  _id: string;  // Explicitly define `_id` as a required field
  fullname: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  role: string;
  gender?: string;
  mobile?: string;
  address?: string;
  saved?: mongoose.Types.ObjectId[];
  story?: string;
  website?: string;
  followers?: mongoose.Types.ObjectId[];
  following?: mongoose.Types.ObjectId[];
  subscription?: {
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
  };
  isBlocked: boolean

  findFollowers(userId: string): Promise<IUser[]>;
  findFollowing(userId: string): Promise<IUser[]>;

}
