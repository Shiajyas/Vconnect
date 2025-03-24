import { IUser } from "../core/domain/interfaces/IUser";
import { IUserRepository } from "../data/interfaces/IUserRepository";
import { verifyGoogleToken } from "../infrastructure/utils/googleAuthUtils";
import { IAuthService } from "./interfaces/IAuthService";
import { createAccessToken, createRefreshToken } from "../infrastructure/utils/createTokens";
import bcrypt from "bcryptjs";
import User from "../core/domain/models/userModel";
import { IOtpService } from "../infrastructure/services/interfaces/IOtpService";
import jwt from "jsonwebtoken";

export class AuthService implements IAuthService {
  private userRepository: IUserRepository;
  private otpService: IOtpService;

  constructor(userRepository: IUserRepository, otpService: IOtpService) {
    this.userRepository = userRepository;
    this.otpService = otpService;
  }

  // Register user and initiate OTP
  async register(user: IUser): Promise<void> {
    const { email, username, password } = user;


    if (await this.userRepository.findByEmail(email)) {
      throw new Error("Email is already registered.");
    }

    if (await this.userRepository.findByUsername(username)) {
      throw new Error("Username is already taken.");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    
    const otp = this.otpService.generateOtp(email);
    console.log("otp for register use : ",otp);
    
    const userData: IUser = { ...user, otp } as unknown as IUser;

    
    const isOtpSent = await this.otpService.sendOtpEmail(email, otp) as boolean;
    if (!isOtpSent) {
      throw new Error("Failed to send OTP via email.");
    }
    this.otpService.storeOtp(email, otp, userData);
  }

  async sentOtp(email: string): Promise<{ emailSend: boolean }> {
    const otp = this.otpService.generateOtp(email);
    const isOtpSent: boolean = await this.otpService.sendOtpEmail(email, otp) as boolean;
    return { emailSend: isOtpSent };
  }


  async verifyOtp(email: string, enterdOtp: string): Promise<{ accessToken: string; refreshToken: string; user: IUser; }> {
    console.log(enterdOtp,"Enterd Otp");
    const { valid, expired } = this.otpService.verifyOtp(email, enterdOtp);
    console.log(valid, expired );
    

    if (expired) {
      throw new Error("OTP has expired, please request a new one.");
    }

    if (!valid) {
      throw new Error("Invalid OTP, please try again.");
    }


    const userData = this.otpService.getUserData(email);
    if (!userData) {
      throw new Error("User data not found.");
    }

    // Create the user and save to the database
    const user = await this.createUser(userData as IUser);

    const { accessToken, refreshToken } = this.generateTokens({
      id: user._id as string,
      role: user.role || "user",
      subscription: {
        isActive: user.subscription?.isActive || false,
        startDate: user.subscription?.startDate || new Date(),
        endDate: user.subscription?.endDate || new Date(),
      }
    });

    
    return {  accessToken , refreshToken , user: user };
  }

  // Create and save a new user
  async createUser(user: IUser): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const newUser = new User({ ...user, password: hashedPassword });
    return newUser.save();
  }

  // Generate JWT tokens
  generateTokens(user: {
    id: string;
    role: string;
    subscription: {
      isActive: boolean;
      startDate: Date;
      endDate: Date;
    };
  }): { accessToken: string; refreshToken: string } {
    const { id, role, subscription } = user;
  
    return {
      accessToken: createAccessToken({
        id,
        role,
        subscription: {
          isActive: subscription.isActive,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        },
      }),
      refreshToken: createRefreshToken({
        id,
        role,
        subscription: {
          isActive: subscription.isActive,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        },
      }),
    };
  }
  
  async getUser(userId: unknown): Promise<{ user: IUser  }> {
    const user = await this.userRepository.findById(userId);
 
    if (!user) {
      throw new Error("User not found.");
    }
    return { user };
  }

