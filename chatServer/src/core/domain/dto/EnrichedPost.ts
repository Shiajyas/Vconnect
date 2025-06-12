import { Types } from 'mongoose';

export interface EnrichedPost {
  _id: Types.ObjectId;
  title: string;
  description: string;
  mediaUrls: string[];
  likes: Types.ObjectId[];
  userId: {
    _id: Types.ObjectId;
    username: string;
    email: string;
  };
}
