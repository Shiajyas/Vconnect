import { IPostRepository } from "../interfaces/IPostRepository";
import { IPost } from "../../core/domain/interfaces/IPost";
import Post from "../../core/domain/models/postModel";

export class PostRepository implements IPostRepository {
    async createPost(userId: string, title: string,description:string, mediaUrls: string[]): Promise<IPost> {
        const newPost = new Post({ userId, title, description, mediaUrls });
        return await newPost.save();
    }

    async getPosts(userId: string, page: number, limit: number): Promise<{posts : IPost[]; nextPage: number | null}> {
        console.log(userId, page, limit, ">>>>userId 3*"); 
        let posts = await Post.find({})
            .populate("userId", "fullname avatar username") // Fetch user details
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip((page - 1) * limit)
            .limit(limit);

            const totalPosts = await Post.countDocuments({  });
            const totalPages = Math.ceil(totalPosts / limit);
            const nextPage = page < totalPages ? page + 1 : null; 
    
        
        // console.log(posts, ">>>>posts");
        return {posts,nextPage}; ;
    }
    

    async getPost(postId: string): Promise<IPost | null> {
        return await Post.findById(postId);
    }

    async updatePost(userId: string, postId: string, content: string, images: string[]): Promise<IPost | null> {
        return await Post.findOneAndUpdate(
            { _id: postId, userId },
            { content, images },
            { new: true }
        );
    }

    async deletePost(userId: string, postId: string): Promise<void> {
        await Post.findOneAndDelete({ _id: postId, userId });
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
}
