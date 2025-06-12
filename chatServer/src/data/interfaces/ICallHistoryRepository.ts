import { ICallHistory } from '../../core/domain/interfaces/ICallHistory';

export interface ICallHistoryRepository {
  saveCallHistory(data: Partial<ICallHistory>): Promise<ICallHistory>;
  getUserCallHistory(userId: string): Promise<ICallHistory[]>;
}
