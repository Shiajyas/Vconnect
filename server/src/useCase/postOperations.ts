import { IPostService } from "./interfaces/IPostService";
import { IPostRepository } from "../data/interfaces/IPostRepository";
import { IPost } from "../core/domain/interfaces/IPost";
import { ISocketHandlers } from "./interfaces/ISocketHandlers";
import { NotificationHelper } from "../infrastructure/utils/NotificationHelper";
import { Socket } from "socket.io";

export class PostService implements IPostService {
    private postRepository: IPostRepository;
  

    constructor(postRepository: IPostRepository, ) {
        this.postRepository = postRepository;
    }

    // Create a new post
    async createPost(userId: string, title: string,description:string, mediaUrls: string[]): Promise<IPost> {
        const newPost = await this.postRepository.createPost(userId, title,description, mediaUrls);
        
        const notificationMessage = NotificationHelper.createNotification(
            userId,
            userId,
            "A new post was created",
            "post",
            newPost._id as string
        );

        return newPost;
    }

    // Retrieve paginated posts
    async getPosts(userId: string, page: number, limit: number): Promise<IPost[]> {
        return await this.postRepository.getPosts(userId, page, limit);
    }

    // Retrieve a single post by ID
    async getPost(postId: string): Promise<IPost | null> {
        return await this.postRepository.getPost(postId);
    }

    // Update a post
    async updatePost(userId: string, postId: string, content: string, images: string[]): Promise<IPost> {
        const updatedPost = await this.postRepository.updatePost(userId, postId, content, images);
        if (!updatedPost) {
            throw new Error('Post not found or could not be updated');
        }

        const notificationMessage = NotificationHelper.createNotification(
            updatedPost.user.toString(),
            userId,
            "Your post was updated",
            "post_update",
            postId
        );

        return updatedPost;
    }

    // Delete a post
    async deletePost(userId: string, postId: string): Promise<void> {
        await this.postRepository.deletePost(userId, postId);

        const notificationMessage = NotificationHelper.createNotification(
            userId,
            "System",
            "Your post was deleted",
            "post_delete",
            postId
        );

    }

    // Like a post
    async likePost(userId: string, postId: string): Promise<void> {
        await this.postRepository.likePost(userId, postId);
        const post = await this.postRepository.getPost(postId);
        
        if (!post) throw new Error("Post not found");

        const notificationMessage = NotificationHelper.createNotification(
            post.user._id.toString(),
            userId,
            `Your post was liked by ${userId}`,
            "like",
            postId
        );

    }

    // Unlike a post
    async unlikePost(userId: string, postId: string): Promise<void> {
        await this.postRepository.unlikePost(userId, postId);
    }

    // Get posts by a specific user
    async getUserPosts(userId: string, page: number, limit: number): Promise<IPost[]> {
        return await this.postRepository.getUserPosts(userId, page, limit);
    }

    // Report a post
    async reportPost(userId: string, postId: string): Promise<void> {
        await this.postRepository.reportPost(userId, postId);

        const notificationMessage = NotificationHelper.createNotification(
            "admin",
            userId,
            `Post ${postId} was reported by user ${userId}`,
            "report",
            postId
        );

    }
}
