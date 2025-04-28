import { IPostRepository } from "../interfaces/IPostRepository";
import { IPost } from "../../core/domain/interfaces/IPost";
import Post from "../../core/domain/models/postModel";
import mongoose from "mongoose";
import User from "../../core/domain/models/userModel";

export class PostRepository implements IPostRepository {
  async createPost(userId: string, title: string, description: string, mediaUrls: string[], visibility: "public" | "private"): Promise<IPost> {
    const newPost = new Post({ userId, title, description, mediaUrls, visibility });
    return await newPost.save();
}


async getPosts(
  userId: string, // Requesting user
  page: number, 
  limit: number
): Promise<{ posts: IPost[]; nextPage: number | null }> {

    // Fetch the logged-in user's following & followers list
    const user = await User.findById(userId).select("followers following");
    if (!user) throw new Error("User not found");

    // Get the IDs of followers and following users
    const allowedUserIds = [
      ...(user?.followers ?? []), 
      ...(user?.following ?? []), 
      userId
  ];
  
    // Query: Public posts OR Private posts from followed users
    const query = {
        $or: [
            { visibility: "public" }, // Public posts visible to all
            { userId: { $in: allowedUserIds }, visibility: "private" } // Private posts visible to followers & following
        ]
    };

    let posts = await Post.find(query)
        .populate("userId", "fullname avatar username")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);
    const nextPage = page < totalPages ? page + 1 : null;

    return { posts, nextPage };
}


    async getPost(postId: string): Promise<IPost | null> {
        return await Post.findById(postId)
        .populate("userId", "_id fullname avatar username");
    }

    async updatePost(
      postId: string, 
      userId: string, 
      title: string, 
      description: string, 
      mediaUrls?: string[]
    ): Promise<IPost | null> {
      try {
        console.log(postId, userId, title, description, mediaUrls, ">>>>>>32....");
    
        // Construct update object dynamically
        const updateFields: Partial<IPost> = { title, description };
    
        // Only update `mediaUrls` if it's provided and not empty
        if (mediaUrls && mediaUrls.length > 0) {
          updateFields.mediaUrls = mediaUrls;
        }
    
        const updatedPost = await Post.findOneAndUpdate(
          { _id: postId, userId }, // Ensures user can only update their own post
          { $set: updateFields }, // Dynamically set only provided fields
          { new: true } // Returns the updated document
        );
    
        if (!updatedPost) {
          throw new Error("Post not found or user not authorized to update");
        }
    
        return updatedPost;
      } catch (error) {
        console.error("Error updating post:", error);
        throw new Error("Failed to update post");
      }
    }
    
    
    async deletePost(postId: string, userId: string): Promise<boolean> {
      try {

        if (typeof postId !== "string" || typeof userId !== "string") {
          throw new Error("Invalid postId or userId");
        }
    
        await Post.findOneAndDelete({ _id: postId, userId });
        // console.log("success delete");
        return true;
      } catch (error) {
        console.log("delete post error", error);
        return false;
      }
    }
    
 
    async likePost(userId: string, postId: string): Promise<void> {
        await Post.findByIdAndUpdate(postId, { $addToSet: { likes: userId } });
    }

    async unlikePost(userId: string, postId: string): Promise<void> {
        await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
    }

    async getUserPosts(userId: string, page: number, limit: number): Promise<IPost[]> {
        return await Post.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
    }

    async reportPost(userId: string, postId: string): Promise<void> {
        await Post.findByIdAndUpdate(postId, { $addToSet: { reports: userId } });
    }

    async getPostOwner(postId: string): Promise<IPost | null> {
     return  await Post.findById(postId, "userId")
     .populate("userId", "fullname username avatar");
    }

async savePost(postId: string,userId: string ): Promise<boolean> {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const postObjectId = new mongoose.Types.ObjectId(postId);

    // Find the post
    const post = await Post.findById(postObjectId);
    if (!post) throw new Error("Post not found");

    const isAlreadySaved = post.saved.includes(userObjectId);

    let updatedPost;
    if (isAlreadySaved) {
      // If already saved, remove from the saved list (un-save)
      updatedPost = await Post.findByIdAndUpdate(
        postObjectId,
        { $pull: { saved: userObjectId } },
        { new: true }
      );
    } else {
      // Otherwise, add to saved list
      updatedPost = await Post.findByIdAndUpdate(
        postObjectId,
        { $addToSet: { saved: userObjectId } },
        { new: true }
      );
    }
    // console.log(updatedPost,">>>>>>>>>>>>");
          
    return !isAlreadySaved; // Return true if saved, false if unsaved
  } catch (error) {
    console.error("Error toggling save post:", error);
    return false;
  }
}

async getSavedPosts(
  userId: string,
  page = 1,
  limit = 10
): Promise<{ posts: IPost[]; nextPage: number | null }> {
  try {
    const savedPosts = await Post.find({ saved: userId })
      .skip((page - 1) * limit)
      .limit(limit + 1) // Fetch one extra to check if there's a next page
      .populate("userId", "username fullname avatar")
      .lean();

    const hasNextPage = savedPosts.length > limit;
    if (hasNextPage) savedPosts.pop(); // Remove the extra post used for checking

    return {
      posts: savedPosts,
      nextPage: hasNextPage ? page + 1 : null,
    };
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    return { posts: [], nextPage: null }; // Return a valid response even on error
  }
}



}
