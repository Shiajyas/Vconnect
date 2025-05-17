import { Request, Response } from "express";
import { IUserService } from "../../useCase/interfaces/IUserService";
import { getErrorMessage } from "../../infrastructure/utils/errorHelper";
import { IUser } from "../../core/domain/interfaces/IUser";
import { ISubscriptionUseCase } from "../../useCase/interfaces/ISubscriptionUseCase";
import { CallHistoryRepository } from "../../data/repositories/CallHistoryRepository";
import { ICallHistoryRepository } from "../../data/interfaces/ICallHistoryRepository";
import stripePackage from "stripe";
import axios from 'axios';

const stripe = new stripePackage(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2025-02-24.acacia" });


export class UserController {
    private userService: IUserService;
    private SubscriptionUseCase: ISubscriptionUseCase;
    private callHistoryRepository: ICallHistoryRepository;
    constructor(userService: IUserService, SubscriptionUseCase: ISubscriptionUseCase, callHistoryRepository: ICallHistoryRepository) {
        this.callHistoryRepository = callHistoryRepository;
        this.userService = userService;
        this.SubscriptionUseCase = SubscriptionUseCase
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

      async getSubscription(req: Request, res: Response) {
        const userId = req.params.id;
        // const { userId } = req.body;
        console.log("try to get subscription",userId);
        try {
          const subscription = await this.SubscriptionUseCase.getUserSubscription(userId);
          if (!subscription) return res.status(404).json({ message: "No subscription found" });
          console.log(subscription, ">>>>>>>>>>>>subscription")
          res.status(200).json(subscription);
        } catch (error) {
          res.status(500).json({ message: "Server error", error });
        }
      }

   async subscribe(req: Request, res: Response) {
        console.log("➡️ Processing subscription...");

       const { userId } = req.body;
  
  try {
    
    // Create a PaymentIntent instead of a Charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10
      currency: "usd",
      automatic_payment_methods: { enabled: true }, // Supports Google Pay, Apple Pay, etc.
    });

    if (!paymentIntent.client_secret) {
      console.error("❌ Failed to create PaymentIntent");
      return res.status(500).json({ message: "Failed to create PaymentIntent" });
    }

    console.log("✅ PaymentIntent created:", paymentIntent.id);

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Payment error:", error);
    return res.status(500).json({ message: "Payment error", error });
  }
      }


      

async confirmSubscription(req: Request, res: Response) {
  const { userId } = req.body;
  console.log(`🔄 Confirming subscription for user: ${userId}`);

  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 1);

    const subscription = await this.SubscriptionUseCase.createOrUpdateSubscription(userId, startDate, endDate);

    //  Call n8n webhook asynchronously
    // axios.post('http://localhost:5678/webhook/subscription-confirmed', {
    //   userId,
    //   subscription,
    // }).catch(err => {
    //   console.error("⚠️ Failed to send n8n webhook:", err.message);
    // });

    return res.status(200).json({ 
      message: "✅ Subscription confirmed successfully!",
      subscription,
    });
  } catch (error) {
    console.error("❌ Subscription update failed:", error);
    return res.status(500).json({ message: "Subscription update failed", error });
  }
}

      // get subscription history
      async getSubscriptionHistory(req: Request, res: Response) {
        const userId = req.params.id;
        console.log(userId, "userId in subscription history controller");
        try {
            const subscriptionHistory = await this.SubscriptionUseCase.getUserSubscriptionHistory(userId);
            // console.log(subscriptionHistory, ">>>>>>>>>>>>subscription")
            res.status(200).json(subscriptionHistory);
        } catch (error) {
            console.error("Error fetching subscription history:", error);
            res.status(500).json({ message: "Internal server error" });
        }
      }

      getCallHistory = async (req: Request, res: Response) => {
        const userId = req.params.id;
        console.log(userId, "userId in call history controller");
        try {
            const callHistory = await this.callHistoryRepository.getUserCallHistory(userId);
            res.status(200).json(callHistory);
        } catch (error) {
            console.error("Error fetching call history:", error);
            res.status(500).json({ message: "Internal server error" });
        }
      }

      async uploadMedia(req: Request, res: Response) {
        try {
            const files = req.files as Express.Multer.File[];
            console.log(req, "files in upload media 2");
            console.log(files, "files in upload media");
            const fileUrls = files?.map(file => (file as unknown as { location: string }).location);
            console.log(fileUrls, "file urls");
            res.status(200).json({ fileUrls });
        } catch (error) {
            console.error("Error uploading media:", error);
            res.status(500).json({ message: "Internal server error" });
        }
      }
      
}
