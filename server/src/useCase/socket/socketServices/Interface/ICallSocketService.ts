import { Socket } from "socket.io";

export interface ICallSocketService {
  handleOffer(socket: Socket, data: any): Promise<void>;
  handleAnswer(socket: Socket, data: any): Promise<void>;
  handleIceCandidate(socket: Socket, data: any): Promise<void>;
  handleCallEnd(socket: Socket, data: any): Promise<void>;
   handleMicToggle(socket: Socket, data: { to: string; micOn: boolean }): Promise<void>;
  handleVideoToggle(socket: Socket, data: { to: string; videoOn: boolean }): Promise<void>;
}
