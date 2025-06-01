import { Socket } from "socket.io";
import { AdminSocketService } from "../../../useCase/socket/socketServices/adminSocketService";

export const adminHandlers = (socket: Socket, adminService: AdminSocketService) => {
  socket.on("admin:join", () => {
    socket.join("admin");
    console.log(`👨‍💻 Admin connected: ${socket.id}`);
    adminService.registerAdmin(socket.id);
    adminService.sendOnlineUserCountTo(socket);

    adminService.getOverviewData().then((data) => {
      socket.emit("admin:updateOverview", data);
    });
  });

  socket.on("admin:refreshOverview", async () => {
    const data = await adminService.getOverviewData();
    socket.emit("admin:updateOverview", data);
  });

  socket.on(
    "report:post",
    async (
      data: { postId: string; userId: string; reason: string },
      callback: (response: { success: boolean; message?: string }) => void
    ) => {
      try {
        await adminService.reportPost(data.postId, data.userId, data.reason);
        console.log(`📣 Report received for post ${data.postId} by user ${data.userId} reason: ${data.reason}`);
        callback({ success: true, message: "Report submitted." });
      } catch (error) {
        console.error("❌ Error reporting post:", error);
        callback({ success: false, message: "Failed to submit report." });
      }
    }
  );

  // ✅ Dismiss a report
  socket.on(
    "admin:dismissReport",
    async (reportId: string, callback: (response: { success: boolean; message?: string }) => void) => {
      try {
        await adminService.dismissReport(reportId);
        console.log(`🗑️ Report ${reportId} dismissed by admin ${socket.id}`);
        callback({ success: true });
      } catch (error) {
        console.error("❌ Failed to dismiss report:", error);
        callback({ success: false, message: "Failed to dismiss report" });
      }
    }
  );

  // ✅ Block a post
  socket.on(
    "admin:blockPost",
    async (postId: string, callback: (response: { success: boolean; message?: string }) => void) => {
      try {
        await adminService.deletePost(postId);
        console.log(`🚫 Post ${postId} blocked by admin ${socket.id}`);

        // Optional: Notify the post owner if needed
        // const postOwnerSocketId = await adminService.getPostOwnerSocketId(postId);
        // if (postOwnerSocketId) {
        //   socket.to(postOwnerSocketId).emit("user:postBlocked", { postId });
        // }

        callback({ success: true });
      } catch (error) {
        console.error("❌ Failed to block post:", error);
        callback({ success: false, message: "Failed to block post" });
      }
    }
  );

  socket.on("disconnect", () => {
    adminService.unregisterAdmin(socket.id);
  });
};
