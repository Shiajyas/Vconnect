
import { AdminOverviewRepository } from '../data/repositories/AdminOverviewRepository';
import { ReportRepository } from '../data/repositories/ReportRepository';


export class AdminOverviewService {
  private repository = new AdminOverviewRepository();

  private reportRepository = new ReportRepository();

  async getOverview(
    range: '7d' | '1m' | '1y' = '7d',
    likeRange: { min: number; max: number } = { min: 0, max: Infinity },
  ) {
    return this.repository.fetchOverview(range, likeRange);
  }

  // ✅ New method to fetch only most liked posts
  async getMostLikedPosts(
    range: '7d' | '1m' | '1y' = '7d',
    likeRange: { min: number; max: number } = { min: 0, max: Infinity },
  ) {
    return this.repository.fetchMostLikedPosts(range, likeRange);
  }
  async getReportedPosts(
    range: '7d' | '1m' | '1y',
    page: number,
    limit: number,
  ) {
    return this.reportRepository.fetchReportedPosts(range, page, limit);
  }

  async getReportedPostsCount() {
    return this.reportRepository.getTotalReportedPostsCount();
  }
}
