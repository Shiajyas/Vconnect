export interface IUserStats {
  total: number;
  new: number;
  weeklyGrowth: { _id: string; count: number }[];
}

export interface IPostStats {
  total: number;
  reported: number;
}

export interface ICommentStats {
  total: number;
}

export interface ISubscriptionStats {
  active: number;
}

export interface IHashtagStat {
  _id: string;
  count: number;
}

export interface IAdminOverview {
  users: IUserStats;
  posts: IPostStats;
  comments: ICommentStats;
  subscriptions: ISubscriptionStats;
  hashtags: IHashtagStat[];
}
