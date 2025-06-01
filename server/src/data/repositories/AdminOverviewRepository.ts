import Post from "../../core/domain/models/postModel";
import User from "../../core/domain/models/userModel";
import { CommentModel } from "../../core/domain/models/commentModel";
import SubscriptionModel from "../../core/domain/models/SubscriptionModel";
import dayjs from "dayjs";

export class AdminOverviewRepository {
  async fetchOverview(
    range: "7d" | "1m" | "1y" = "7d",
    likeRange: { min: number; max: number } = { min: 0, max: Infinity }
  ) {
    const now = new Date();
    const startDate = dayjs(now).subtract(
      range === "1y" ? 1 : range === "1m" ? 1 : 7,
      range === "1y" ? "year" : range === "1m" ? "month" : "day"
    ).toDate();

    const [
      totalUsers,
      newUsers,
      totalPosts,
      totalComments,
      reportedPosts,
      activeSubscriptions,
      newSubscriptions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Post.countDocuments(),
      CommentModel.countDocuments(),
      Post.countDocuments({ reports: { $exists: true, $not: { $size: 0 } } }),
      SubscriptionModel.countDocuments({ isSubscribed: true }),
      SubscriptionModel.countDocuments({ isSubscribed: true, createdAt: { $gte: startDate } }),
    ]);

    const weeklyUserGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const mostLikedPosts = await this.fetchMostLikedPosts(range, likeRange);

    const postingActivity = await Post.aggregate([
      {
        $group: {
          _id: "$userId",
          posts: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          username: "$user.username",
          posts: 1,
        },
      },
      { $sort: { posts: -1 } },
      { $limit: 5 },
    ]);

    return {
      users: {
        total: totalUsers,
        new: newUsers,
        weeklyGrowth: weeklyUserGrowth,
        postingActivity: postingActivity.map(({ username, posts }) => ({ username, posts })),
      },
      posts: {
        total: totalPosts,
        reported: reportedPosts,
        mostLiked: mostLikedPosts,
      },
      comments: { total: totalComments },
      subscriptions: { active: activeSubscriptions, new: newSubscriptions },
    };
  }

  // ✅ New Method: fetch most liked posts with filtering

async fetchMostLikedPosts(
  range: "7d" | "1m" | "1y" = "7d",
  likeRange: { min: number; max: number } = { min: 0, max: Infinity }
) {
  const now = new Date();
  const startDate = dayjs(now)
    .subtract(
      range === "1y" ? 1 : range === "1m" ? 1 : 7,
      range === "1y" ? "year" : range === "1m" ? "month" : "day"
    )
    .toDate();

  // Step 1: Filter and sort in-memory
  const posts = await Post.find({
    createdAt: { $gte: startDate },
  })
    .populate({
      path: "userId",
      select: "username fullname avatar", // or any user fields you want
    })
    .lean(); // makes it a plain JS object (faster if you're just reading)

    // console.log(posts, "posts");

  // Step 2: Filter and sort manually (since we can't use $size directly with populate)
  const filteredPosts = posts
    .map((post) => ({
      ...post,
      likesCount: post.likes?.length || 0,
    }))
    .filter(
      (post) =>
        post.likesCount >= likeRange.min && post.likesCount <= likeRange.max
    )
    .sort((a, b) => b.likesCount - a.likesCount)
    .slice(0, 5);
// console.log(filteredPosts, "filteredPosts");
  // Optional: format to return minimal fields
  return filteredPosts.map((post) => ({
    title: post.title,
    likes: post.likesCount,
    owner: post.userId.fullname, // or username
  }));
}




}
