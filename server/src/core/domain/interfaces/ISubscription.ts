import mongoose, {  Document } from "mongoose";

export interface ISubscription extends Document {
  userId: string;
  isSubscribed: boolean;
  startDate: Date;
  endDate: Date;
}