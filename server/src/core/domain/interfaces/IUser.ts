import mongoose, {  Document } from "mongoose";


export interface IUser extends Document {
  fullname: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  role?: string;
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
}
