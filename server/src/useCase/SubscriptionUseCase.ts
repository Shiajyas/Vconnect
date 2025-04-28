import SubscriptionRepository from "../data/repositories/SubscriptionRepository";
import { ISubscriptionUseCase } from "./interfaces/ISubscriptionUseCase";
import { ISubscription } from "../core/domain/interfaces/ISubscription";

class SubscriptionUseCase implements ISubscriptionUseCase {
  async getUserSubscription(userId: any): Promise<ISubscription | null> {
    try {
      console.log("Fetching subscription for user: 1", userId);
      return await SubscriptionRepository.findByUserId(userId);
    }
    catch (error) {
      console.error("Error fetching subscription:", error);
      throw new Error("Failed to fetch subscription");
    }
  }

  async createOrUpdateSubscription(userId: string, startDate: Date, endDate: Date): Promise<ISubscription> {
    const existingSubscription = await SubscriptionRepository.findByUserId(userId);
    if (existingSubscription) {
      const updatedSubscription = await SubscriptionRepository.updateSubscription(userId, startDate, endDate);
      if (!updatedSubscription) {
        throw new Error("Failed to update subscription");
      }
      return updatedSubscription;
    }
    return await SubscriptionRepository.createSubscription(userId, startDate, endDate);
  }
}

export default new SubscriptionUseCase();
