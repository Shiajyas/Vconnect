import SubscriptionModel from '../core/domain/models/SubscriptionModel';
import User from '../core/domain/models/userModel';
import { Types } from 'mongoose';

interface QueryParams {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

interface AllQueryParams {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

export const adminSubscriptionService = {
  async getSubscriptions({
    search,
    status,
    startDate,
    endDate,
    page,
    limit,
  }: QueryParams) {
    const filters: any = {};

    if (search) {
      const users = await User.find({
        $or: [
          { username: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
        ],
      }).select('_id');

      filters.user = { $in: users.map((u) => u._id) };
    }

    if (status === 'active') filters.isSubscribed = true;
    if (status === 'inactive') filters.isSubscribed = false;

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const subscriptions = await SubscriptionModel.find(filters)
      .populate('userId', 'username email') // No avatar
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SubscriptionModel.countDocuments(filters);

    return {
      subscriptions,
      total,
      page,
      hasMore: total > skip + subscriptions.length,
    };
  },

  async getAllSubscriptions({
    search,
    status,
    startDate,
    endDate,
  }: AllQueryParams) {
    const filters: any = {};

    if (search) {
      const users = await User.find({
        $or: [
          { username: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
        ],
      }).select('_id');

      filters.user = { $in: users.map((u) => u._id) };
    }

    if (status === 'active') filters.isSubscribed = true;
    if (status === 'inactive') filters.isSubscribed = false;

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const subscriptions = await SubscriptionModel.find(filters)
      .populate('userId', 'username email') // Exclude avatar
      .sort({ createdAt: -1 })
      .lean();

    return { subscriptions };
  },

  async toggleSubscriptionStatus(subscriptionId: string) {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      throw new Error('Invalid subscription ID');
    }

    const subscription = await SubscriptionModel.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.isSubscribed = !subscription.isSubscribed;
    await subscription.save();

    return {
      message: 'Subscription updated',
      isSubscribed: subscription.isSubscribed,
    };
  },
};
