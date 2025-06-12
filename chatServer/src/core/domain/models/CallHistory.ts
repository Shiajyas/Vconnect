import mongoose, { Schema } from 'mongoose';
import { ICallHistory } from '../interfaces/ICallHistory';

const CallHistorySchema: Schema = new Schema(
  {
    callerId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    callType: { type: String, enum: ['voice', 'video'], required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    duration: { type: Number, required: true }, 
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat' },
  },
  { timestamps: true },
);

export default mongoose.model<ICallHistory>('CallHistory', CallHistorySchema);
