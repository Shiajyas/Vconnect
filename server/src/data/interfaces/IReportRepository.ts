import { Types } from "mongoose";
import { IReport } from "../../core/domain/interfaces/IReport";

export interface IReportRepository {
  create(report: Omit<IReport, "createdAt">): Promise<IReport>;
  getByPostId(postId: Types.ObjectId | string): Promise<IReport[]>;
  getAll(): Promise<IReport[]>;
  deleteById(reportId: Types.ObjectId | string): Promise<void>;
  fetchSingleReportedPost(postId: string, userId: string): Promise<any>;

  /** New methods added below **/
  fetchReportedPosts(
    range: "7d" | "1m" | "1y",
    page: number,
    limit: number
  ): Promise<any[]>;

  getTotalReportedPostsCount(): Promise<number>;

  blockPostById(postId: string): Promise<void>;
}
