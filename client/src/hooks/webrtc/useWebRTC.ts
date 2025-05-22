import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '@/utils/Socket';
import { useIncomingCallStore } from '@/appStore/useIncomingCallStore';

interface UseWebRTCProps {
  userId: string;
  chatId?: string;
  onCallEnd: () => void;
  onCallStart: () => void;
  setCallActive: (active: boolean) => void;
  callType?: 'voice' | 'video';
  activeChatId?: string;
}
export const useWebRTC = ({
  userId,
  chatId,
  onCallEnd,
  onCallStart,
  setCallActive,
  callType,
  activeChatId,
}: UseWebRTCProps) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);

  const { incomingCall, clearIncomingCall, setIncomingCall } = useIncomingCallStore();
  const callEndedRef = useRef(false);
  const [callPartnerId, setCallPartnerId] = useState<string | null>(null);

  const [isRemoteMicOn, setIsRemoteMicOn] = useState(true); // Default: mic is on
  const [isRemoteVideoOn, setIsRemoteVideoOn] = useState(true); // Default: video is on

  const createPeerConnection = () => {
    console.log('📡 Creating RTCPeerConnection...');
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.ontrack = (event) => {
      console.log('🎥 Received remote track');
      const inboundStream = new MediaStream();
      event.streams[0].getTracks().forEach((track) => inboundStream.addTrack(track));
      setRemoteStream(inboundStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = inboundStream;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && callPartnerId) {
        console.log('❄️ Sending ICE candidate');
        socket.emit('call:ice-candidate', {
          to: callPartnerId,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  };

  const startCall = useCallback(
    async (type: 'voice' | 'video') => {
      try {
        if (!chatId) throw new Error('chatId is undefined');
        callEndedRef.current = false;
        setCallPartnerId(chatId);
        // console.log("📞 Starting call with", chatId);

        // callStartTimeRef.current = new Date();

        console.log(callStartTimeRef.current, 'call start time 1');

        const constraints =
          type === 'video' ? { audio: true, video: true } : { audio: true, video: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('📡 Got local stream');

        setLocalStream(stream);
        setIsMicOn(true);
        setIsVideoOn(type === 'video');

        if (localVideoRef.current && type === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        // Set local audio for voice call
        if (localAudioRef.current && type === 'voice') {
          localAudioRef.current.srcObject = stream;
        }

        const pc = createPeerConnection();
        setPeerConnection(pc);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('📤 Sending offer');

        socket.emit('call:offer', {
          from: userId,
          to: chatId,
          offer,
          type,
        });

        onCallStart();
      } catch (err) {
        console.error('❌ Error starting call:', err);
        onCallEnd();
      }
    },
    [userId, chatId, onCallStart, onCallEnd, setCallActive],
  );

  const endCall = useCallback(() => {
    callEndedRef.current = true;
    console.log('📴 Ending call...');

    const endedAt = new Date();
    const startedAt = callStartTimeRef.current ?? endedAt;

    console.log('start time 3', startedAt);
    console.log('end time', endedAt);

    // Send call:end to the partner
    if (callPartnerId) {
      console.log('📤 Sending call:end to', callPartnerId);

      socket.emit('call:end', {
        to: callPartnerId,
        from: userId,
        type: callType,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        chatId: activeChatId ?? null,
      });
    } else {
      console.warn('⚠️ Tried to end call, but no partner ID found');
    }

    // --- Cleanup (same as before) ---
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }

    setIsMicOn(true);
    setIsVideoOn(true);
    setOffer(null);
    clearIncomingCall();
    onCallEnd();
    setCallActive(false);
    setCallPartnerId(null);
    setIsRemoteMicOn(true);
    setIsRemoteVideoOn(true);

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localAudioRef.current) localAudioRef.current.srcObject = null;
  }, [
    peerConnection,
    localStream,
    remoteStream,
    callPartnerId,
    clearIncomingCall,
    onCallEnd,
    setCallActive,
    userId,
    callType,
    activeChatId,
  ]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !offer) return;

    try {
      callEndedRef.current = false;
      setCallPartnerId(incomingCall.caller._id);

      callStartTimeRef.current = new Date();

      console.log(callStartTimeRef.current, 'call start time 2');

      // Get the available media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter((device) => device.kind === 'audioinput');
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      if (!audioDevices.length || (incomingCall.callType === 'video' && !videoDevices.length)) {
        throw new Error('No available media devices');
      }

      // Dynamically select devices for each browser
      const selectedAudioDevice = audioDevices[0]; // Use the first available audio device
      const selectedVideoDevice = incomingCall.callType === 'video' ? videoDevices[0] : null; // Use first video device if it's a video call

      const constraints = {
        audio: {
          deviceId: selectedAudioDevice.deviceId,
        },
        video: selectedVideoDevice ? { deviceId: selectedVideoDevice.deviceId } : false,
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        if ((err as any)?.name === 'NotReadableError') {
          alert(
            'Your microphone or camera is in use by another application. Please close other apps using it.',
          );
        }
        throw err;
      }

      setLocalStream(stream);
      setIsMicOn(true);
      setIsVideoOn(incomingCall.callType === 'video');

      if (localVideoRef.current && incomingCall.callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      if (localAudioRef.current && incomingCall.callType === 'voice') {
        localAudioRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      setPeerConnection(pc);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      // console.log("📩 Set remote description with offer");

      socket.on('ice-candidate', ({ candidate }: any) => {
        if (pc && candidate) {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      // console.log("📤 Sending answer");

      socket.emit('call:answer', {
        to: incomingCall.caller._id,
        answer,
      });

      setCallActive(true);
      onCallStart();
      clearIncomingCall();
      setOffer(null);
    } catch (err) {
      console.error('❌ Error accepting call:', err);
      onCallEnd();
    }
  }, [incomingCall, offer, onCallStart, onCallEnd]);

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !isMicOn;
    });
    setIsMicOn((prev) => {
      const newMicState = !prev;
      if (callPartnerId) {
        socket.emit('call:toggle-mic', {
          to: callPartnerId,
          micOn: newMicState,
        });
      }
      console.log('🎙️ Toggled mic to', newMicState);
      return newMicState;
    });
  };

  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !isVideoOn;
    });
    setIsVideoOn((prev) => {
      const newVideoState = !prev;
      if (callPartnerId) {
        socket.emit('call:toggle-video', {
          to: callPartnerId,
          videoOn: newVideoState,
        });
      }
      console.log('🎥 Toggled video to', newVideoState);
      return newVideoState;
    });
  };

  useEffect(() => {
    const handleIncomingCall = ({ from, offer, type, caller }: any) => {
      console.log('📞 Incoming call from:', caller, from);
      setIncomingCall({ caller, chatId: from, callType: type });
      setCallPartnerId(from);
      setOffer(offer);
    };

    const handleCallAccepted = async ({ answer }: any) => {
      if (!peerConnection) return;

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        setCallActive(true);
      } catch (err) {
        console.error('❌ Error setting remote description:', err);
      }
    };

    const handleRemoteCandidate = ({ candidate }: any) => {
      if (!peerConnection) return;
      // console.log("🧊 Adding received ICE candidate", candidate);
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleCallEnd = () => {
      console.log('📴 Call ended by remote peer');
      endCall();
    };
    const handlePartnerMicToggle = ({ micOn }: { micOn: boolean }) => {
      // console.log("🎤 Partner mic toggled:", micOn ? "ON" : "OFF");
      setIsRemoteMicOn(micOn);
      // You can show some UI state here, like a muted mic icon
    };

    const handlePartnerVideoToggle = ({ videoOn }: { videoOn: boolean }) => {
      // console.log("🎥 Partner video toggled:", videoOn ? "ON" : "OFF");
      setIsRemoteVideoOn(videoOn);
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        const videoTracks = (remoteVideoRef.current.srcObject as MediaStream).getVideoTracks();
        videoTracks.forEach((track) => {
          track.enabled = videoOn;
        });
      }
    };

    const registerSocketListeners = () => {
      socket.on('incoming:call', handleIncomingCall);
      socket.on('call:accepted', handleCallAccepted);
      socket.on('ice-candidated', handleRemoteCandidate);
      socket.on('call:ended', handleCallEnd);
      socket.on('call:toggle-mic', handlePartnerMicToggle);
      socket.on('call:toggle-video', handlePartnerVideoToggle);
    };

    const removeSocketListeners = () => {
      socket.off('incoming:call', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('ice-candidated', handleRemoteCandidate);
      socket.off('call:ended', handleCallEnd);

      socket.off('call:toggle-mic', handlePartnerMicToggle);
      socket.off('call:toggle-video', handlePartnerVideoToggle);
    };

    registerSocketListeners();

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      removeSocketListeners();
    };
  }, [peerConnection, endCall, setCallActive]);

  // useEffect(() => {
  //   return () => {
  //     console.log("🧹 Component unmounted, ending call...");
  //     endCall();
  //   };
  // }, []);

  const toggleMute = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !isMicOn;
    });
    // console.log("🎙️ Toggled mic to", !isMicOn);
    setIsMicOn((prev) => !prev);
  };

  return {
    localVideoRef,
    remoteVideoRef,
    localAudioRef, // Returning local audio reference
    localStream,
    remoteStream,
    isMicOn,
    isVideoOn,
    isRemoteMicOn,
    isRemoteVideoOn,
    toggleMic,
    toggleVideo,
    startCall,
    endCall,
    acceptCall,
    toggleMute,
    incomingCall,
  };
};
