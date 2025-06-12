import { Device, SendTransport, Producer, Consumer, RecvTransport } from 'mediasoup-client';
import { Socket } from 'socket.io-client';
import React from 'react';

// Global mediasoup-client device and transports references
let device: Device | null = null;
let isConnected = false;

let producerTransport: SendTransport 
let consumerTransport: RecvTransport 

// Track all active producers and consumers separately and consistently
let producers: Producer[] = [];
let consumers: Consumer[] = [];

interface TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
  sctpParameters?: any;
}

// Generic request utility for socket.io request-response pattern
const request = <T>(
  socket: Socket,
  event: string,
  data: object = {}
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Request timeout: ${event}`)), 10000);

    socket.emit(event, data, (response: T | { error?: string }) => {
      clearTimeout(timeout);
      if (!response) return reject(new Error(`No response for ${event}`));
      if ('error' in response && response.error) return reject(new Error(response.error));
      resolve(response as T);
    });
  });
};

const getIceServers = () => [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  {
    urls: ['turn:137.59.87.137:3478', 'turns:137.59.87.137:5349'],
    username: 'webrtcuser',
    credential: 'securepassword',
  },
];

// Load mediasoup device with RTP capabilities from server
export const loadDevice = async (socket: Socket, streamId?: string): Promise<void> => {
  if (device?.loaded) {
    console.log('[DeviceLoader] Device already loaded, skipping');
    return;
  }

  const { routerRtpCapabilities } = await request<{ routerRtpCapabilities: any }>(
    socket,
    'get-rtp-capabilities',
    streamId ? { streamId } : {}
  );

  if (!routerRtpCapabilities || typeof routerRtpCapabilities !== 'object') {
    throw new Error('[DeviceLoader] Invalid RTP Capabilities from server');
  }

  try {
    const newDevice = new Device();
    await newDevice.load({ routerRtpCapabilities });
    device = newDevice;
    console.log('[DeviceLoader] Device loaded successfully');
  } catch (err) {
    console.error('[DeviceLoader] Failed to load device:', err);
    throw err;
  }
};

// Create send transport and produce all tracks of the media stream
export const createSendTransport = async (
  socket: Socket,
  stream: MediaStream,
  streamId: string
): Promise<Producer[]> => {
  if (!device || !device.loaded) {
    console.warn('[SendTransport] Device not loaded, loading now...');
    await loadDevice(socket, streamId);
  }

  // Prevent duplicate creation
  if (producerTransport && producerTransport.connectionState !== 'closed') {
    console.warn('[SendTransport] Reusing existing producer transport.');
    return producers;
  }

  const { transportOptions } = await request<{ transportOptions: TransportOptions }>(
    socket,
    'create-transport',
    { streamId }
  );

  if (!transportOptions || !transportOptions.id) {
    throw new Error('[SendTransport] Invalid transport options from server.');
  }

  try {
    producerTransport = device!.createSendTransport({
      ...transportOptions,
      iceServers: getIceServers(),
    });

    console.log('[SendTransport] Transport created with ID:', producerTransport.id);
  } catch (err) {
    console.error('[SendTransport] Failed to create send transport:', err);
    throw err;
  }

  if (!producerTransport) {
    throw new Error('[SendTransport] Producer transport creation returned null');
  }

  // Handle connect
  producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    try {
      await request(socket, 'connect-transport', {
        transportId: producerTransport.id,
        dtlsParameters,
      });
      console.log('[SendTransport] Connected');
      callback();
    } catch (error) {
      console.error('[SendTransport] Connect failed:', error);
      errback(error);
    }
  });

  // Handle produce
  producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
    try {
      const { id, error } = await request<{ id: string; error?: string }>(socket, 'produce', {
        transportId: producerTransport.id,
        kind,
        rtpParameters,
        streamId,
      });

      if (error || !id) {
        throw new Error(error || '[SendTransport] No producer ID received from server');
      }

      console.log(`[SendTransport] Producer confirmed by server with ID: ${id}`);
      callback({ id });
    } catch (err) {
      console.error('[SendTransport] Error in produce event:', err);
      errback(err);
    }
  });

  // Create producers for each track
  try {
    producers = [];

    for (const track of stream.getTracks()) {
      console.log(`[SendTransport] Producing track: ${track.kind}`);
      const producer = await producerTransport.produce({
        track,
        appData: { streamId },
      });
      producers.push(producer);
    }

    console.log('[SendTransport] All producers created:', producers.map(p => p.id));
  } catch (err) {
    console.error('[SendTransport] Failed while producing tracks:', err);
    throw err;
  }

  return producers;
};


// Create receive transport and consume remote tracks
export const createRecvTransport = async (
  socket: Socket,
  streamId: string,
  videoRef: React.RefObject<HTMLVideoElement>,
  setStream: (stream: MediaStream) => void
): Promise<Consumer> => {
  if (!device || !device.loaded) {
    await loadDevice(socket, streamId);
  }

  const { transportOptions } = await request<{ transportOptions: TransportOptions }>(
    socket,
    'create-transport',
    { streamId }
  );

  consumerTransport = device.createRecvTransport({
    ...transportOptions,
    iceServers: getIceServers(),
  });

  consumerTransport.on(
    'connect',
    async ({ dtlsParameters }, callback, errback) => {
      try {
        await request(socket, 'connect-transport', {
          transportId: consumerTransport!.id,
          dtlsParameters,
        });
        console.log('[RecvTransport] Connected');
        callback();
      } catch (error) {
        console.error('[RecvTransport] Connect failed:', error);
        errback(error);
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
    rtpCapabilities: device.rtpCapabilities,
  });

  if (!consumerInfo.id) {
    throw new Error('[RecvTransport] No consumer received from server.');
  }

  console.log('[RecvTransport] Consumer info received:', consumerInfo);

  const consumer = await consumerTransport.consume({
    id: consumerInfo.id,
    producerId: consumerInfo.producerId,
    kind: consumerInfo.kind,
    rtpParameters: consumerInfo.rtpParameters,
  });

  // Add to consumers list
  consumers.push(consumer);

  const mediaStream = new MediaStream();
  mediaStream.addTrack(consumer.track);

  setStream(mediaStream);

  if (videoRef.current) {
    const videoEl = videoRef.current;

    // Assign stream only if changed to avoid repeated loads
    if (videoEl.srcObject !== mediaStream) {
      videoEl.srcObject = mediaStream;
    }

    // Mute to satisfy autoplay policy
    videoEl.muted = true;
    videoEl.volume = 0;

    try {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        await playPromise;
        // Playback started, unmute
        videoEl.muted = false;
        videoEl.volume = 1.0;
        console.log('[RecvTransport] Stream playing successfully');
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.warn('[RecvTransport] Autoplay aborted, user interaction might be needed.');

        // Retry after delay
        setTimeout(() => {
          videoEl.play().catch(err => {
            console.error('[RecvTransport] Play retry failed:', err);
          });
        }, 1000);
      } else {
        console.error('[RecvTransport] Error playing video:', e);
      }
    }
  } else {
    console.error('[RecvTransport] Video element ref is null');
  }

  return consumer;
};

// Clean up all producers, consumers, and transports
export const closeTransports = (): void => {
  try {
    console.log('[Transports] Closing all transports...');

    // Close producers
    producers.forEach((producer, idx) => {
      try {
        producer.close();
        console.log(`[Transports] Producer ${idx} closed`);
      } catch (e) {
        console.warn(`[Transports] Failed to close producer ${idx}:`, e);
      }
    });
    producers = [];

    // Close consumers
    consumers.forEach((consumer, idx) => {
      try {
        consumer.close();
        console.log(`[Transports] Consumer ${idx} closed`);
      } catch (e) {
        console.warn(`[Transports] Failed to close consumer ${idx}:`, e);
      }
    });
    consumers = [];

    // Close producer transport
    if (producerTransport) {
      try {
        producerTransport.close();
        console.log('[Transports] Producer transport closed');
      } catch (e) {
        console.warn('[Transports] Failed to close producer transport:', e);
      }
      producerTransport = null;
      isConnected = false;
    }

    // Close consumer transport
    if (consumerTransport) {
      try {
        consumerTransport.close();
        console.log('[Transports] Consumer transport closed');
      } catch (e) {
        console.warn('[Transports] Failed to close consumer transport:', e);
      }
      consumerTransport = null;
    }
  } catch (error) {
    console.error('[Transports] Cleanup error:', error);
  }
};
