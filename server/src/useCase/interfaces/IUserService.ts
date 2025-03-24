
import { IUser } from "../../core/domain/interfaces/IUser";
import { IPost } from "../../core/domain/interfaces/IPost";

export interface IUserService {
    getSuggestions(userId: string): Promise<IUser[]>;
    getFollowers(userId: string): Promise<IUser[]> 
    getFollowing(userId: string): Promise<IUser[]> 
    unfollowUser(userId: string, targetUserId: string): Promise<void> 
    getProfile(userId: string): Promise<IUser | null> 
    getUserPost(userId: string): Promise<any>
    updateUserProfile(userId: string, updatedData: any): Promise <IUser|null>
    getUserSavedPost(userId: string, page: number, limit: number):  Promise<{posts : IPost[]; nextPage: number | null}>
  }