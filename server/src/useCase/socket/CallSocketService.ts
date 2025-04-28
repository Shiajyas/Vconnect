import { Socket } from "socket.io";
import { ICallSocketService } from "./socketServices/Interface/ICallSocketService";
import { ISUserRepository } from "../../data/interfaces/ISUserRepository"; 
import { IUserRepository } from "../../data/interfaces/IUserRepository";

export class CallSocketService implements ICallSocketService {
  private onlineUserRepository: ISUserRepository;
  private mainUserReopository: IUserRepository

  constructor(onlineUserRepository: ISUserRepository, mainUserReopository: IUserRepository) {
    this.onlineUserRepository = onlineUserRepository;
    this.mainUserReopository = mainUserReopository
  }

  async handleOffer(socket: Socket, data: any) {
    // console.log(data, "data>>>>>>>>>>>>>");
  
    const sender = await this.mainUserReopository.findById(data.from); // fetch full user
    const recipient = this.onlineUserRepository.findById(data.to);     // online user info
  
    if (recipient && sender) {
      const caller = {
        _id: sender._id,
        username: sender.username,
        avatar: sender.avatar || null,
      };
  
      socket.to(recipient.socketId).emit("incoming:call", {
        from: data.from,         
        offer: data.offer,
        type: data.type,         
        caller,                   
      });
    } else {
      console.warn(`⚠️ Cannot send offer — user ${data.to} not online.`);
    }
  }
  

  async handleAnswer(socket: Socket, data: any) {
    const recipient = this.onlineUserRepository.findById(data.to);
  console.log(data,"data answer>>>>>>>>>>>>>");
  console.log(recipient, "recipient answer>>>>>>>>>>>>>");
    if (recipient) {
      socket.to(recipient.socketId).emit("call:accepted", data);
    } else {
      console.warn(`⚠️ Cannot send answer — user ${data.to} not online.`);
    }
  }

  async handleIceCandidate(socket: Socket, data: any) {
    const recipient = this.onlineUserRepository.findById(data.to);
    if (recipient) {
      socket.to(recipient.socketId).emit("ice-candidated", data);
    } else {
      console.warn(`⚠️ Cannot send ICE candidate — user ${data.to} not online.`);
    }
  }

  async handleCallEnd(socket: Socket, data: any) {
    const recipient = this.onlineUserRepository.findById(data.to);
    if (recipient) {
      console.log("call end data", data);
      console.log("call end recipient", recipient);
      socket.to(recipient.socketId).emit("call:ended", data);
    } else {
      console.warn(`⚠️ Cannot send call end — user ${data.to} not online.`);
    }
  }

  async handleMicToggle(socket: Socket, data: { to: string; micOn: boolean }) {
    const recipient = this.onlineUserRepository.findById(data.to);
    if (recipient) {
      console.log(`🎤 Toggling mic for user ${data.to}: ${data.micOn ? "ON" : "OFF"}`);
      socket.to(recipient.socketId).emit("call:toggle-mic", { micOn: data.micOn });
    } else {
      console.warn(`⚠️ Cannot toggle mic — user ${data.to} not online.`);
    }
  }

  async handleVideoToggle(socket: Socket, data: { to: string; videoOn: boolean }) {
    const recipient = this.onlineUserRepository.findById(data.to);
    if (recipient) {
      console.log(`🎥 Toggling video for user ${data.to}: ${data.videoOn ? "ON" : "OFF"}`);
      socket.to(recipient.socketId).emit("call:toggle-video", { videoOn: data.videoOn });
    } else {
      console.warn(`⚠️ Cannot toggle video — user ${data.to} not online.`);
    }
  }
}
