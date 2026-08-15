import { useState, useEffect, useRef } from "react";
import { Play, Pause, Maximize2, X } from "lucide-react";
import { motion } from "motion/react";
import {requestMicrophonePermission} from "../services/microphoneService";
import socket, { connectSocket } from "../services/socketService";
import {VOICE_CONFIG} from "../config/voiceConfig";
import voiceSessionService from "../services/voiceSessionService";

import VoiceRecorder from "../services/voiceRecorder";
import {uploadVoice} from "../services/voiceUploadService";
import ttsService from "../services/ttsService";
import {
    resumeSession,
    pauseSession,
    resumePausedSession
} from "../services/sessionService";

const VoiceStates = {
  IDLE: "idle",
  SPEAKING: "speaking",
  LISTENING: "listening",
  PROCESSING: "processing",
  CLOSING: "closing",
  COMPLETED: "completed",
  SNOOZED: "snoozed",
  RECOVERY: "recovery",
  ERROR: "error"
};

// This simulates the always-on-top frameless Electron window
export function Overlay() {
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft,setTimeLeft]=useState(0);

  const[
  voiceState,
  setVoiceState
  ]=useState(VoiceStates.IDLE);

  const[
  transcript,
  setTranscript
  ]=useState("");

  const [sessionId, setSessionId] =
    useState(null);

  const [plannedDuration, setPlannedDuration] =
    useState(0);

  const recorder=
  useRef(new VoiceRecorder());

  const startVoiceCheckIn=async(data)=>{

  try{

  const allowed=
  await requestMicrophonePermission();

  if(!allowed){

  setVoiceState(
  VoiceStates.ERROR
  );

  return;

  }

  setTranscript("");

  setVoiceState(
  VoiceStates.SPEAKING
  );

  await ttsService.speak(

  data?.message||
  VOICE_CONFIG.CHECK_IN_MESSAGE

  );

  setVoiceState(
  VoiceStates.LISTENING
  );

  await recorder.current.start();

  setTimeout(async()=>{

  const blob=
  await recorder.current.stop();

  setVoiceState(
  VoiceStates.PROCESSING
  );

  try{

  const result=
  await uploadVoice(blob);

  setTranscript(
  result.transcript
  );

  socket.emit(
    "voice-response",
    {
        sessionId:
            data?.sessionId,
        transcript:
            result.transcript
    }
  );

  setTimeout(()=>{

  setVoiceState(
  VoiceStates.CLOSING
  );

  },VOICE_CONFIG.CLOSING_DELAY_MS);

  }catch{

  setVoiceState(
  VoiceStates.ERROR
  );

  }

  },VOICE_CONFIG.RECORDING_DURATION_MS);

  }catch{

  setVoiceState(
  VoiceStates.ERROR
  );

  }

  };

  useEffect(() => {
    window.electronAPI?.notifyOverlayReady?.();
    connectSocket();

    const handleElectronCheckIn = (data) => {
        startVoiceCheckIn(data);
    };

    const removeElectronListener =
        window.electronAPI?.onCheckInRequired?.(
            handleElectronCheckIn
        );

    socket.on(
        "focus:continue",
        () => {
            setVoiceState(
                VoiceStates.CLOSING
            );
        }
    );

    socket.on(
        "focus:complete",
        () => {
            setVoiceState(
                VoiceStates.COMPLETED
            );

            window.electronAPI?.hideOverlay?.();
        }
    );
    socket.on(
        "focus:snoozed",
        () => {
            setVoiceState(
                VoiceStates.SNOOZED
            );

            window.electronAPI?.hideOverlay?.();
        }
    );

    socket.on(
        "focus:recovery",
        () => {
            setVoiceState(
                VoiceStates.RECOVERY
            );

            window.electronAPI?.hideOverlay?.();
        }
    );

    return () => {
        removeElectronListener?.();

        socket.off("focus:continue");
        socket.off("focus:complete");
        socket.off("focus:snoozed");
        socket.off("focus:recovery");
    };
  }, []);

  useEffect(() => {
    async function loadSession() {
        try {
            const response =
                await resumeSession();

            if (!response?.session) {
                return;
            }

            const session =
                response.session;

            setSessionId(session._id);
            voiceSessionService.setSession(session._id);

            socket.emit(
                "join_focus_session",
                session._id
            );

            setIsPaused(
                session.status === "paused"
            );

            setPlannedDuration(
                Number(session.plannedDuration || 0) * 60
            );

            setTimeLeft(
                Math.max(
                    0,
                    Math.round(
                        Number(
                            session.remainingDuration ??
                            session.plannedDuration ??
                            0
                        ) * 60
                    )
                )
            );
        } catch (error) {
            console.error(
                "Unable to load overlay session:",
                error
            );
        }
    }
    void loadSession();
  }, []);

  useEffect(() => {
    // Add a class to body to make it look like a transparent widget
    document.body.style.backgroundColor = "transparent";
    document.body.style.overflow = "hidden";
    
    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  const progress =
    plannedDuration > 0
        ? ((plannedDuration - timeLeft) / plannedDuration) * 100
        : 0;
  
  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 selection:bg-blue-500/30">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-white/80 dark:bg-[#121212]/80 backdrop-blur-2xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl shadow-2xl overflow-hidden flex items-center p-3 gap-4"
        style={{ WebkitAppRegion: "drag" }} // Electron drag region
      >
        {/* Mini Ring */}
        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-neutral-200 dark:text-neutral-800" />
            <circle 
              cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" 
              className="text-blue-500 transition-all duration-1000"
              style={{ strokeDasharray: 283, strokeDashoffset: 283 - (283 * progress) / 100 }}
            />
          </svg>
          <span className="text-xs font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{formatTime(timeLeft)}</span>
        </div>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-0.5">
        Deep Work
        </p>

        <p className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">
        Active Focus Session
        </p>

        <p className="text-xs text-blue-500 mt-1">
            {voiceState === VoiceStates.SPEAKING &&
                "FYNIX is speaking..."}

            {voiceState === VoiceStates.LISTENING &&
                "Listening..."}

            {voiceState === VoiceStates.PROCESSING &&
                "Transcribing your response..."}

            {voiceState === VoiceStates.CLOSING &&
                "Processing..."}

            {voiceState === VoiceStates.COMPLETED &&
                "Completed"}

            {voiceState === VoiceStates.SNOOZED &&
                "Snoozed"}

            {voiceState === VoiceStates.RECOVERY &&
                "Recovery required"}

            {voiceState === VoiceStates.ERROR &&
                "Voice check-in unavailable."}
        </p>

        {transcript&&(
        <p className="text-xs text-neutral-500 truncate">
        {transcript}
        </p>
        )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: "no-drag" }}>
          <button 
            onClick={async () => {
                if (!sessionId) {
                    return;
                }

                try {
                    if (isPaused) {
                        const response =
                            await resumePausedSession(
                                sessionId
                            );

                        setIsPaused(false);

                        setTimeLeft(
                            Math.max(
                                0,
                                Math.round(
                                    Number(
                                        response.session.remainingDuration ||
                                        0
                                    ) * 60
                                )
                            )
                        );
                    } else {
                        const response =
                            await pauseSession(
                                sessionId
                            );

                        setIsPaused(true);

                        setTimeLeft(
                            Math.max(
                                0,
                                Math.round(
                                    Number(
                                        response.session.remainingDuration ||
                                        0
                                    ) * 60
                                )
                            )
                        );
                    }
                } catch (error) {
                    console.error(
                        "Unable to update overlay session:",
                        error
                    );
                }
            }}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-600 dark:text-neutral-400"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button 
            aria-label="Hide overlay"
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded-lg transition-colors"
            onClick={async () => {
              try {
                await window.electronAPI?.hideOverlay?.();
              } catch (error) {
                console.error("Unable to hide overlay:", error);
              }
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
