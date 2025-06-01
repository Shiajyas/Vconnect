import mongoose, { Schema, Document } from "mongoose";
import { ISubscription } from "../interfaces/ISubscription";

const SubscriptionSchema = new Schema(
  {
    userId: { type: String, required: true },
    isSubscribed: { type: Boolean, default: false },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
