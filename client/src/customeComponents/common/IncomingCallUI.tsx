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
  const [callEnded, setCallEnded] = useState(false);
  const [endedDuration, setEndedDuration] = useState<string | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const {
    acceptCall,
    endCall,
    toggleMic,
    toggleVideo,
    localStream,
    remoteStream,
    isRemoteMicOn,
    isRemoteVideoOn,
    isMicOn,
    isVideoOn,
  } = useWebRTC({
    userId: user?._id || "",
    chatId: activeCall?.chatId || "",
    onCallEnd: () => {
      const endTime = Date.now();
      if (callStartTimeRef.current) {
        const durationInSeconds = Math.floor(
          (endTime - callStartTimeRef.current) / 1000
        );
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;
        setEndedDuration(`${minutes}m ${seconds}s`);
      } else {
        setEndedDuration(null);
      }

      clearActiveCall();
      clearIncomingCall();
      setCallEnded(true);

      // Hide "Call Ended" message after 3 seconds
      setTimeout(() => {
        setCallEnded(false);
        setEndedDuration(null);
      }, 3000);
    },
    onCallStart: () => {
      callStartTimeRef.current = Date.now();
    },
    setCallActive: () => {},
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

  if (!incomingCall && !activeCall && !callEnded) return null;

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
        onToggleMic={() => toggleMic()}
        onToggleVideo={() => toggleVideo()}
        otherUser={activeCall.caller}
        callActive={!!activeCall}
        incomingCall={false}
        isRemoteMicOn={isRemoteMicOn}
        isRemoteVideoOn={isRemoteVideoOn}
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
          {incomingCall ? (
            <>
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
                    endCall(); // just in case a stream started
                    clearIncomingCall();
                    setCallEnded(true);
                    setTimeout(() => {
                      setCallEnded(false);
                    }, 3000);
                  }}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm"
                >
                  <PhoneOff className="w-4 h-4" /> Reject
                </button>
              </div>
            </>
          ) : (
            // Call Ended Message
            callEnded && (
              <div className="text-center mt-2 transition-opacity duration-500">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Call Ended
                </p>
               
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default IncomingCallUI;
