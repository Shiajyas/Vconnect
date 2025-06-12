import { IUser } from '../../core/domain/interfaces/IUser';
import { IUserRepository } from '../interfaces/IUserRepository';
import User from '../../core/domain/models/userModel';
import mongoose from 'mongoose';

export class UserRepository implements IUserRepository {
  // Find a user by email
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await User.findOne({ email });
    return user ? (user.toObject() as IUser) : null;
  }

  // Find a user by username
  async findByUsername(username: string): Promise<IUser | null> {
    const user = await User.findOne({ username }).select('-password');
    return user ? (user.toObject() as IUser) : null;
  }

  // Save a new user
  async save(user: IUser): Promise<IUser> {
    const newUser = new User(user);
    const savedUser = await newUser.save();
    return savedUser.toObject() as IUser;
  }

  // Find a user by ID
  async findById(id: string): Promise<IUser | null> {
    const user = await User.findById(id).select('-password');
    return user ? (user.toObject() as IUser) : null;
  }

  // Find a user by email and role
  async findByEmailAndRole(email: string, role: string): Promise<IUser | null> {
    const user = await User.findOne({ email, role: role });
    console.log(user, 3);
    return user ? (user.toObject() as IUser) : null;
  }

  // Find users based on a query
  async find(query: object): Promise<IUser[]> {
    try {
      const users = await User.find(query).select('-password');
      return users as IUser[];
    } catch (error) {
      throw new Error('Error finding users');
    }
  }

  async findAndCount(
    query: object,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: IUser[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      // Fetch paginated users and total count
      const [users, totalCount] = await Promise.all([
        User.find(query)
          .select('-password') // Exclude sensitive fields
          .skip(skip) // Apply pagination
          .limit(limit), // Limit number of results
        User.countDocuments(query), // Count total documents matching the query
      ]);

      return {
        users: users as IUser[],
        totalCount,
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in findAndCount:', error.message);
      } else {
        console.error('Error in findAndCount:', error);
      }
      throw new Error('Error finding and counting users');
    }
  }

  // Update user password by email
  async findByEmailAndUpdatePwd(
    email: string,
    passwordHash: string,
  ): Promise<boolean> {
    try {
      const result = await User.updateOne(
        { email },
        { $set: { password: passwordHash } },
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('An unknown error occurred');
      }
      return false;
    }
  }

  async update(query: object, update: object): Promise<void> {
    await User.updateOne(query, update);
  }

  async updateById(id: string, update: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, update, { new: true }).select(
      '-password',
    );
  }

  // Fetch followers of a user
  async findFollowers(userId: string): Promise<IUser[]> {
    return await User.find({ following: userId }).select(
      'username fullname avatar following followers',
    );
  }

  // Fetch users the user is following
  async findFollowing(userId: string): Promise<IUser[]> {
    return await User.find({ followers: userId }).select(
      'username fullname avatar following followers',
    );
  }

  async unfollow(userId: string, unfollowUserId: string): Promise<boolean> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(unfollowUserId)
      ) {
        console.error('❌ Invalid userId or unfollowUserId:', {
          userId,
          unfollowUserId,
        });
        return false;
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const unfollowObjectId = new mongoose.Types.ObjectId(unfollowUserId);

      console.log(`🔄 Attempting to unfollow: ${userId} -> ${unfollowUserId}`);

      // Fetch users
      const [user, unfollowUser] = await Promise.all([
        User.findById(userObjectId),
        User.findById(unfollowObjectId),
      ]);

      if (!user || !unfollowUser) {
        console.error('❌ User or Unfollow User not found:', {
          user,
          unfollowUser,
        });
        return false;
      }

      // Update both users' follow lists
      const [updatedUser, updatedUnfollowUser] = await Promise.all([
        User.findByIdAndUpdate(
          userObjectId,
          { $pull: { following: unfollowObjectId } },
          { new: true },
        ),
        User.findByIdAndUpdate(
          unfollowObjectId,
          { $pull: { followers: userObjectId } },
          { new: true },
        ),
      ]);

      if (!updatedUser || !updatedUnfollowUser) {
        console.error('❌ Unfollow operation failed: Updates did not persist.');
        return false;
      }

      console.log('✅ Unfollow success:', {
        updatedUserFollowing: updatedUser.following,
        updatedUnfollowUserFollowers: updatedUnfollowUser.followers,
      });

      return true;
    } catch (error) {
      console.error('❌ Error in unfollow function:', error);
      return false;
    }
  }

  async updateUserById(
    userId: string,
    updatedData: Partial<IUser>,
  ): Promise<IUser | null> {
    try {
      const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
        new: true,
        runValidators: true,
      }).select('-password');

      return updatedUser ? (updatedUser.toObject() as IUser) : null;
    } catch (error) {
      console.error('Error updating user by ID:', error);
      return null;
    }
  }

  async savePost(userId: string, postId: string): Promise<boolean> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const postObjectId = new mongoose.Types.ObjectId(postId);

      // Update user's saved posts array
      await User.findByIdAndUpdate(
        userObjectId,
        { $addToSet: { saved: postObjectId } }, // Use $addToSet to prevent duplicates
        { new: true }, // Return the updated document
      );

      return true;
    } catch (error) {
      console.error('Error saving post:', error);
      return false;
    }
  }

  async searchUsers(query: string): Promise<IUser[]> {
    console.log(query, 'searchquery user');
    return await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullname: { $regex: query, $options: 'i' } },
      ],
    }).limit(5);
  }
}
