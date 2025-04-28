import { Socket } from "socket.io";
import { ICallSocketService } from "../../../useCase/socket/socketServices/Interface/ICallSocketService";

export const callHandlers = (socket: Socket, callSocketService: ICallSocketService) => {
  socket.on("call:offer", async (data) => {
    try {
      console.log(`📞 Offer sent from ${data.from} to ${data.to}`);
      await callSocketService.handleOffer(socket, data);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  });

  socket.on("call:answer", async (data) => {
    try {
      console.log(`✅ Answer sent from ${data.from} to ${data.to}`);
      await callSocketService.handleAnswer(socket, data);
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  });

  socket.on("call:ice-candidate", async (data) => {
    try {
      console.log(`❄️ ICE candidate from ${data.from} to ${data.to}`);
      await callSocketService.handleIceCandidate(socket, data);
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  });

  socket.on("call:end", async (data) => {
    try {
      console.log(`🔚 Call ended by ${data.to}`);
      await callSocketService.handleCallEnd(socket, data);
    } catch (error) {
      console.error("Error handling call end:", error);
    }
  });
};
