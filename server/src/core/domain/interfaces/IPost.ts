

import mongoose, { Document,Schema} from 'mongoose';

export interface IPost extends Document {
  userId: Schema.Types.ObjectId
  title:string;
  description:string;
  mediaUrls: string[];
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  user: mongoose.Types.ObjectId;
  reports: mongoose.Types.ObjectId[];
}
