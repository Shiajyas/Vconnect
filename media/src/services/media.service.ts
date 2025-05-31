import * as mediasoupTypes from 'mediasoup/node/lib/types';
import { WebRtcTransport } from 'mediasoup/node/lib/types';

import {
  getOrCreateRouterForRoom,
  createWebRtcTransport,
  produce,
  consume,
  roomRouterMap,
  localTransportCache,
} from '../config/mediasoup.config';

class MediaService {
  async getOrCreateRouter(roomId: string): Promise<mediasoupTypes.Router> {
    return await getOrCreateRouterForRoom(roomId);
  }

  async createTransport(router: mediasoupTypes.Router, roomId: string): Promise<WebRtcTransport> {
    return await createWebRtcTransport(router, roomId);
  }

  async createProducer(
    transportId: string,
    kind: mediasoupTypes.MediaKind,
    rtpParameters: mediasoupTypes.RtpParameters
  ) {
    return await produce(transportId, kind, rtpParameters);
  }

  async createConsumer(
    router: mediasoupTypes.Router,
    transportId: string,
    producerId: string,
    rtpCapabilities: mediasoupTypes.RtpCapabilities
  ) {
    return await consume(router, transportId, producerId, rtpCapabilities);
  }

  // Expose the internal Maps for external usage (optional)
  get roomRouterMap() {
    console.log("roomRouterMap",roomRouterMap)
    return roomRouterMap;
  }

  get localTransportCache() {
    return localTransportCache;
  }
}

export const mediaService = new MediaService();
