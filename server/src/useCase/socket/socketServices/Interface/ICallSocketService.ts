import { Socket } from "socket.io";

export interface ICallSocketService {
  handleOffer(socket: Socket, data: any): Promise<void>;
  handleAnswer(socket: Socket, data: any): Promise<void>;
  handleIceCandidate(socket: Socket, data: any): Promise<void>;
  handleCallEnd(socket: Socket, data: any): Promise<void>;
}
