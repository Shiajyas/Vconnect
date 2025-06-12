// models/ReportModel.ts
import { Schema, model, } from 'mongoose';
import { IReport } from '../interfaces/IReport';

const reportSchema = new Schema<IReport>({
  reporter: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'post', required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const ReportModel = model<IReport>('Report', reportSchema);
