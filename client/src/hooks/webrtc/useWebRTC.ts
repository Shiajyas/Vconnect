import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "@/utils/Socket";
import { useIncomingCallStore } from "@/appStore/useIncomingCallStore";

interface UseWebRTCProps {
  userId: string;
  chatId?: string;
  onCallEnd: () => void;
  onCallStart: () => void;
  setCallActive: (active: boolean) => void;
}

export const useWebRTC = ({
  userId,
  chatId,
  onCallEnd,
  onCallStart,
  setCallActive,
}: UseWebRTCProps) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);

  const { incomingCall, clearIncomingCall, setIncomingCall } = useIncomingCallStore();
  const callEndedRef = useRef(false);
  const [callPartnerId, setCallPartnerId] = useState<string | null>(null); // 👈 store who you are in call with

  const createPeerConnection = () => {
    console.log("📡 Creating RTCPeerConnection...");
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      console.log("🎥 Received remote track");
      const inboundStream = new MediaStream();
      event.streams[0].getTracks().forEach(track => inboundStream.addTrack(track));
      setRemoteStream(inboundStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = inboundStream;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && callPartnerId) {
        console.log("❄️ Sending ICE candidate");
        socket.emit("call:ice-candidate", {
          to: callPartnerId,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  };

    const startCall = useCallback(async (type: "voice" | "video") => {
      try {
        if (!chatId) throw new Error("chatId is undefined");
        callEndedRef.current = false;
        setCallPartnerId(chatId);
        console.log("📞 Starting call with", chatId);
        console.log("📞 Starting call with", callPartnerId);
        // console.log("📞 Starting call as", type);
        const constraints = type === "video" ? { audio: true, video: true } : { audio: true, video: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("📡 Got local stream");

        setLocalStream(stream);
        setIsMicOn(true);
        setIsVideoOn(type === "video");

        if (localVideoRef.current && type === "video") {
          localVideoRef.current.srcObject = stream;
        }

        const pc = createPeerConnection();
        setPeerConnection(pc);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("📤 Sending offer");

        socket.emit("call:offer", {
          from: userId,
          to: chatId,
          offer,
          type,
        });

        // setCallActive(true);
        onCallStart();
      } catch (err) {
        console.error("❌ Error starting call:", err);
        onCallEnd();
      }
    }, [userId, chatId, onCallStart, onCallEnd, setCallActive]);
    const endCall = useCallback(() => {
      callEndedRef.current = true;
    
      console.log("📴 Ending call...");
    
      // Close peer connection
      if (peerConnection) {
        peerConnection.close();
        setPeerConnection(null);
      }
    
      // Stop local and remote streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
    
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
      }
    
      // Send call:end to the partner (either caller or receiver)
      if (callPartnerId) {
        console.log("📤 Sending call:end to", callPartnerId);
        socket.emit("call:end", { to: callPartnerId });
      } else {
        console.warn("⚠️ Tried to end call, but no partner ID found");
      }
    
      // Reset state variables
      setIsMicOn(true);
      setIsVideoOn(true);
      setOffer(null);
      clearIncomingCall();
      onCallEnd();
      setCallActive(false);
      setCallPartnerId(null); // Clear the partner ID after the call ends
    
      // Clear video elements
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }, [peerConnection, localStream, remoteStream, callPartnerId, clearIncomingCall, onCallEnd, setCallActive]);
    
 
const acceptCall = useCallback(async () => {
  if (!incomingCall || !offer) return;

  try {
    // console.log("✅ Accepting incoming call", incomingCall);
    // console.log("offer", offer);
    callEndedRef.current = false;
    setCallPartnerId(incomingCall.caller._id); // 👈 remember the caller!

    const constraints = incomingCall.callType === "video"
      ? { audio: true, video: true }
      : { audio: true, video: false };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
    setIsMicOn(true);
    setIsVideoOn(incomingCall.callType === "video");

    if (localVideoRef.current && incomingCall.callType === "video") {
      localVideoRef.current.srcObject = stream;
    }

    const pc = createPeerConnection();
    setPeerConnection(pc);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Set the remote description (received offer)
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log("📩 Set remote description with offer");

    // Now handle ICE candidates (if any) after setting the remote description
    socket.on("ice-candidated", ({ candidate }: any) => {
      console.log("Received ICE candidate", candidate);
      if (pc && candidate) {
        pc.addIceCandidate(new RTCIceCandidate(candidate))
          .then(() => console.log("✅ ICE candidate added"))
          .catch((err) => console.error("❌ Failed to add ICE candidate:", err));
      }
    });

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log("📤 Sending answer");

    socket.emit("call:answer", {
      to: incomingCall.caller._id,
      answer,
    });

    setCallActive(true);
    onCallStart();
    clearIncomingCall();
    setOffer(null);
  } catch (err) {
    console.error("❌ Error accepting call:", err);
    onCallEnd();
  }
}, [incomingCall, offer, onCallStart, onCallEnd]);


  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !isMicOn;
    });
    console.log("🎙️ Toggled mic to", !isMicOn);
    setIsMicOn(prev => !prev);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(track => {
      track.enabled = !isVideoOn;
    });
    console.log("🎥 Toggled video to", !isVideoOn);
    setIsVideoOn(prev => !prev);
  };

  useEffect(() => {
    const handleIncomingCall = ({ from, offer, type, caller }: any) => {
      console.log("📞 Incoming call from:", caller, from);
      setIncomingCall({ caller, chatId: from, callType: type });
      setCallPartnerId(from); 
      setOffer(offer);
    };
  
    const handleCallAccepted = async ({ answer }: any) => {
      if (!peerConnection) return;
  
      try {
        console.log("📩 Setting remote description with answer", answer);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        setCallActive(true);
      } catch (err) {
        console.error("❌ Error setting remote description:", err);
      }
    };
  
    const handleRemoteCandidate = ({ candidate }: any) => {
      if (!peerConnection) return;
      console.log("🧊 Adding received ICE candidate", candidate);
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    };
  
    const handleCallEnd = () => {
      console.log("📴 Call ended by remote peer");
      endCall();
    };
  
    // Register socket event listeners
    const registerSocketListeners = () => {
      socket.on("incoming:call", handleIncomingCall);
      socket.on("call:accepted", handleCallAccepted);
      socket.on("ice-candidated", handleRemoteCandidate);
      socket.on("call:ended", handleCallEnd);
    };
  
    // Cleanup function to remove listeners
    const removeSocketListeners = () => {
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("ice-candidated", handleRemoteCandidate);
      socket.off("call:ended", handleCallEnd);
    };
  
    registerSocketListeners();
  
    return () => {
      console.log("🧹 Cleaning up socket listeners");
      removeSocketListeners();
    };
  }, [peerConnection, endCall, setCallActive]);
  
  useEffect(() => {
    return () => {
      console.log("🧹 Component unmounted, ending call...");
      endCall();
    };
  }, []);

  const toggleMute = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !isMicOn;
    });
    console.log("🎙️ Toggled mic to", !isMicOn);
    setIsMicOn(prev => !prev);
  };
  

  return {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isMicOn,
    isVideoOn,
    toggleMic,
    toggleVideo,
    startCall,
    endCall,
    acceptCall,
    toggleMute,
    // rejectCall,
    incomingCall,
  };
};
