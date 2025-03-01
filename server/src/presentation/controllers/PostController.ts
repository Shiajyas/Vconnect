import { Request, Response } from "express";
import { IPostService } from "../../useCase/interfaces/IPostService";
import { getErrorMessage } from "../../infrastructure/utils/errorHelper";
import { AuthenticatedRequest } from "../../core/domain/interfaces/IAuthenticatedRequest";
import { ICommentRepository } from "../../data/interfaces/ICommentRepository";

export class PostController {
    private postService: IPostService;
    private commentService: ICommentRepository

    constructor(postService: IPostService, commentService: ICommentRepository) {
        this.postService = postService;
        this.commentService = commentService;
    }

    async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
           
            let mediaUrls: string[] = [];
            if (req.files) {
                mediaUrls = (req.files as unknown as { location: string }[]).map((file: { location: string }) => file.location);
            }

          
              let { title, description } = req.body as unknown as { title: string; description: string };

            if (!req.user) {
                res.status(401).json({ message: "Unauthorized access." });
                return;
            }
            if (!mediaUrls.length) {
                res.status(400).json({ message: "Please add photo(s)." });
                return;
            }

            const newPost = await this.postService.createPost(req.user.id, title,description, mediaUrls);
            res.status(201).json({ message: "Post created successfully.", post: newPost });

        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async getPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const page = parseInt((req as unknown as Request).query.page as string) || 1;
            const limit = parseInt((req as unknown as Request).query.limit as string) || 10;
            
            const userId = req.user?.id as string;
  
            if (!userId) {
                res.status(401).json({ message: "Unauthorized access." });
                return;
            }
    
            const {posts,nextPage } = await this.postService.getPosts(userId, page, limit);
          
            res.status(200).json({ message: "Success", posts, nextPage });
    
        } catch (error) {
            console.error(error, ">>>>Error in getPosts Controller"); 

            res.status(500).json({ message: getErrorMessage(error) });
        }
    }
    
    async getPost(req:  AuthenticatedRequest, res: Response): Promise<void> {
        try {
         
            const post = await this.postService.getPost((req as unknown as Request).params.id);
         
            if (!post) {
                res.status(404).json({ message: "Post not found." });
                return;
            }
            res.status(200).json({ post });

        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async updatePost(req:  AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { content, images } = req.body as unknown as { content: string; images: string[] };
            const postId = (req as unknown as Request).params.id;

            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: "Unauthorized access." });
                return;
            }
            const updatedPost = await this.postService.updatePost(userId, postId, content, images);
            res.status(200).json({ message: "Post updated successfully.", post: updatedPost });

        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async deletePost(req:  AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: "Unauthorized access." });
                return;
            }
            await this.postService.deletePost(userId, (req as unknown as Request).params.id);
            res.status(200).json({ message: "Post deleted successfully." });

        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async likePost(req:  AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: "Unauthorized access." });
                return;
            }
            await this.postService.likePost(userId, (req as unknown as Request).params.id);
            res.status(200).json({ message: "Post liked successfully." });

        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async unlikePost(req:  AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: "Unauthorized access." });
                return;
            }
            await this.postService.unlikePost(userId, (req as unknown as Request).params.id);
            res.status(200).json({ message: "Post unliked successfully." });

        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async getUserPosts(req:  AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const page = parseInt((req as unknown as Request).query.page as string) || 1;
            const limit = parseInt((req as unknown as Request).query.limit as string) || 10;

            const posts = await this.postService.getUserPosts((req as unknown as Request).params.id, page, limit);
            res.status(200).json({ posts });

        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async reportPost(req:  AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: "Unauthorized access." });
                return;
            }
            await this.postService.reportPost(userId, (req as unknown as Request).params.id);
            res.status(200).json({ message: "Post reported successfully." });

        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

   async getPostComments(req:  AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const page = parseInt((req as unknown as Request).query.page as string) || 1;
            const limit = parseInt((req as unknown as Request).query.limit as string) || 10;
            console.log((req as unknown as Request).params.id, ">>>>33335664 1*");
            const comments = await this.commentService.getCommentsForPost((req as unknown as Request).params.id, page, limit);
            // console.log("comments >>>", comments);
            
            res.status(200).json({ comments });

        } catch (error) {
            console
            .log(error, ">>>>Error in getPostComments Controller");
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }
   
}