  async login(email: string, password: string, role: "user" | "admin"): Promise<{ token: string; user: IUser; refreshToken: string } | null> {
    try {
        // Fetch user by email and role
        const user = await this.userRepository.findByEmailAndRole(email, role);

        if (!user) {
            throw new Error("Please register with the provided email.");
        }

        // Check if the user is blocked
        if (user.isBlocked) {
            throw new Error("Your account has been blocked. Please contact support.");
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new Error("Email or password is incorrect.");
        }

        // Generate tokens
        const { accessToken, refreshToken } = this.generateTokens({
            id: user._id as string,
            role: user.role || "user",
            subscription: {
                isActive: user.subscription?.isActive || false,
                startDate: user.subscription?.startDate || new Date(),
                endDate: user.subscription?.endDate || new Date(),
            }
        });

        return {
            token: accessToken,
            user: user,
            refreshToken: refreshToken
        };
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            throw new Error(error.message);
        } else {
            throw new Error("An unknown error occurred.");
        }
    }
}


  async requestOtp(email: string): Promise<void> {
    try {
      if (!email) throw new Error("Email is required");
  
      const normalizedEmail = email.trim().toLowerCase();
      
      const user = await this.userRepository.findByEmail(normalizedEmail);
  
      if (user) {
        const otp = this.otpService.generateOtp(normalizedEmail);
        console.log("OTP for forgot password: ", otp);
  
        const userData: IUser = { ...user, otp } as unknown as IUser;
  
        const isOtpSent = await this.otpService.sendOtpEmail(normalizedEmail, otp);
        if (!isOtpSent) {
          throw new Error("Failed to send OTP via email.");
        }
        this.otpService.storeOtp(normalizedEmail, otp, userData);
        return;
      }
      else {
        const otp = this.otpService.generateOtp(normalizedEmail);
        console.log("OTP for registration: ", otp);
  
        const userData: IUser = { email: normalizedEmail, otp } as unknown as IUser; 
  
        const isOtpSent = await this.otpService.sendOtpEmail(normalizedEmail, otp);
        if (!isOtpSent) {
          throw new Error("Failed to send OTP via email.");
        }
        this.otpService.storeOtp(normalizedEmail, otp, userData);
  
       
        return;
      }
    } catch (error) {
      throw new Error("Internal server error");
    }
  }
  


  async verify_Otp(
    email: string,
    enterdOtp: string
  ): Promise<{ userData: IUser; accessToken: string; refreshToken: string }> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error("User not found.");
      }
  
      const { valid, expired } = this.otpService.verifyOtp(email, enterdOtp);
  
      if (expired) {
        throw new Error("OTP has expired, please request a new one.");
      }
  
      if (!valid) {
        throw new Error("Invalid OTP, please try again.");
      }
  
      // ✅ Ensure tokens are generated and returned
      const { accessToken, refreshToken } = this.generateTokens({
        id: user._id.toString(),
        role: user.role || "user",
        subscription: {
          isActive: user.subscription?.isActive || false,
          startDate: user.subscription?.startDate || new Date(),
          endDate: user.subscription?.endDate || new Date(),
        }
      });
  
      console.log("✅ Tokens Generated:", { accessToken, refreshToken });
  
      return { 
        userData: user, 
        accessToken, 
        refreshToken 
      };
  
    } catch (error) {
      console.error("Error in verify_Otp:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to verify OTP.");
    }
  }
  
