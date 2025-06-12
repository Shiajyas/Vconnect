import SubscriptionModel from '../../core/domain/models/SubscriptionModel';
import { ISubscription } from '../../core/domain/interfaces/ISubscription';
import { ISubscriptionRepository } from '../interfaces/ISubscriptionRepository';

class SubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string): Promise<ISubscription | null> {
    try {
      console.log('Fetching subscription for user:', userId);
      const sub = await SubscriptionModel.findOne({
        userId,
        isSubscribed: true,
        startDate: { $ne: null },
        endDate: { $ne: null },
      }).sort({ endDate: -1 });

      if (!sub) console.log('No matching active subscription found.');
      else console.log('Found subscription:', sub);

      return sub;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw new Error('Failed to fetch subscription');
    }
  }

  async findAllByUserId(userId: string): Promise<ISubscription[]> {
    try {
      console.log('Fetching all subscriptions for user:', userId);

      const subscriptions = await SubscriptionModel.find({
        userId,
        startDate: { $ne: null },
        endDate: { $ne: null },
      }).sort({ startDate: -1 });

      const now = new Date();

      await Promise.all(
        subscriptions.map(async (sub) => {
          if (sub.endDate < now && sub.isSubscribed) {
            sub.isSubscribed = false;
            await sub.save();
          }
        }),
      );

      return subscriptions;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw new Error('Failed to fetch subscriptions');
    }
  }

  async createSubscription(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription> {
    return await SubscriptionModel.create({
      userId,
      isSubscribed: true,
      startDate,
      endDate,
    });
  }

  async updateSubscription(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription | null> {
    return await SubscriptionModel.findOneAndUpdate(
      { userId },
      { isSubscribed: true, startDate, endDate },
      { new: true },
    );
  }
}

export default new SubscriptionRepository();
