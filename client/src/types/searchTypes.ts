
import { IUser } from './userTypes';
import { IPost } from './postTypes';

export interface ISearchResult {
  users: IUser[];
  posts: IPost[];
}
