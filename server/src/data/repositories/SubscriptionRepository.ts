import SubscriptionModel from "../../core/domain/models/SubscriptionModel";
import { ISubscription } from "../../core/domain/interfaces/ISubscription";
import { ISubscriptionRepository } from "../interfaces/ISubscriptionRepository";

class SubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: any): Promise<ISubscription | null> {
    try {
      console.log("Fetching subscription for user: 2", userId);
      return await SubscriptionModel.findOne({ userId });
    }catch (error) {
      console.error("Error fetching subscription:", error);
      throw new Error("Failed to fetch subscription");
    }
  }

  async createSubscription(userId: string, startDate: Date, endDate: Date): Promise<ISubscription> {
    return await SubscriptionModel.create({ userId, isSubscribed: true, startDate, endDate });
  }

  async updateSubscription(userId: string, startDate: Date, endDate: Date): Promise<ISubscription | null> {
    return await SubscriptionModel.findOneAndUpdate(
      { userId },
      { isSubscribed: true, startDate, endDate },
      { new: true }
    );
  }
}

export default new SubscriptionRepository();
