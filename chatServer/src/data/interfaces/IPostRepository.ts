import { IPost } from '../../core/domain/interfaces/IPost';

export interface IPostRepository {
  createPost(
    userId: string,
    title: string,
    description: string,
    mediaUrls: string[],
    visibility: 'public' | 'private',
  ): Promise<IPost>;
  getPosts(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: IPost[]; nextPage: number | null }>;
  getPost(postId: string): Promise<IPost | null>;
  updatePost(
    postId: string,
    userId: string,
    title: string,
    description: string,
    mediaUrls: string[],
  ): Promise<IPost | null>;
  deletePost(userId: string, postId: string): Promise<boolean>;
  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;
  getUserPosts(userId: string, page: number, limit: number): Promise<IPost[]>;
  reportPost(userId: string, postId: string): Promise<void>;
  getPostOwner(postId: string): Promise<IPost | null>;
  savePost(userId: string, postId: string): Promise<boolean>;
  getSavedPosts(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: IPost[]; nextPage: number | null }>;
  searchPosts(query: string): Promise<IPost[]>;
}
