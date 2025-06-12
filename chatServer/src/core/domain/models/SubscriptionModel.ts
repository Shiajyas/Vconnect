import mongoose, { Schema} from 'mongoose';
import { ISubscription } from '../interfaces/ISubscription';


const SubscriptionSchema = new Schema(
  {
    userId: { type: String, ref: 'user', required: true },
    isSubscribed: { type: Boolean, default: false },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    amount: { type: Number, default: 9.99 },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema,
);
