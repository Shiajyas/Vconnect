import React, { useState, useRef, useEffect } from "react";
import { Phone, PhoneOff, ChevronDown, ChevronUp } from "lucide-react";
import { useIncomingCallStore } from "@/appStore/useIncomingCallStore";
import { useWebRTC } from "@/hooks/webrtc/useWebRTC";
import { useAuthStore } from "@/appStore/AuthStore";
import CallUI from "../home/chat/CallUI";

const IncomingCallUI = () => {
  const {
    incomingCall,
    activeCall,
    setActiveCall,
    clearIncomingCall,
    clearActiveCall,
  } = useIncomingCallStore();
  const { user } = useAuthStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  // const [isMuted, setIsMuted] = useState(false);
  // const [isVideoON, setIsVideoOf] = useState(false);

  console.log("activeCall", activeCall);

  useEffect(() => {
    // Reset the mute state when the component is mounted or when incoming call changes
    // setIsVideoOf(false);
    // setIsMuted(false);
  }, [incomingCall]);

  const {
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    localStream,
    remoteStream,
    isMicOn,
    isVideoOn,
  } = useWebRTC({
    userId: user?._id || "",
    chatId: activeCall?.chatId || "", // << use activeCall
    onCallEnd: () => {
      clearActiveCall();
      clearIncomingCall(); // extra safety
    },
    onCallStart: () => {},
    setCallActive: () => {}, // You'll want to ensure this function does something if needed
  });

  useEffect(() => {
    const screenWidth = window.innerWidth;
    const modalWidth = 320;
    setPosition({
      x: (screenWidth - modalWidth) / 2,
      y: 20,
    });
  }, []);

  const startDragging = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    isDragging.current = true;
    const rect = dragRef.current.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = e.clientX - offset.current.x;
      const newY = e.clientY - offset.current.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!incomingCall && !activeCall) return null; // << no data? don't show

  // === If Call Accepted, Render Full CallUI ===
  if (activeCall) {
    return (
      <CallUI
        callType={activeCall?.callType || "voice"}
        onClose={() => {
          endCall();
          clearActiveCall();
          clearIncomingCall();
        }}
        localStream={localStream}
        remoteStream={remoteStream}
        isMicOn={isMicOn}
        isVideoOn={isVideoOn}
        onToggleMic={() => {
          toggleMute();
          // setIsMuted((prev) => !prev);
        }}
        onToggleVideo={() => {
          toggleVideo();
          // setIsVideoOf((prev) => !prev);
        }}
        otherUser={activeCall.caller}
        callActive={true}
        incomingCall={false}
      />
    );
  }

  // === Incoming Call Popup ===
  return (
    <div
      ref={dragRef}
      onMouseDown={startDragging}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        cursor: "move",
        width: "320px",
      }}
      className="shadow-xl rounded-xl overflow-hidden bg-white dark:bg-gray-900 transition-all"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <span className="text-sm font-medium text-gray-800 dark:text-white">
          Incoming {incomingCall?.callType} call
        </span>
        <button
          onClick={() => setIsMinimized((prev) => !prev)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
          aria-label="Toggle"
        >
          {isMinimized ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      {!isMinimized && (
        <div className="p-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {incomingCall?.caller.username}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            wants to start a {incomingCall?.callType} call
          </p>

          <div className="mt-4 flex gap-3 justify-center">
            <button
              onClick={() => {
                acceptCall();
                setActiveCall(incomingCall!);
                clearIncomingCall();
              }}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm"
            >
              <Phone className="w-4 h-4" /> Accept
            </button>
            <button
              onClick={() => {
                endCall();
                clearIncomingCall();
              }}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm"
            >
              <PhoneOff className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingCallUI;
