import { Device } from 'mediasoup-client';
import { Socket } from 'socket.io-client';
import { useLiveStore } from '@/appStore/useLiveStore';
import { Consumer } from 'mediasoup-client/types';


let device: Device;
let producerTransport: any;
let consumerTransport: any;
let consumer: any;


interface ConsumeResponse {
  consumers: {
    id: string;
    producerId: string;
    kind: 'video' | 'audio';
    rtpParameters: any;
  }[];
}

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


export const loadDevice = async (
  socket: Socket,
  streamId?: string
): Promise<void> => {
  try {
    console.log('[DeviceLoader] Loading device with streamId:', streamId);

    if (device && device.loaded) {
      console.log('[DeviceLoader] Device already loaded — skipping reinit.');
      return;
    }

    const requestData = streamId ? { streamId } : {};
    const { routerRtpCapabilities } = await request<{
      routerRtpCapabilities: import('mediasoup-client').types.RtpCapabilities;
    }>(socket, 'get-rtp-capabilities', requestData);

    if (!routerRtpCapabilities || !routerRtpCapabilities.codecs?.length) {
      throw new Error('[DeviceLoader] Invalid or empty RTP capabilities received from server');
    }

    device = new Device();
    await device.load({ routerRtpCapabilities });

    console.log('[DeviceLoader] Device loaded successfully');
  } catch (error) {
    console.error('[DeviceLoader] Failed to load device:', error);
    throw error;
  }
};


const getIceServers = () => [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302'
    ]
  },
{
  urls: ['turn:137.59.87.137:3478', 'turns:137.59.87.137:5349'],
  username: 'webrtcuser',
  credential: 'securepassword'
}

];



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

    // ✅ Create transport with ICE servers
    producerTransport = device.createSendTransport({
      ...transportOptions,
      iceServers: getIceServers()
    });

    // ✅ Required MediaSoup event handlers
    producerTransport.on('connect', async ({ dtlsParameters }: { dtlsParameters: any }, callback:({id}:{id : string})=> void, errback: (error: Error) => void) => {
      try {
        console.log('Connecting send transport',dtlsParameters);
        await request(socket, 'connect-transport', {
          transportId: producerTransport.id,
          dtlsParameters,
        });
        console.log('Send transport connected');
        callback({ id: producerTransport.id });
      } catch (err) {
        console.error('Error connecting send transport:', err);
        errback(err instanceof Error ? err : new Error(String(err)));
      }
    });
    producerTransport.on(
      'produce',
      async ({ kind, rtpParameters }: { kind: string, rtpParameters: unknown }, callback: (params: { id: string }) => void, errback: (error: Error) => void) => {
        try {
          console.log('🎬 Producing track:', kind);
          
          // ✅ Enhanced logging of RTP parameters
          console.log('📊 RTP Parameters summary:', {
            kind,
            mid: (rtpParameters as any)?.mid,
            codecsCount: (rtpParameters as any)?.codecs?.length || 0,
            encodingsCount: (rtpParameters as any)?.encodings?.length || 0
          });
          
          const produceData = {
            transportId: producerTransport.id,
            kind,
            rtpParameters,
            // ✅ Add transport state for debugging
            transportState: {
              connectionState: producerTransport.connectionState,
              iceState: producerTransport.iceState,
              iceGatheringState: producerTransport.iceGatheringState,
              dtlsState: (producerTransport as any).dtlsState // May not be available on client
            }
          };
          
          console.log('🎬 Sending produce request with data:', {
            transportId: produceData.transportId,
            kind: produceData.kind,
            transportState: produceData.transportState
          });
          
          const response = await request<{ id: string; error?: string }>(socket, 'produce', produceData);
          
          if (response.error) {
            throw new Error(`Server error: ${response.error}`);
          }
          
          if (!response.id) {
            throw new Error('No producer ID received from server');
          }
          
          console.log('✅ Producer created with ID:', response.id);
          callback({ id: response.id });
          
        } catch (err) {
          console.error('❌ Error producing:', err);
          errback(err instanceof Error ? err : new Error(String(err)));
        }
      }
    );    // Produce tracks
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


export const createRecvTransport = async (
  socket: Socket,
  streamId: string,
  videoRef: React.RefObject<HTMLVideoElement>,
  setStream: (stream: MediaStream) => void   // New parameter to set stream in Zustand
): Promise<Consumer> => {
  try {
    console.log('[RecvTransport] Creating receive transport for streamId:', streamId);

    if (!device || !device.loaded) {
      console.log('[RecvTransport] Loading device...');
      await loadDevice(socket, streamId);
    }

    const { transportOptions } = await request<{ transportOptions: any }>(
      socket,
      'create-transport',
      { streamId }
    );

    consumerTransport = device.createRecvTransport({
      ...transportOptions,
      iceServers: getIceServers()
    });

    consumerTransport.on(
      'connect',
      async (
        { dtlsParameters }: { dtlsParameters: unknown },
        callback: () => void,
        errback: (error: Error) => void
      ) => {
        try {
          await request(socket, 'connect-transport', {
            transportId: consumerTransport.id,
            dtlsParameters
          });
          console.log('[RecvTransport] Transport connected');
          callback();
        } catch (err) {
          console.error('[RecvTransport] Failed to connect transport:', err);
          errback(err instanceof Error ? err : new Error(String(err)));
        }
      }
    );

    const consumerInfo = await request<{
      id: string;
      producerId: string;
      kind: 'video' | 'audio';
      rtpParameters: any;
    }>(socket, 'consume', {
      streamId,
      transportId: consumerTransport.id,
      rtpCapabilities: device.rtpCapabilities
    });

    if (!consumerInfo.id) {
      throw new Error('[RecvTransport] No consumer received from server.');
    }

    console.log('[RecvTransport] Received consumer info:', consumerInfo);

    const consumer = await consumerTransport.consume({
      id: consumerInfo.id,
      producerId: consumerInfo.producerId,
      kind: consumerInfo.kind,
      rtpParameters: consumerInfo.rtpParameters,
    });

    // Create a new MediaStream and add the track
    const mediaStream = new MediaStream();
    mediaStream.addTrack(consumer.track);

    // Set the stream in Zustand immediately
    setStream(mediaStream);

    console.log('[RecvTransport] Media stream created and set in Zustand', mediaStream);

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.muted = false; // Unmute for viewer
      videoRef.current.volume = 1.0;

      try {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('[RecvTransport] Stream playing successfully');
            })
            .catch(e => {
              console.warn('[RecvTransport] Autoplay blocked, user interaction required.', e);
              setTimeout(() => {
                videoRef.current?.play()
                  .catch(err => console.error('[RecvTransport] Second play attempt failed:', err));
              }, 1000);
            });
        }
      } catch (e) {
        console.warn('[RecvTransport] Error during play:', e);
      }
    } else {
      console.error('[RecvTransport] Video element reference is null');
    }

    return consumer;

  } catch (error) {
    console.error('[RecvTransport] Error:', error);
    throw error;
  }
};


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
