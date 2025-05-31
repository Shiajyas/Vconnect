import { Server } from "socket.io";
import { AdminOverviewService } from "../../AdminOverviewService";
export class AdminSocketService {
  constructor(
    private io: Server,
    private adminOverviewService: AdminOverviewService
  ) {}

  async getOverviewData() {
    return await this.adminOverviewService.getOverview();
  }

  registerAdmin(socketId: string) {
    console.log(`🛡️ Admin connected: ${socketId}`);
  }

  unregisterAdmin(socketId: string) {
    console.log(`⚠️ Admin disconnected: ${socketId}`);
  }

  async pushOverviewUpdate() {
    const data = await this.getOverviewData();
    this.io.to("admin").emit("admin:updateOverview", data);
  }
}
