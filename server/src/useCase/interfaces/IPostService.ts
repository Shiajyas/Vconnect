import { IPost } from "../../core/domain/interfaces/IPost";

export interface IPostService {
    createPost(userId: string, title: string,description:string, mediaUrls: string[]): Promise<IPost>;
    getPosts(userId: string, page: number, limit: number): Promise<IPost[]>;
    getPost(postId: string): Promise<IPost | null>;
    updatePost(userId: string, postId: string, content: string, images: string[]): Promise<IPost>;
    deletePost(userId: string, postId: string): Promise<void>;
    likePost(userId: string, postId: string): Promise<void>;
    unlikePost(userId: string, postId: string): Promise<void>;
    getUserPosts(userId: string, page: number, limit: number): Promise<IPost[]>;
    reportPost(userId: string, postId: string): Promise<void>;
}
