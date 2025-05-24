import { RtpCapabilities, RtpParameters, DtlsParameters, IceCandidate, IceParameters } from 'mediasoup/node/lib/types';

export interface StreamInfo {
  streamId: string;
  hostSocketId: string;
  routerId: string;
  producerId: string;
}

export interface TransportOptions {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
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

export interface UserData {
  userId: string;
  username: string;
  avatar?: string;
  socketId: string;
}

export interface LiveStreamData {
  userId: string;
  username: string;
  avatar?: string;
  streamId: string;
}

export interface ServerToClientEvents {
  'user:joined': (user: UserData) => void;
  'live:started': (stream: LiveStreamData) => void;
  'live:ended': (data: { streamId: string }) => void;
  'live:notify': (data: { streamId: string; hostId: string }) => void;
  'live:comment': (msg: string) => void;
  'live:viewers': (count: number) => void;
}

export interface ClientToServerEvents {
  'user:authenticate': (
    data: { userId: string; username: string; avatar?: string },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  'live:start': (payload: { streamId: string; userId: string }) => void;
  'live:end': (data: { streamId: string }) => void;
  'live:join': (data: { streamId: string }) => void;
  'live:leave': (data: { streamId: string }) => void;
  'live:comment': (data: { streamId: string; message: string }) => void;
  'get-rtp-capabilities': (
    data: { streamId?: string },
    callback: (data: { routerRtpCapabilities: RtpCapabilities }) => void
  ) => void;
  'create-transport': (callback: (data: CreateTransportResponse) => void) => void;
  'connect-transport': (
    data: { transportId: string; dtlsParameters: DtlsParameters },
    callback: () => void
  ) => void;
  'produce': (
    data: { transportId: string; kind: string; rtpParameters: RtpParameters },
    callback: (data: { id: string }) => void
  ) => void;
  'consume': (data: ConsumeParams, callback: (data: ConsumeResponse) => void) => void;
}


export interface StreamInfo {
  streamId: string;
  hostSocketId: string;
  routerId: string;
  producerId: string;
}

export interface TransportOptions {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
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

export interface UserData {
  userId: string;
  username: string;
  avatar?: string;
  socketId: string;
}

export interface LiveStreamData {
  userId: string;
  username: string;
  avatar?: string;
  streamId: string;
}

export interface ServerToClientEvents {
  'user:joined': (user: UserData) => void;
  'live:started': (stream: LiveStreamData) => void;
  'live:ended': (data: { streamId: string }) => void;
  'live:notify': (data: { streamId: string; hostId: string }) => void;
  'live:comment': (msg: string) => void;
  'live:viewers': (count: number) => void;
}

export interface ClientToServerEvents {
  'user:authenticate': (
    data: { userId: string; username: string; avatar?: string },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  'live:start': (payload: { streamId: string; userId: string }) => void;
  'live:end': (data: { streamId: string }) => void;
  'live:join': (data: { streamId: string }) => void;
  'live:leave': (data: { streamId: string }) => void;
  'live:comment': (data: { streamId: string; message: string }) => void;
  'get-rtp-capabilities': (
    data: { streamId?: string },
    callback: (data: { routerRtpCapabilities: RtpCapabilities }) => void
  ) => void;
  'create-transport': (callback: (data: CreateTransportResponse) => void) => void;
  'connect-transport': (
    data: { transportId: string; dtlsParameters: DtlsParameters },
    callback: () => void
  ) => void;
  'produce': (
    data: { transportId: string; kind: string; rtpParameters: RtpParameters },
    callback: (data: { id: string }) => void
  ) => void;
  'consume': (data: ConsumeParams, callback: (data: ConsumeResponse) => void) => void;
}

