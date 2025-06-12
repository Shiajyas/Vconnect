export interface IUserStats {
  total: number;
  new: number;
  weeklyGrowth: { _id: string; count: number }[];
  postingActivity: Array<{ username: string; posts: number }>;
}

export interface IPostStats {
  total: number;
  reported: number;
  mostLiked: { title: string; likes: number }[];
}

export interface ICommentStats {
  total: number;
}

export interface ISubscriptionStats {
  active: number;
  new: number;
}

export interface IAdminOverview {
  users: IUserStats;
  posts: IPostStats;
  comments: ICommentStats;
  subscriptions: ISubscriptionStats;
}
