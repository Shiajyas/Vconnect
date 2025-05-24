import { Device } from 'mediasoup-client';
import { Socket } from 'socket.io-client';
import { useLiveStore } from '@/appStore/useLiveStore';

let device: Device;
let producerTransport: any;
let consumerTransport: any;
let consumer: any;

// Utility for request-response via socket.io
const request = <T extends object>(
  socket: Socket,
  event: string,
  data: object = {}
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout for event: ${event}`));
    }, 10000);

    socket.emit(event, data, (response: T | { error: string }) => {
      clearTimeout(timeout);
      
      if (!response) {
        return reject(new Error(`No response for event: ${event}`));
      }
      
      if ('error' in response) {
        return reject(new Error(response.error as string));
      }
      
      resolve(response as T);
    });
  });
};

// Load Mediasoup Device with server capabilities
export const loadDevice = async (socket: Socket, streamId?: string): Promise<void> => {
  try {
    console.log('Loading device with streamId:', streamId);
    
    const requestData = streamId ? { streamId } : {};
    const response = await request<{ routerRtpCapabilities: any }>(
      socket, 
      'get-rtp-capabilities', 
      requestData
    );
    
    console.log('Router RTP capabilities received:', response.routerRtpCapabilities);
    
    if (!response.routerRtpCapabilities || !response.routerRtpCapabilities.codecs) {
      throw new Error('Invalid RTP capabilities received from server');
    }

    device = new Device();
    await device.load({ routerRtpCapabilities: response.routerRtpCapabilities });
    
    console.log('Device loaded successfully');
  } catch (error) {
    console.error('Error loading device:', error);
    throw error;
  }
};

// Host: Create send transport and produce tracks
export const createSendTransport = async (
  socket: Socket, 
  stream: MediaStream, 
  streamId: string
) => {
  try {
    console.log('Creating send transport for streamId:', streamId);
    
    if (!device) {
      await loadDevice(socket, streamId);
    }

    const requestData = streamId ? { streamId } : {};
    const { transportOptions } = await request<{ transportOptions: any }>(
      socket, 
      'create-transport',
      requestData
    );

    console.log('Send transport options received:', transportOptions);

    producerTransport = device.createSendTransport(transportOptions);

    interface ConnectTransportParams {
      dtlsParameters: any;
    }

    producerTransport.on(
      'connect',
      async (
        { dtlsParameters }: ConnectTransportParams,
        callback: () => void,
        errback: (error: any) => void
      ) => {
        try {
          await request(socket, 'connect-transport', {
            transportId: producerTransport.id,
            dtlsParameters,
          });
          callback();
        } catch (err) {
          console.error('Error connecting send transport:', err);
          errback(err);
        }
      }
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
        errback: (error: any) => void
      ) => {
        try {
          const { id } = await request<ProduceResponse>(socket, 'produce', {
            transportId: producerTransport.id,
            kind,
            rtpParameters,
          });
          callback({ id });
        } catch (err) {
          console.error('Error producing:', err);
          errback(err);
        }
      }
    );

    // Connect the transport first
    await producerTransport.connect();
    console.log('Send transport connected');

    // Then produce tracks
    const producers = [];
    for (const track of stream.getTracks()) {
      console.log(`Producing ${track.kind} track`);
      const producer = await producerTransport.produce({ track });
      producers.push(producer);
    }

    console.log('All tracks produced successfully');
    return producers;
  } catch (error) {
    console.error('Error creating send transport:', error);
    throw error;
  }
};

// Viewer: Create receive transport and play video
export const createRecvTransport = async (
  socket: Socket,
  streamId: string,
  videoRef: React.RefObject<HTMLVideoElement>
) => {
  try {
    console.log('Creating receive transport for streamId:', streamId);
    
    if (!device) {
      await loadDevice(socket, streamId);
    }

    const requestData = streamId ? { streamId } : {};
    const { transportOptions } = await request<{ transportOptions: any }>(
      socket, 
      'create-transport',
      requestData
    );

    console.log('Receive transport options received:', transportOptions);

    if (!transportOptions) {
      throw new Error('No transport options received from server');
    }

    consumerTransport = device.createRecvTransport(transportOptions);

    interface ConnectTransportParams {
      dtlsParameters: any;
    }

    // Store connection promise to wait for it
    let connectPromise: Promise<void>;
    let connectResolve: () => void;
    let connectReject: (error: any) => void;

    connectPromise = new Promise<void>((resolve, reject) => {
      connectResolve = resolve;
      connectReject = reject;
    });

    consumerTransport.on(
      'connect',
      async (
        { dtlsParameters }: ConnectTransportParams,
        callback: () => void,
        errback: (error: any) => void
      ) => {
        try {
          await request(socket, 'connect-transport', {
            transportId: consumerTransport.id,
            dtlsParameters,
          });
          callback();
          connectResolve();
          console.log('Receive transport connected');
        } catch (err) {
          console.error('Error connecting receive transport:', err);
          errback(err);
          connectReject(err);
        }
      }
    );

    // Get available producers for this stream
    const producersResponse = await request<{
      producers: Array<{
        id: string;
        kind: 'audio' | 'video';
        rtpParameters: any;
      }>
    }>(socket, 'get-producers', {
      streamId,
    });

    console.log('Available producers:', producersResponse);

    if (!producersResponse.producers || producersResponse.producers.length === 0) {
      throw new Error('No producers available for this stream');
    }

    const mediaStream = new MediaStream();
    const consumers: any[] = [];

    // Consume each available producer
    for (const producer of producersResponse.producers) {
      try {
        console.log(`Consuming ${producer.kind} track from producer:`, producer.id);

        // Validate producer data
        if (!producer.id || !producer.kind || !producer.rtpParameters) {
          console.warn('Invalid producer data:', producer);
          continue;
        }

        // Request to consume this specific producer
        const consumeResponse = await request<{
          producerId: string;
          id: string;
          kind: 'audio' | 'video';
          rtpParameters: any;
        }>(socket, 'consume', {
          transportId: consumerTransport.id,
          producerId: producer.id,
          rtpCapabilities: device.rtpCapabilities,
        });

        console.log(`Consume response for ${producer.kind}:`, consumeResponse);

        // Validate consume response
        if (!consumeResponse.id || !consumeResponse.kind || !consumeResponse.rtpParameters) {
          console.error('Invalid consume response:', consumeResponse);
          continue;
        }

        // Create consumer
        const newConsumer = await consumerTransport.consume({
          id: consumeResponse.id,
          producerId: consumeResponse.producerId,
          kind: consumeResponse.kind,
          rtpParameters: consumeResponse.rtpParameters,
        });

        console.log(`Consumer created for ${consumeResponse.kind}:`, newConsumer.id);

        // Add track to media stream
        mediaStream.addTrack(newConsumer.track);
        consumers.push(newConsumer);

        // Resume consumer (important for some MediaSoup setups)
        await request(socket, 'resume-consumer', {
          consumerId: newConsumer.id,
        });

      } catch (err) {
        console.error(`Error consuming ${producer.kind} track:`, err);
        // Continue with other tracks even if one fails
      }
    }

    // Wait for connection to complete
    await connectPromise;

    if (consumers.length === 0) {
      throw new Error('Failed to create any consumers');
    }

    console.log(`Successfully created ${consumers.length} consumers`);

    // Set up video element
    if (videoRef.current && mediaStream.getTracks().length > 0) {
      videoRef.current.srcObject = mediaStream;
      
      // Handle video element events
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded');
      };

      videoRef.current.oncanplay = () => {
        console.log('Video can start playing');
      };

      try {
        await videoRef.current.play();
        console.log('Video playback started');
      } catch (err) {
        console.error('Video playback failed:', err);
        // Don't throw here, audio might still work
      }
    }

    // Store all consumers globally (you might want to use an array)
    consumer = consumers[0]; // Keep backward compatibility

    return consumers;
  } catch (error) {
    console.error('Error creating receive transport:', error);
    throw error;
  }
};
// Cleanup resources
export const closeTransports = () => {
  try {
    console.log('Cleaning up transports...');
    
    // Close all consumers
    if (Array.isArray(consumer)) {
      consumer.forEach((cons, index) => {
        if (cons) {
          cons.close();
          console.log(`Consumer ${index} closed`);
        }
      });
      consumer = [];
    }
    
    // Legacy consumer cleanup
    if (consumer && !Array.isArray(consumer)) {
      consumer.close();
      consumer = null;
      console.log('Legacy consumer closed');
    }
    
    if (producerTransport) {
      producerTransport.close();
      producerTransport = null;
      console.log('Producer transport closed');
    }
    
    if (consumerTransport) {
      consumerTransport.close();
      consumerTransport = null;
      console.log('Consumer transport closed');
    }
    
    console.log('All transports cleaned up successfully');
  } catch (err) {
    console.error('Error during transport cleanup:', err);
  }
};
// Helper function to get device info
export const getDeviceInfo = () => {
  if (!device) return null;
  
  return {
    loaded: device.loaded,
    rtpCapabilities: device.rtpCapabilities,
    canProduce: {
      audio: device.canProduce('audio'),
      video: device.canProduce('video'),
    },
  };
};

// Helper function to check if device is ready
export const isDeviceReady = (): boolean => {
  return device && device.loaded;
};
