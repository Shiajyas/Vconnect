import { IUserService } from "./interfaces/IUserService";
import { IUserRepository } from "../data/interfaces/IUserRepository";
import { IUser } from "../core/domain/interfaces/IUser";
import { IPostRepository } from "../data/interfaces/IPostRepository";
import { IPost } from "../core/domain/interfaces/IPost";

export class UserService implements IUserService {
    private userRepository: IUserRepository;
    private postRepository : IPostRepository

    constructor(userRepository: IUserRepository, postRepository: IPostRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
    }

    async getSuggestions(userId: string): Promise<IUser[]> {
        const currentUser = await this.userRepository.findById(userId);
        if (!currentUser) {
            throw new Error("User not found");
        }
        const excludedUserIds = [...(currentUser.following || []), ...(currentUser.followers || []), userId];
        return this.userRepository.find({ _id: { $nin: excludedUserIds } });
    }

    async getFollowers(userId: string): Promise<IUser[]> {
        return this.userRepository.findFollowers(userId);
    }

    async getFollowing(userId: string): Promise<IUser[]> {
        return this.userRepository.findFollowing(userId);
    }

    async unfollowUser(userId: string, targetUserId: string): Promise<void> {
        await this.userRepository.unfollow(userId, targetUserId);
    }

    async getProfile(userId: string): Promise<IUser | null> {
        return this.userRepository.findById(userId);
    }

    async getUserPost(userId: string): Promise<any> {
        return this.postRepository.getUserPosts(userId,1,50)
    }

    async updateUserProfile(userId: string, updatedData: any): Promise <IUser|null> {
        try {
          const updatedUser = await this.userRepository.updateUserById(userId, updatedData);
    
          if (!updatedUser) {
            throw new Error("User not found");
          }
    
          return updatedUser;
        } catch (error) {
          throw error;
        }
      }

          async getUserSavedPost(userId: string, page: number, limit: number):  Promise<{posts : IPost[]; nextPage: number | null}> {
              // console.log(userId, page, limit, ">>>>userId 2*");
              let {posts,nextPage } = await this.postRepository.getSavedPosts(userId, page, limit);
              // console.log(posts, ">>>>posts 2*"); 
              
              return {posts,nextPage};
          }

}
