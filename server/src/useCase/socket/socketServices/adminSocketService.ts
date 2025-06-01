import { Server, Socket } from "socket.io";
import { Types } from "mongoose";
import { AdminOverviewService } from "../../AdminOverviewService";
import { ISUserRepository } from "../../../data/interfaces/ISUserRepository";
import { IReportRepository } from "../../../data/interfaces/IReportRepository";
import { INotificationService } from "../../interfaces/InotificationService";
import { PostRepository } from "../../../data/repositories/PostRepository";
import { SYSTEM_ADMIN_ID } from "../../../infrastructure/config/system";

export class AdminSocketService {
  private io: Server;
  private adminOverviewService: AdminOverviewService;
  private sessionUserRepo: ISUserRepository;
  private reportRepository: IReportRepository;
  private notificationService?: INotificationService;
  private postRepository = new PostRepository();

  constructor(
    io: Server,
    adminOverviewService: AdminOverviewService,
    sessionUserRepo: ISUserRepository,
    reportRepository: IReportRepository,
    notificationService?: INotificationService
  ) {
    this.io = io;
    this.adminOverviewService = adminOverviewService;
    this.sessionUserRepo = sessionUserRepo;
    this.reportRepository = reportRepository;
    this.notificationService = notificationService;
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
    try {
      await this.reportRepository.create({
        reporter: new Types.ObjectId(userId),
        postId: new Types.ObjectId(postId),
        reason,
      });

      const enrichedReport = await this.reportRepository.fetchSingleReportedPost(postId, userId);
      if (enrichedReport) {
        this.io.to("admin").emit("admin:newReport", enrichedReport);
        console.log("🔔 Emitted admin:newReport");
      }
    } catch (error) {
      console.error("❌ Error reporting post:", error);
    }
  }

  async dismissReport(reportId: string) {
    try {
      await this.reportRepository.deleteById(reportId);
      console.log(`🗑️ Report ${reportId} dismissed`);
    } catch (error) {
      console.error("❌ Error dismissing report:", error);
    }
  }

  async deletePost(postId: string) {
    try {
      const post: any = await this.postRepository.getPost(postId);
      if (!post) {
        console.warn(`⚠️ Post ${postId} not found`);
        return;
      }

      const ownerId = post?.userId?._id?.toString();
      console.log("🧾 Deleting post:", postId, "Owner:", ownerId);

      await this.reportRepository.blockPostById(postId);
      this.io.to("admin").emit("admin:postDeleted", { postId });
      console.log(`🗑️ Post ${postId} deleted and admins notified`);

      if (this.notificationService && ownerId) {
        console.log("📨 Sending notification to user:", ownerId);
        await this.notificationService.sendNotification(
          SYSTEM_ADMIN_ID.toString(),
          [ownerId],
          "post",
          "Your post was removed by an admin due to multiple reports.",
          postId,
          "Admin"
        );
        console.log(`📩 User ${ownerId} notified`);
      } else if (!this.notificationService) {
        console.warn("⚠️ Notification service not available");
      } else {
        console.warn("⚠️ Owner ID is undefined; notification not sent");
      }
    } catch (error) {
      console.error("❌ Error deleting post:", error);
    }
  }
}
