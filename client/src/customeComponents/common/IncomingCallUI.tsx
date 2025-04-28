import React, { useState, useRef, useEffect } from "react";
import { Phone, PhoneOff, User, ChevronDown, ChevronUp, Mic, MicOff } from "lucide-react";
import { useIncomingCallStore } from "@/appStore/useIncomingCallStore";
import { useWebRTC } from "@/hooks/webrtc/useWebRTC";
import { useAuthStore } from "@/appStore/AuthStore";

const IncomingCallUI = () => {
  const { incomingCall, clearIncomingCall } = useIncomingCallStore();
  const { user } = useAuthStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const [waveData, setWaveData] = useState<number[]>(new Array(64).fill(0));

  const { acceptCall, endCall, toggleMute, localStream, remoteStream } = useWebRTC({
    userId: user?._id || "",
    chatId: incomingCall?.caller?._id,
    onCallEnd: () => {
      clearIncomingCall();
      setCallActive(false);
    },
    onCallStart: () => {
      setCallActive(true);
      startCallDurationTimer();
    },
    setCallActive: (active: boolean) => {
      setCallActive(active);
    },

  });

  const startCallDurationTimer = () => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  };

  useEffect(() => {
    const screenWidth = window.innerWidth;
    const modalWidth = 320;
    setPosition({
      x: (screenWidth - modalWidth) / 2,
      y: 20,
    });
  }, []);

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

  const startDragging = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    isDragging.current = true;
    const rect = dragRef.current.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  if (!incomingCall && !callActive) return null;

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
          {callActive ? "Active Call" : `Incoming ${incomingCall?.callType} call`}
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
          <div className="flex flex-col items-center">
            {incomingCall?.caller?.avatar ? (
              <img
                src={incomingCall.caller.avatar}
                alt={incomingCall.caller.username}
                className="w-16 h-16 rounded-full object-cover mb-2"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center mb-2">
                <User className="text-white w-8 h-8" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {incomingCall?.caller?.username}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              {callActive ? "You are in a call" : `wants to start a ${incomingCall?.callType} call`}
            </p>

            {callActive && (
              <div className="mt-2 flex gap-4 justify-center">
                <div className="relative">
                <video
  ref={localStream ? (el) => { if (el) el.srcObject = localStream; } : null}
  autoPlay
  muted
  className="w-32 h-32 rounded-lg border-2 border-gray-300"
/>

                  <span className="absolute bottom-0 left-0 text-xs bg-gray-900 text-white p-1 rounded">You</span>
                </div>
                {remoteStream && (
                  <div className="relative">
                    <video
                      ref={remoteStream ? (el) => { if (el) el.srcObject  = remoteStream; } : null}
                      autoPlay
                      className="w-32 h-32 rounded-lg border-2 border-gray-300"
                    />
                    <span className="absolute bottom-0 left-0 text-xs bg-gray-900 text-white p-1 rounded">{incomingCall?.caller?.username}</span>
                  </div>
                )}
              </div>
            )}

            {callActive && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Call Time: {Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, "0")}
              </div>
            )}

            {callActive && (
              <div className="mt-2">
                <div
                  className="h-2 bg-green-500"
                  style={{ width: `${waveData[0]}%` }}
                ></div>
              </div>
            )}

            <div className="mt-4 flex gap-3 justify-center">
              {!callActive ? (
                <>
                  <button
                    onClick={() => {
                      acceptCall();
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
                </>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <button
                    onClick={() => {
                      endCall();
                      setCallActive(false);
                    }}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm"
                  >
                    <PhoneOff className="w-4 h-4" /> End Call
                  </button>
                  <button
                    onClick={() => {
                      toggleMute();
                      setIsMuted((prev) => !prev);
                    }}
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full text-sm"
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />} Mute
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingCallUI;
