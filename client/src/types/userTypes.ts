export interface IUser {
  _id: string;
  fullname: string;
  username: string;
  email: string;
  avatar: string;
  role: 'admin' | 'proUser' | 'user';
  gender: 'male' | 'female' | 'other';
  mobile?: string;
  address?: string;
  story?: string;
  website?: string;
  saved: string[]; // Array of saved post IDs
  followers: string[]; // Array of user IDs who follow this user
  following: string[]; // Array of user IDs this user follows
  createdAt: string;
  updatedAt: string;
}
