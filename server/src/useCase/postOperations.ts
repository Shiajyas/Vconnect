import { IPostService } from './interfaces/IPostService';
import { IPostRepository } from '../data/interfaces/IPostRepository';
import { IPost } from '../core/domain/interfaces/IPost';

export class PostService implements IPostService {
  private postRepository: IPostRepository;

  constructor(postRepository: IPostRepository) {
    this.postRepository = postRepository;
  }

  // Create a new post
  async createPost(
    userId: string,
    title: string,
    description: string,
    mediaUrls: string[],
    visibility: 'public' | 'private',
  ): Promise<IPost> {
    return await this.postRepository.createPost(
      userId,
      title,
      description,
      mediaUrls,
      visibility,
    );
  }

  async getPosts(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: IPost[]; nextPage: number | null }> {
    // console.log(userId, page, limit, ">>>>userId 2*");
    let { posts, nextPage } = await this.postRepository.getPosts(
      userId,
      page,
      limit,
    );
    // console.log(posts, ">>>>posts 2*");

    return { posts, nextPage };
  }

  // Retrieve a single post by ID
  async getPost(postId: string): Promise<IPost | null> {
    return await this.postRepository.getPost(postId);
  }

  // Update a post
  async updatePost(
    postId: string,
    userId: string,
    title: string,
    description: string,
    mediaUrls: string[],
  ): Promise<IPost> {
    const updatedPost = await this.postRepository.updatePost(
      postId,
      userId,
      title,
      description,
      mediaUrls,
    );

    if (!updatedPost) {
      throw new Error('Post not found or could not be updated');
    }

    return updatedPost;
  }

  // Delete a post
  async deletePost(userId: string, postId: string): Promise<void> {
    await this.postRepository.deletePost(userId, postId);
  }

  // Like a post
  async likePost(userId: string, postId: string): Promise<void> {
    await this.postRepository.likePost(userId, postId);
    const post = await this.postRepository.getPost(postId);
    console.log('likre >>>');
    if (!post) throw new Error('Post not found');
  }

  // Unlike a post
  async unlikePost(userId: string, postId: string): Promise<void> {
    await this.postRepository.unlikePost(userId, postId);
    const post = await this.postRepository.getPost(postId);
    console.log('unlikre >>>');
    if (!post) throw new Error('Post not found');
  }

  // Get posts by a specific user
  async getUserPosts(
    userId: string,
    page: number,
    limit: number,
  ): Promise<IPost[]> {
    return await this.postRepository.getUserPosts(userId, page, limit);
  }

  // Report a post
  async reportPost(userId: string, postId: string): Promise<void> {
    await this.postRepository.reportPost(userId, postId);
  }
}
