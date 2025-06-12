// interfaces/IReport.ts
import { Types } from 'mongoose';

export interface IReport {
  reporter: Types.ObjectId; // user who reports
  postId: Types.ObjectId;
  // the post being reported
  reason: string;
  createdAt?: Date;
}
