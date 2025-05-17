import { ICallHistory } from "../../core/domain/interfaces/ICallHistory";
import CallHistoryModel from "../../core/domain/models/CallHistory";
import { ICallHistoryRepository } from "../interfaces/ICallHistoryRepository";

export class CallHistoryRepository implements ICallHistoryRepository {
  async saveCallHistory(data: Partial<ICallHistory>): Promise<ICallHistory> {
    const call = new CallHistoryModel(data);
    return await call.save();
  }

  async getUserCallHistory(userId: string): Promise<ICallHistory[]> {
    return await CallHistoryModel.find({
      $or: [{ callerId: userId }, { receiverId: userId }],
    })
      .sort({ startedAt: -1 })
      .populate("callerId", "username fullname avatar") // Select only useful fields
      .populate("receiverId", "username fullname avatar");
  }
  
}
