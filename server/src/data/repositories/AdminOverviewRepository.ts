import Post from "../../core/domain/models/postModel";
import User from "../../core/domain/models/userModel";
import { CommentModel } from "../../core/domain/models/commentModel";
import SubscriptionModel from "../../core/domain/models/SubscriptionModel";
import dayjs from "dayjs";

export class AdminOverviewRepository {
  async fetchOverview() {
    const now = new Date();
    const oneWeekAgo = dayjs(now).subtract(7, "day").toDate(); // 7 days ago

    const [totalUsers, newUsers, totalPosts, totalComments, reportedPosts, activeSubscriptions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Post.countDocuments(),
      CommentModel.countDocuments(),
      Post.countDocuments({ reports: { $exists: true, $not: { $size: 0 } } }),
      SubscriptionModel.countDocuments({ isSubscribed: true }),
    ]);

    const weeklyUserGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const topHashtags = await Post.aggregate([
      {
        $project: {
          hashtags: {
            $filter: {
              input: { $split: ["$description", " "] },
              as: "word",
              cond: { $regexMatch: { input: "$$word", regex: /^#/ } },
            },
          },
        },
      },
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return {
      users: { total: totalUsers, new: newUsers, weeklyGrowth: weeklyUserGrowth },
      posts: { total: totalPosts, reported: reportedPosts },
      comments: { total: totalComments },
      subscriptions: { active: activeSubscriptions },
      hashtags: topHashtags,
    };
  }
}
