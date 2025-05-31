import { AdminOverviewRepository } from "../data/repositories/AdminOverviewRepository";
import { IAdminOverview } from "../data/interfaces/IAdminOverview";

export class AdminOverviewService {
  private repo = new AdminOverviewRepository();

  async getOverview(): Promise<IAdminOverview> {
    return await this.repo.fetchOverview();
  }
}
