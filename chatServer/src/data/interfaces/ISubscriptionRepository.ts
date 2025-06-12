import { ISubscription } from '../../core/domain/interfaces/ISubscription';

export interface ISubscriptionRepository {
  findByUserId(userId: any): Promise<ISubscription | null>;
  createSubscription(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription>;
  updateSubscription(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ISubscription | null>;
  findAllByUserId(userId: string): Promise<ISubscription[]>;
}
