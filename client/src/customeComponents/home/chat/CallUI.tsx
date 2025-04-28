import React, { useEffect, useState } from "react";
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, User } from "lucide-react";

interface CallUIProps {
  callType: "voice" | "video";
  onClose: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicOn: boolean;
  isVideoOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  otherUser?: { username: string; avatar?: string };
  callActive: boolean;
  incomingCall: boolean; // New prop to indicate if it's an incoming call for the recipient
}

const CallUI: React.FC<CallUIProps> = ({
  callType,
  onClose,
  localStream,
  remoteStream,
  isMicOn,
  isVideoOn,
  onToggleMic,
  onToggleVideo,
  otherUser,
  callActive,
  incomingCall,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [audioStarted, setAudioStarted] = useState(false); // Tracks if user has interacted
  const [ringback, setRingback] = useState<HTMLAudioElement | null>(null);
  const [ringtone, setRingtone] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Start call timer once the call is active (only after the call is accepted)
    if (!callActive) return;
    const interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [callActive]);
  console.log("Call active:", callActive);
  console.log("Incoming call:", incomingCall);
  useEffect(() => {
    function setupAudio() {
      const newRingback = new Audio('/sounds/outgoing-ring.mp3');
      const newRingtone = new Audio('/sounds/ringtone.mp3');
      newRingback.loop = true;
      newRingtone.loop = true;
      setRingback(newRingback);
      setRingtone(newRingtone);
    }

    // Allow user to interact with the page before playing sound
    function handleAudioStart() {
      if (!audioStarted) {
        setAudioStarted(true);
        setupAudio();
      }
    }

    // Event listener for user interaction (click anywhere)
    const audioStartListener = () => handleAudioStart();
    document.body.addEventListener('click', audioStartListener);

    // Cleanup audio listeners and stop sounds
    return () => {
      document.body.removeEventListener('click', audioStartListener);
      // Stop the audio when the component is unmounted or the call ends
      if (ringback) {
        ringback.pause();
        ringback.currentTime = 0;
      }
      if (ringtone) {
        ringtone.pause();
        ringtone.currentTime = 0;
      }
    };
  }, [ ringback, ringtone]);

  useEffect(() => {
    if (!audioStarted) return;

    // Play incoming ringtone for incoming calls
    if (incomingCall  ) {
      try {
        ringtone?.play();
        console.log("Ringtone playing...");
      } catch (err) {
        console.warn("Failed to play ringtone", err);
      }
    }else{
      setRingtone(null);
      console.log("Ringtone stopped...");
    }

    // Play outgoing ringback for outgoing calls
    if (!callActive ) {
      try {
        ringback?.play();
        console.log("Ringback playing...");
      } catch (err) {
        setRingback(null);
        console.warn("Failed to play ringback", err);
      }
    }
  }, [incomingCall, callActive, ringback, ringtone]);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    const localVideo = document.getElementById("local-video") as HTMLVideoElement | null;
    const remoteVideo = document.getElementById("remote-video") as HTMLVideoElement | null;

    if (localVideo && localStream) {
      localVideo.srcObject = localStream;
    }

    if (remoteVideo && remoteStream) {
      remoteVideo.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center transition-all">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 w-[90%] sm:w-96 shadow-2xl">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {callType === "voice" ? "Voice Call" : "Video Call"}
          </h2>
        </div>

        {callType === "video" && (
          <div className="relative w-full h-64 mb-2 rounded-lg overflow-hidden bg-black flex items-center justify-center">
            {!remoteStream && <p className="text-white absolute">Connecting...</p>}
            <video
              id="remote-video"
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <video
              id="local-video"
              autoPlay
              muted
              playsInline
              className="absolute bottom-2 right-2 w-24 h-24 sm:w-28 sm:h-28 border-2 border-white rounded-lg object-cover"
            />
          </div>
        )}

        {callType === "voice" && (
          <div className="w-full h-48 flex items-center justify-center rounded-lg mb-2 bg-gray-100 dark:bg-gray-800">
            <div className="flex flex-col items-center">
              {otherUser?.avatar ? (
                <img
                  src={otherUser.avatar}
                  alt={otherUser.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <User className="text-white w-10 h-10" />
                </div>
              )}
              <p className="text-base mt-2 text-gray-700 dark:text-white">
                {otherUser?.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                On voice call...
              </p>
            </div>
          </div>
        )}

        {callActive && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mb-4">
            {formatTime(seconds)}
          </p>
        )}

        <div className="flex justify-center items-center gap-4 mt-2">
          <button
            onClick={onToggleMic}
            className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-110 transition"
            aria-label="Toggle Microphone"
            tabIndex={0}
          >
            {isMicOn ? <Mic className="text-green-500" /> : <MicOff className="text-red-500" />}
          </button>

          {callType === "video" && (
            <button
              onClick={onToggleVideo}
              className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:scale-110 transition"
              aria-label="Toggle Video"
              tabIndex={0}
            >
              {isVideoOn ? <Video className="text-green-500" /> : <VideoOff className="text-red-500" />}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition hover:scale-110"
            aria-label="End Call"
            tabIndex={0}
          >
            <PhoneOff />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallUI;
