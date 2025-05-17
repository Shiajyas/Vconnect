
import { RtpCapabilities, RtpParameters, DtlsParameters } from 'mediasoup/node/lib/types';

export interface StreamInfo {
  streamId: string;
  hostSocketId: string;
  routerId: string;
  producerId: string;
}

export interface TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
}

export interface CreateTransportResponse {
  transportOptions: TransportOptions;
}

export interface ConsumeParams {
  streamId: string;
  transportId: string;
}

export interface ConsumeResponse {
  id: string;
  producerId: string;
  kind: string;
  rtpParameters: RtpParameters;
}

export interface ServerToClientEvents {
  'live:comment': (msg: string) => void;
  'live:viewers': (count: number) => void;
}

export interface ClientToServerEvents {
  'live:start': (data: { streamId: string }) => void;
  'live:join': (data: { streamId: string }) => void;
  'live:leave': (data: { streamId: string }) => void;
  'live:comment': (data: { streamId: string; message: string }) => void;
  'get-rtp-capabilities': (callback: (data: RtpCapabilities) => void) => void;
  'create-transport': (callback: (data: CreateTransportResponse) => void) => void;
  'connect-transport': (data: { transportId: string; dtlsParameters: DtlsParameters }, callback: () => void) => void;
  'produce': (data: { transportId: string; kind: string; rtpParameters: RtpParameters }, callback: (data: { id: string }) => void) => void;
  'consume': (data: ConsumeParams, callback: (data: ConsumeResponse) => void) => void;
}
