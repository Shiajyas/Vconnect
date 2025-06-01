// useCase/socket/socketServices/AdminSocketService.ts
import { Server, Socket } from "socket.io";
import { AdminOverviewService } from "../../AdminOverviewService";
import { ISUserRepository } from "../../../data/interfaces/ISUserRepository";
import { IReportRepository } from "../../../data/interfaces/IReportRepository";
import { Types } from "mongoose";

export class AdminSocketService {
  private io: Server;
  private adminOverviewService: AdminOverviewService;
  private sessionUserRepo: ISUserRepository;
  private reportRepository: IReportRepository;

  constructor(
    io: Server,
    adminOverviewService: AdminOverviewService,
    sessionUserRepo: ISUserRepository,
    reportRepository: IReportRepository
  ) {
    this.io = io;
    this.adminOverviewService = adminOverviewService;
    this.sessionUserRepo = sessionUserRepo;
    this.reportRepository = reportRepository;
  }

  registerAdmin(socketId: string) {
    console.log(`🛡️ Admin connected: ${socketId}`);
    const count = this.sessionUserRepo.getActiveUsers().length;
    this.io.to("admin").emit("admin:updateOnlineCount", count);
  }

  unregisterAdmin(socketId: string) {
    console.log(`⚠️ Admin disconnected: ${socketId}`);
  }

  async getOverviewData() {
    return await this.adminOverviewService.getOverview();
  }

  async pushOverviewUpdate() {
    const data = await this.getOverviewData();
    this.io.to("admin").emit("admin:updateOverview", data);
  }

  sendOnlineUserCountTo(socket: Socket) {
    const count = this.sessionUserRepo.getActiveUsers().length;
    socket.emit("admin:updateOnlineCount", count);
  }

  broadcastOnlineUserCountToAdmins() {
    const count = this.sessionUserRepo.getActiveUsers().length;
    console.log("Broadcasting online user count to admins:", count);
    this.io.to("admin").emit("admin:updateOnlineCount", count);
  }

async reportPost(postId: string, userId: string, reason: string) {
  // 1. Save the report to MongoDB
  await this.reportRepository.create({
    reporter: new Types.ObjectId(userId),
    postId: new Types.ObjectId(postId),
    reason,
  });

  // 2. Fetch enriched report with populated reporter and post owner info
  const enrichedReport = await this.reportRepository.fetchSingleReportedPost(postId, userId);

  // 3. Notify all connected admins with the enriched report
  this.io.to("admin").emit("admin:newReport", enrichedReport);

  // 4. Optionally update the dashboard overview stats
  // await this.pushOverviewUpdate();
}

}
