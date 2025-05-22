import { Device } from 'mediasoup-client';
import { Socket } from 'socket.io-client';

let device: Device;
let producerTransport: any;
let consumerTransport: any;
let consumer: any;

// Utility for request-response via socket.io
const request = <T extends object>(socket: Socket, event: string, data = {}): Promise<T> => {
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (response: T) => {
      if ('error' in response) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};

// Load Mediasoup Device with server capabilities
export const loadDevice = async (socket: Socket): Promise<void> => {
  const routerRtpCapabilities = await request(socket, 'get-rtp-capabilities');
  device = new Device();
  await device.load({ routerRtpCapabilities });
};

// Host: Create send transport and produce tracks
export const createSendTransport = async (socket: Socket, stream: MediaStream) => {
  if (!device) await loadDevice(socket);

  const { transportOptions } = await request<{ transportOptions: any }>(socket, 'create-transport');

  producerTransport = device.createSendTransport(transportOptions);

  interface ConnectTransportParams {
    dtlsParameters: any;
  }

  producerTransport.on(
    'connect',
    async (
      { dtlsParameters }: ConnectTransportParams,
      callback: () => void,
      errback: (error: any) => void,
    ) => {
      try {
        await request(socket, 'connect-transport', {
          transportId: producerTransport.id,
          dtlsParameters,
        });
        callback();
      } catch (err) {
        errback(err);
      }
    },
  );

  interface ProduceParams {
    kind: string;
    rtpParameters: any;
  }

  interface ProduceResponse {
    id: string;
  }

  producerTransport.on(
    'produce',
    async (
      { kind, rtpParameters }: ProduceParams,
      callback: (response: ProduceResponse) => void,
      errback: (error: any) => void,
    ) => {
      try {
        const { id } = await request<ProduceResponse>(socket, 'produce', {
          transportId: producerTransport.id,
          kind,
          rtpParameters,
        });
        callback({ id });
      } catch (err) {
        errback(err);
      }
    },
  );

  await producerTransport.connect();

  for (const track of stream.getTracks()) {
    await producerTransport.produce({ track });
  }
};

// Viewer: Create receive transport and play video
export const createRecvTransport = async (
  socket: Socket,
  streamId: string,
  videoRef: React.RefObject<HTMLVideoElement>,
) => {
  if (!device) await loadDevice(socket);

  const { transportOptions } = await request<{ transportOptions: any }>(socket, 'create-transport');

  consumerTransport = device.createRecvTransport(transportOptions);

  interface ConnectTransportParams {
    dtlsParameters: any;
  }

  consumerTransport.on(
    'connect',
    async (
      { dtlsParameters }: ConnectTransportParams,
      callback: () => void,
      errback: (error: any) => void,
    ) => {
      try {
        await request(socket, 'connect-transport', {
          transportId: consumerTransport.id,
          dtlsParameters,
        });
        callback();
      } catch (err) {
        errback(err);
      }
    },
  );

  await consumerTransport.connect();

  const { producerId, id, kind, rtpParameters } = await request<any>(socket, 'consume', {
    transportId: consumerTransport.id,
    streamId,
  });

  consumer = await consumerTransport.consume({
    id,
    producerId,
    kind,
    rtpParameters,
  });

  const mediaStream = new MediaStream();
  mediaStream.addTrack(consumer.track);

  if (videoRef.current) {
    videoRef.current.srcObject = mediaStream;
    videoRef.current.play().catch((err) => console.error('Video playback failed:', err));
  }
};

// Cleanup resources
export const closeTransports = () => {
  try {
    if (producerTransport) {
      producerTransport.close();
      producerTransport = null;
    }
    if (consumerTransport) {
      consumerTransport.close();
      consumerTransport = null;
    }
    if (consumer) {
      consumer.close();
      consumer = null;
    }
  } catch (err) {
    console.error('Error during transport cleanup:', err);
  }
};