async resendOtp(email: string): Promise<boolean> {
    try {
        // Check if the user exists
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error("User not found.");
        }

        // Generate and send OTP
        const otp = this.otpService.generateOtp(email);
        const isOtpSent = await this.otpService.sendOtpEmail(email, otp);

        if (!isOtpSent) {
            throw new Error("Failed to send OTP via email.");
        }

        this.otpService.storeOtp(email, otp, { email } as IUser);
        return true;
    } catch (error) {
      
        if (error instanceof Error) {
          console.log("Error in resendOtp:", error.message || error);
            throw new Error(error.message || "Failed to resend OTP.");
        } else {
            throw new Error("Failed to resend OTP.");
        }
    }
}


    async resetPassword(email: string, password:string): Promise<boolean> {
      try {
    console.log(email,password);
    
        
    if (!email || !password) {
      throw new Error("Email and Password are required");
    }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await this.userRepository.findByEmailAndUpdatePwd(email,passwordHash)
        console.log(user);
        
      if(!user) throw new Error ("User not found") 
      
    
      return true;
      } catch (error) {
        console.log(error);
        
        throw new Error("Failed to update password");
      }
    }

 
    async getAllUser(page: number = 1, limit: number = 10): Promise<{
      users: IUser[];
      totalPages: number;
      totalUsers: number;
      currentPage: number;
    }> {
      try {
        // Calculate skip value
        const skip = (page - 1) * limit;
        // Fetch paginated users
        const { users, totalCount: totalUsers } = await this.userRepository.findAndCount({}, page, limit);
        // Calculate total pages
        const totalPages = Math.ceil(totalUsers / limit);
  
        return {
          users,
          totalPages,
          totalUsers,
          currentPage: page,
        };
      } catch (error) {
        throw new Error("Failed to get all users");
      }
    }
    
    async googleAuth(data: string): Promise<{token:string ,user:IUser, refreshToken: string}> {
        try {
          const payload = await verifyGoogleToken(data);
          const { sub: googleId, email, name, picture } = payload;
          if (!email) {
            throw new Error("Email is required for Google authentication.");
          }
          let user = await this.userRepository.findByEmail(email);
          if (!user) {
            // If user doesn't exist, create a new one
            const randomPassword = Math.random().toString(36).slice(-8);
            user = {
              googleId,
              fullname: name,
              username: email.split("@")[0], 
              email,
              password: randomPassword, 
              avatar: picture,
              mobile: "",
            } as unknown as IUser;
      
              user = await this.userRepository.save(user);
            }
            const { accessToken, refreshToken } = this.generateTokens({
              id: user._id as string,
              role: user.role || "user",
              subscription: {
                isActive: user.subscription?.isActive || false,
                startDate: user.subscription?.startDate || new Date(),
                endDate: user.subscription?.endDate || new Date(),
              }
            });

            return {
              token:  accessToken, 
              user: user,
              refreshToken
            }
    
        } catch (error) {
          console.error(error);
          throw new Error("Google authentication failed.");
        }
    }

    async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string; role: string }> {
      try {
        // Verify the refresh token
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as { id: string };
        
        // Find user by ID from payload
        const user = await this.userRepository.findById(payload.id);
        if (!user) {
          throw new Error("User not found");
        }

       
        const { accessToken } = this.generateTokens({
          id: user._id as string,
          role: user.role || "user",
          subscription: {
            isActive: user.subscription?.isActive || false,
            startDate: user.subscription?.startDate || new Date(),
            endDate: user.subscription?.endDate || new Date(),
          }
        });
        
        return {
          token: accessToken,
          role :user.role || "user",
          refreshToken: refreshToken,
        };
      } catch (error) {
        console.error("Error while refreshing token:", error);
        throw new Error("Invalid or expired refresh token");  // Throw an error if the token is invalid or expired
      }
    }

    async blockUser(userId: string): Promise<IUser | null> {
      console.log(userId,"for block");
      
      const blockedUser = await this.userRepository.updateById(userId, { isBlocked: true });
  
      if (!blockedUser) {
          throw new Error("User not found.");
      }
  
      return blockedUser;
  }
  
  async unblockUser(userId: string): Promise<IUser | null> {
      const unblockedUser = await this.userRepository.updateById(userId, { isBlocked: false });
  
      if (!unblockedUser) {
          throw new Error("User not found.");
      }
  
      return unblockedUser;
  }
  

 }

