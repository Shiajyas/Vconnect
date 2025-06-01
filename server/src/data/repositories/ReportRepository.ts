import { Types } from "mongoose";
import { ReportModel } from "../../core/domain/models/reportModel";
import { IReport } from "../../core/domain/interfaces/IReport";
import { IReportRepository } from "../interfaces/IReportRepository";
import Post from "../../core/domain/models/postModel";

export class ReportRepository implements IReportRepository {
  async create(report: Omit<IReport, "createdAt">): Promise<IReport> {
    const createdReport = new ReportModel(report);
    return await createdReport.save();
  }

  async getByPostId(postId: Types.ObjectId | string): Promise<IReport[]> {
    return await ReportModel.find({ postId })
      .populate("reporter", "username email")
      .exec();
  }

  async getAll(): Promise<IReport[]> {
    return await ReportModel.find()
      .populate("reporter", "username email")
      .exec();
  }

  async deleteById(reportId: Types.ObjectId | string): Promise<void> {
    await ReportModel.findByIdAndDelete(reportId).exec();
  }

  async fetchReportedPosts(
    range: "7d" | "1m" | "1y",
    page: number,
    limit: number
  ): Promise<any[]> {
    const now = new Date();
    let fromDate = new Date();

    switch (range) {
      case "7d":
        fromDate.setDate(now.getDate() - 7);
        break;
      case "1m":
        fromDate.setMonth(now.getMonth() - 1);
        break;
      case "1y":
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const reports = await ReportModel.find({ createdAt: { $gte: fromDate } })
      .populate("reporter", "username email")
      .populate({ path: "postId", select: "title description mediaUrls userId" })
      .lean()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const postIds = reports.map(r => r.postId?._id || r.postId).filter(Boolean);

    const posts = await Post.find({ _id: { $in: postIds } })
      .populate("userId", "username email")
      .lean();

    const postMap = new Map<string, any>(
      posts.map(post => [post._id.toString(), post])
    );

    return reports.map(report => {
      const rawPostId = report.postId?._id || report.postId;
      const hydratedPost = postMap.get(rawPostId?.toString());

      return {
        ...report,
        post: {
          ...hydratedPost,
          owner: hydratedPost?.userId,
        },
      };
    });
  }

async fetchSingleReportedPost(postId: string, userId: string): Promise<any> {
  const report = await ReportModel.findOne({ postId, reporter: userId })
    .populate("reporter", "username email")
    .populate({
      path: "postId",
      select: "title description mediaUrls userId",
      populate: { path: "userId", select: "username email" },
    })
    .lean()
    .exec();

  if (!report) return null;

  const post = await Post.findById(report.postId)  .populate("userId", "username email")
      .lean();

  return {
    ...report,
    post: {
      _id: post?._id,
      title: post?.title,
      description: post?.description,
      mediaUrls: post?.mediaUrls,
      owner: post?.userId,
    },
  };
}

async getTotalReportedPostsCount(): Promise<number> {
  return await ReportModel.countDocuments().exec();
}

}
