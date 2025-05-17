

import { Socket } from "socket.io";
import { IChatService } from "../../../useCase/socket/socketServices/Interface/IChatService";

const chatRooms = new Map();

export const chatHandlers = (socket: Socket, chatSocketHandlers :  IChatService) => {

  socket.on("joinChat", async (chatId) => {
    if (chatRooms.get(socket.id) === chatId) return;
    chatRooms.set(socket.id, chatId);
    socket.join(chatId);
    await chatSocketHandlers.getMessages(socket, chatId, 0, 20);
  });

  socket.on("createChat", async ({ senderId, receiverId }) => {
    try {
      await chatSocketHandlers.createChat(socket, senderId, receiverId);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  });

  socket.on("getChats", async (userId) => {
    try {
      await chatSocketHandlers.getUserChats(socket, userId);
    } catch (error) {
      console.error("Error getting chats:", error);
    }
  });

  socket.on("fetchMessages", async ({ chatId, page, limit }) => {
    try {

      await chatSocketHandlers.getMessages(socket, chatId, page, limit);
    } catch (error) {
      console.error("Error fetching messages:", error);
      socket.emit("error", { message: "Failed to fetch messages" });
    }
  });

  socket.on("sendMessage", async (newMessage) => {
    try {
      console.log(newMessage, "new message from socket")
      const { _id, chatId, senderId, content, type, createdAt, replyTo } = newMessage;
      await chatSocketHandlers.sendMessage(socket, newMessage.chatId, newMessage.senderId,newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("typing", ({ chatId, senderId }) => {
    socket.to(chatId).emit("userTyping", { senderId });
  });

  socket.on("editMessage", async ({ chatId, messageId, newContent }) => {
    try {
      console.log("Editing message:", chatId, messageId, newContent);
      await chatSocketHandlers.editMessage(socket, chatId, messageId, newContent);
    } catch (error) {
      console.error("Error editing message:", error);
      socket.emit("error", { message: "Failed to edit message" });
    }
  });

  socket.on("deleteMessage", async ({ chatId, messageId }) => {
    try {
      await chatSocketHandlers.deleteMessage(socket, chatId, messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  });
  

  socket.on("leaveChat", (chatId) => {
    socket.leave(chatId);
    chatRooms.delete(socket.id);
  });

  socket.on("sendFileMessage", async (data) => {
    const { chatId, senderId, message = "sheard file", replyTo, files,type } = data;
  
    console.log("📩 Received files via socket:", files);
  
    try {
      // Files are already uploaded; just forward the message
      const newMessage = {
        senderId,
        message: message,
        files, // already contains { name, type, url }
        replyTo,
        type: type || "file",
      };
  
      await chatSocketHandlers.sendMessage(socket, chatId, senderId, newMessage);
    } catch (err) {
      console.error("❌ File message handling error:", err);
      socket.emit("error", { message: "Failed to send file message." });
    }
  });
  
};
