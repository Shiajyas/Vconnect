import { Request, Response } from "express";
import mongoose from "mongoose";
import { IUser } from "../../core/domain/interfaces/IUser";
import { getErrorMessage } from "../../infrastructure/utils/errorHelper";
import { setCookie } from "../../infrastructure/utils/setCookie";
import { IAuthService } from "../../useCase/interfaces/IAuthService";

interface AuthenticatedRequest extends Request {
    user?: IUser;
}


declare module "express-session" {
    interface Session {
        user?: IUser;
    }
}

export class AuthController {
    private userService: IAuthService;

    constructor(userService: IAuthService) {
        this.userService = userService;
    }


    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, role } = req.body;
       
            const loginResult = await this.userService.login(email, password, role);
        
            if (!loginResult) {
                res.status(400).json({ message: "Login failed." });
                return;
            }

            req.session.user = loginResult.user;

            const { token, refreshToken, user, } = loginResult;

            // console.log("token >>>>123", token);    
            

            // Check if the user is a Mongoose document, and convert to plain object if so
            const userObject: IUser = user instanceof mongoose.Document ? user.toObject() : user;

            const userWithoutPassword = { ...userObject, password: undefined };

            if(user.role !== "admin"){
                setCookie(res, "userToken", token);

            }else{
                setCookie(res, "adminToken", token);
            }

            setCookie(res, "refreshToken", refreshToken);
            
            res.status(200).json({
                msg: "Logged in Successfully!",
                user: userWithoutPassword,
            });

        } catch (error) {
            console.error(error);
            res.status(400).json({ message: getErrorMessage(error) });
        }
    }

    async requestOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            await this.userService.requestOtp(email);
            res.status(200).json({ msg: "OTP sent successfully." });
        } catch (error) {
            console.log(getErrorMessage(error), "error");

            res.status(400).json({ msg: getErrorMessage(error) });
        }
    }

    async register(req: Request, res: Response): Promise<void> {
        try {
        
            await this.userService.register(req.body);
            res.status(201).json({ message: "OTP sent successfully.", email: req.body.email });
        } catch (error) {
            console.log(getErrorMessage(error), "error");

            res.status(400).json({ message: getErrorMessage(error) });
        }
    }

    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email, enterdOtp } = req.body;
            const { accessToken, refreshToken, user } = await this.userService.verifyOtp(email, enterdOtp);

          
            setCookie(res, "refreshToken", refreshToken);
            setCookie(res, "accessToken", accessToken);
            res.status(200).json({
                message: "OTP verified successfully.",
                user,
            });
        } catch (error) {
            res.status(400).json({ message: getErrorMessage(error) });
        }
    }


    async getUser(req: Request, res: Response): Promise<void> {
        try {

            let userId = (req as AuthenticatedRequest).user?.id

         
            if (!userId) {
                res.status(400).json({ message: "Invalid request: User information is missing." });
                return;
            }


            const getUser = await this.userService.getUser(userId);

            if (!getUser) {
                res.status(404).json({ message: "User not found." });
                return;
            }

            res.status(200).json(getUser);
        } catch (error) {
            console.log(error, "error");

            res.status(500).json({ message: getErrorMessage(error) });
        }
    }

    async verify_Otp(req: Request, res: Response): Promise<void> {
        try {
            const { email, enterdOtp } = req.body;
            
            // Ensure correct deconstruction
            const { userData } = await this.userService.verify_Otp(email, enterdOtp);
    
        
            res.status(200).json({
                msg: "OTP verified successfully.",
                userData
            });
        } catch (error) {
            res.status(400).json({ msg: getErrorMessage(error) });
        }
    }
    
    async resendOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            console.log(email, "email");
            const success = await this.userService.resendOtp(email);
            if (!success) {
                res.status(400).json({ message: "Failed to send OTP." });
                return;
            }
            res.status(200).json({
                message: "New OTP sent successfully.",
                success: success,
            });
        } catch (error) {
            res.status(400).json({ msg: getErrorMessage(error) });
        }
    }
    
    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            console.log(req.body);

            let success = await this.userService.resetPassword(email, password);
            if (!success) {
                res.status(400).json({ message: "Failed to reset password." });
                return;
            }
            res.status(200).json({ message: "Password reset successfully." });
        } catch (error) {
            res.status(400).json({ msg: getErrorMessage(error) });
        }
    }


    async getAllUser(req: Request, res: Response): Promise<void> {
        try {
           
            const page = parseInt(req.query.page as string) || 1; // Default to page 1
            const limit = parseInt(req.query.limit as string) || 10; // Default to 10 items per page

           
            const { users, totalUsers, totalPages } = await this.userService.getAllUser(
                page,
                limit
            );

            if (!users) throw new Error("User list fetching failed");

            
            res.status(200).json({
                users,
                totalUsers,
                totalPages,
                currentPage: page,
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: getErrorMessage(error) });
        }
    }
    async googleAuth(req: Request, res: Response): Promise<void> {
        try {
            const { idToken } = req.body

            const { user, token, refreshToken } = await this.userService.googleAuth(idToken) as { user: IUser; token: string; refreshToken: string };
          
            setCookie(res, "refreshToken", refreshToken);
            setCookie(res, "userToken", token);
            if (!user) throw new Error("Google login faild")
            if (!token) throw new Error("Google login faild")
            res.status(200).json({ message: "User varified",user });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: getErrorMessage(error) });
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const incomingRefreshToken = req.cookies.refreshToken;
            if (!incomingRefreshToken ) {
                throw new Error("No refresh token found.");
            }
            const { token,  role,refreshToken } = await this.userService.refreshToken(incomingRefreshToken);
            if (!token || !role) {
                throw new Error("Failed to refresh token.");
            }
            
            setCookie(res, "refreshToken", refreshToken);
            setCookie(res, "userToken", token);
            res.status(200).json({ message: "Token refreshed successfully.",});
        } catch (error) {
            console.error(error,">>>>");
            res.status(400).json({ message: getErrorMessage(error) });
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        try {
            res.cookie('refreshToken', '', {
                httpOnly: true,
                secure: true, 
                sameSite: 'strict',
                expires: new Date(0), // Expire immediately
                path: '/', 
              });

              res.cookie('userToken', '', {
                httpOnly: true,
                secure: true, 
                sameSite: 'strict',
                expires: new Date(0), // Expire immediately
                path: '/', 
              });

              req.session.destroy((err) => {
                if (err) {  
                  console.error(err);}
                res.status(200).json({ message: "Logged out successfully.", ok : true });
              });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: getErrorMessage(error) });
        }
    }

    async adminLogout(req: Request, res: Response): Promise<void> {
        try {
            res.cookie('refreshToken', '', {
                httpOnly: true,
                secure: true, 
                sameSite: 'strict',
                expires: new Date(0), 
                path: '/', 
              });

              res.cookie('adminToken', '', {
                httpOnly: true,
                secure: true, 
                sameSite: 'strict',
                expires: new Date(0), 
                path: '/', 
              });

              req.session.destroy((err) => {
                if (err) {  
                  console.error(err);}
                res.status(200).json({ message: "Logged out successfully.", ok : true });
              });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: getErrorMessage(error) });
        }

    }

    async blockUser(req: Request, res: Response): Promise<void> {
        try {
            const { id: userId } = req.params; // Get userId from URL params
    
            if (!userId) {
                res.status(400).json({ message: "User ID is required to block a user." });
                return;
            }
    
            const blockedUser = await this.userService.blockUser(userId);
    
            if (!blockedUser) {
                res.status(400).json({ message: "Failed to block user." });
                return;
            }
    
            res.status(200).json({
                message: "User blocked successfully.",
                user: blockedUser,
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: getErrorMessage(error) });
        }
    }
    
    // Unblock a user
    async unblockUser(req: Request, res: Response): Promise<void> {
        try {
            const { id: userId } = req.params; // Get userId from URL params
    
            if (!userId) {
                res.status(400).json({ message: "User ID is required to unblock a user." });
                return;
            }
    
            const unblockedUser = await this.userService.unblockUser(userId);
    
            if (!unblockedUser) {
                res.status(400).json({ message: "Failed to unblock user." });
                return;
            }
    
            res.status(200).json({
                message: "User unblocked successfully.",
                user: unblockedUser,
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: getErrorMessage(error) });
        }
    }
    
}