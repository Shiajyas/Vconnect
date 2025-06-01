// interfaces/IReportRepository.ts
import { Types } from "mongoose";
import { IReport } from "../../core/domain/interfaces/IReport";

export interface IReportRepository {
  create(report: Omit<IReport, "createdAt">): Promise<IReport>;
  getByPostId(postId: Types.ObjectId | string): Promise<IReport[]>;
  getAll(): Promise<IReport[]>;
  deleteById(reportId: Types.ObjectId | string): Promise<void>;
  fetchSingleReportedPost(postId: string, userId: string) : Promise<any>
}
