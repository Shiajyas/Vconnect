import  {  Document } from 'mongoose';

export interface ICallHistory extends Document {
  callerId: string;
  receiverId: string;
  callType: 'voice' | 'video';
  startedAt: Date;
  endedAt: Date;
  duration: number; // in seconds
  chatId?: string;
}
