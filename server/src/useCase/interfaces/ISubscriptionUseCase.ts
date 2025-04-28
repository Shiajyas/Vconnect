import { ISubscription } from "../../core/domain/interfaces/ISubscription";

export interface ISubscriptionUseCase {
  getUserSubscription(userId: string): Promise<ISubscription | null>;
  createOrUpdateSubscription(userId: any, startDate: Date, endDate: Date): Promise<ISubscription>;
}
