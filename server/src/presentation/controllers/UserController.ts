import { Request, Response } from "express";
import { IUserService } from "../../useCase/interfaces/IUserService";
import { getErrorMessage } from "../../infrastructure/utils/errorHelper";
import { IUser } from "../../core/domain/interfaces/IUser";

export class UserController {
    private userService: IUserService;

    constructor(userService: IUserService) {
        this.userService = userService;
    }

    async getSuggestions(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as Request & { user?: IUser }).user?.id;
            if (!userId) {
                res.status(400).json({ message: "User ID is missing" });
                return;
            }
            const suggestions = await this.userService.getSuggestions(userId);
            res.json(suggestions);
        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async getFollowers(req: Request, res: Response): Promise<void> {
        console.log("reached follower");
        try {
            const { id } = req.params;
            const followers = await this.userService.getFollowers(id);
            // console.log(followers,">>>>>>>>>>>>>>folevers")
            res.json(followers);
        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async getFollowing(req: Request, res: Response): Promise<void> {
        console.log("reached following");   
        try {
            const { id } = req.params;
            const following = await this.userService.getFollowing(id);
            // console.log(following,">>>>>>>>>>>>>>folewing")
            res.json(following);
        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async   unfollowUser(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as Request & { user?: IUser }).user?.id;
            const { id: targetUserId } = req.params;

            if (!userId) {
                res.status(400).json({ message: "User ID is missing" });
                return;
            }

            await this.userService.unfollowUser(userId, targetUserId);
            res.json({ message: "Successfully unfollowed user" });
        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            console.log("reached profile");
            
            const userProfile = await this.userService.getProfile(id);
            // console.log(userProfile,">>>>>>>>>>>>>profile")
            res.json(userProfile);
        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async getUserPost(req: Request, res: Response): Promise <void>{
        try {
            const { id } = req.params;
            console.log("reached profile post");

            const userPost = await this.userService.getUserPost(id)
            // console.log(userPost,">>>>>>>>>>>>>profile")
            res.json(userPost);
        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async getUserSavedPost(req: Request, res: Response): Promise <void>{
        try {
            const { id } = req.params;
            console.log("reached profile post");

            const userPost = await this.userService.getUserSavedPost(id,1,10)
            // console.log(userPost,">>>>>>>>>>>>>profile")
            res.json(userPost);
        } catch (error) {
            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async updateUserprofile(req: Request, res: Response) {
        try {
          const userId = req.params.id;
          const updatedData = req.body;

          console.log("Received body:", req.body);
          console.log("Received file:", req.file);
          
          // Check if an avatar file is uploaded
          if (req.file) {
            updatedData.avatar = (req.file as unknown as { location: string }).location; // Store the file path in the database
          }
       console.log(updatedData, ">>>>>>>>>>>>> profile");
      
          const updatedUser = await this.userService.updateUserProfile(userId, updatedData);
      
          return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
          });
        } catch (error) {
          console.error("Error updating profile:", error);
          return res.status(500).json({ message: "Internal server error" });
        }
      }
      
}
