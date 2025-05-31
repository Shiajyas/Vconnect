// socketHandlers/adminHandlers.ts
import { Socket } from "socket.io";
import { AdminSocketService } from "../../../useCase/socket/socketServices/adminSocketService";

export const adminHandlers = (socket: Socket, adminService: AdminSocketService) => {
  // Join an admin room for targeted broadcasts
  socket.on("admin:join", () => {
    socket.join("admin");
    adminService.registerAdmin(socket.id);
  });

  socket.on("admin:refreshOverview", async () => {
    const data = await adminService.getOverviewData();
    socket.emit("admin:updateOverview", data);
  });

  socket.on("disconnect", () => {
    adminService.unregisterAdmin(socket.id);
  });
};
