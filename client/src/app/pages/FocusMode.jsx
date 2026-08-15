import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Square, Mic, Shield, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button.jsx";
import { toast } from "sonner";
import { getSettings } from "../services/settingsService";

import {
    failSession,
    resumeSession,
    pauseSession,
    resumePausedSession,
    completeSession
} from "../services/sessionService";

import socket, {connectSocket} from "../services/socketService";
import voiceSessionService from "../services/voiceSessionService";

import {
  requestMicrophonePermission
} from "../services/microphoneService";

import { loadActiveSchedule } from "../services/taskService";

import VoiceRecorder from "../services/voiceRecorder";

import {
  uploadVoice
} from "../services/voiceUploadService";

import ttsService from "../services/ttsService";

import {
  VOICE_CONFIG
} from "../config/voiceConfig";

const VOICE_FAILURE_MESSAGES = {
  MICROPHONE_DISABLED:
    "Microphone is disabled for this check-in.",
  MICROPHONE_PERMISSION_DENIED:
    "Microphone permission was denied.",
  MICROPHONE_UNAVAILABLE:
    "Microphone capture is unavailable.",
  MICROPHONE_CAPTURE_FAILED:
    "Microphone capture failed.",
  MEDIA_RECORDER_UNAVAILABLE:
    "Browser recording support is unavailable.",
  MEDIA_RECORDER_FAILED:
    "Audio recording failed.",
  VOICE_SERVICE_UNAVAILABLE:
    "Voice service is unavailable.",
  VOICE_UPLOAD_FAILED:
    "Voice upload failed.",
  VOICE_NETWORK_ERROR:
    "Voice network request failed."
};

function getVoiceFailureMessage(error) {
  return (
    VOICE_FAILURE_MESSAGES[error?.code] ||
    error?.message ||
    "Voice check-in failed."
  );
}

export function FocusMode() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("gentle");
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [plannedDuration, setPlannedDuration] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState("listening");
  const [voiceTimeout, setVoiceTimeout] = useState(null);
  const [currentTaskTitle, setCurrentTaskTitle] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);


  const [transcript, setTranscript] = useState("");
  const recorder = useRef(new VoiceRecorder());
  const manualEndInFlightRef = useRef(false);
  const finalNavigationRef = useRef(false);
  const appliedSessionIdRef = useRef(null);
  const modeRef = useRef("gentle");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const startVoiceCheckIn =
  async (
      data,
      attempt = 1
  ) => {

      try {

          setTranscript("");

          setCheckInStatus(
              "speaking"
          );

          const allowed =
              await requestMicrophonePermission();

          if (!allowed) {
              const error =
                  new Error(
                      "Microphone permission is required for voice check-in."
                  );
              error.code = "MICROPHONE_DISABLED";

              setCheckInStatus(
                  "error"
              );

              console.warn(
                  "Voice check-in failed:",
                  error.code,
                  error.message
              );

              toast.error(
                  getVoiceFailureMessage(error)
              );

              return;
          }

          const message =
              modeRef.current === "strict"
                  ? "Time's up. Tell me clearly. Did you finish the task or not?"
                  : "Your focus session is complete. Did you finish the task?";

          await ttsService.speak(
              message
          );

          setCheckInStatus(
              "listening"
          );

          await recorder.current.start();

          await new Promise(
              resolve =>
                  setTimeout(
                      resolve,
                      VOICE_CONFIG.RECORDING_DURATION_MS
                  )
          );

          const blob =
              await recorder.current.stop();

          if (
              !blob ||
              blob.size === 0
          ) {
              throw new Error(
                  "No voice recording was captured."
              );
          }

          setCheckInStatus(
              "processing"
          );

          const result =
              await uploadVoice(
                  blob
              );

          const spokenText =
              result?.transcript?.trim();

          if (!spokenText) {

              throw new Error(
                  "No speech was detected."
              );
          }

          setTranscript(
              spokenText
          );

          socket.emit(
              "voice-response",
              {
                  sessionId:
                      data?.sessionId ||
                      sessionId,

                  transcript:
                      spokenText
              }
          );

      } catch (error) {

          console.error(
              `Voice check-in attempt ${attempt} failed:`,
              error?.code || "VOICE_CHECK_IN_FAILED",
              error
          );

          if (
              attempt <
              VOICE_CONFIG.MAX_RETRY_COUNT
          ) {

              setCheckInStatus(
                  "listening"
              );

              toast.message(
                  "I couldn't capture that. Listening again..."
              );

              setTimeout(
                  () => {
                      startVoiceCheckIn(
                          data,
                          attempt + 1
                      );
                  },
                  1000
              );

              return;
          }

          setCheckInStatus(
              "error"
          );

          toast.error(
              `${getVoiceFailureMessage(error)} Manual completion and End Session are still available.`
          );
      }
  };

  // Formatting time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };


  const handlePause = async () => {

    if(!sessionId){

        return;

    }

    try{

        if(isPaused){

            const response = await resumePausedSession(

                sessionId

            );
            console.log(
    "Remaining Duration:",
    response.session.remainingDuration
);

console.log(
    "Started At:",
    response.session.startedAt
);

console.log(
    "Calculated:",
    getSessionTimeLeftSeconds(response.session)
);
            setTimeLeft(getSessionTimeLeftSeconds(response.session));

        }else{

            const response = await pauseSession(

                sessionId

            );
            setTimeLeft(getSessionTimeLeftSeconds(response.session));

        }

        setIsPaused(

            prev=>!prev

        );

    }

    catch(error){

        toast.error("Unable to update the focus session.");

    }

  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    setShowEndSessionConfirm(true);
  };

  const confirmEndSession = async () => {
    if (!sessionId) return;

    manualEndInFlightRef.current = true;
    setShowEndSessionConfirm(false);

    try {
      await failSession(sessionId);

      const schedule = await loadActiveSchedule();
      const hasRemainingTasks =
        Array.isArray(schedule?.schedule) &&
        schedule.schedule.some(task =>
          !task.completed &&
          ["pending", "in_progress"].includes(task.status)
        );

      setShowCheckIn(false);
      setSessionId(null);
      voiceSessionService.clearSession();
      toast.success("Focus session ended.");
      finalNavigationRef.current = true;
      navigate(hasRemainingTasks ? "/timetable" : "/dashboard", {
        state: { refreshSchedule: true },
        replace: true
      });
    } catch (error) {
      console.error("Manual end session failed:", error);
      toast.error("Unable to end the focus session.");
    } finally {
      manualEndInFlightRef.current = false;
    }
  };

  const cancelEndSession = () => {
    setShowEndSessionConfirm(false);
  };

  const handleManualComplete = async () => {

    if (!sessionId || isCompleting) {
        return;
    }

    try {
        setIsCompleting(true);

        setCheckInStatus(
            "processing"
        );

        const result =
            await completeSession(
                sessionId
            );

        if (
            result?.nextSession &&
            result?.nextTask
        ) {

            applyNextSession(
                result
            );

            return;
        }

        setShowCheckIn(false);

        voiceSessionService.clearSession();

        if (finalNavigationRef.current) {
            return;
        }

        toast.success(
            "Task completed. Today's timetable is complete."
        );

        finalNavigationRef.current = true;
        navigate(
            "/dashboard",
            {
                state: {
                    refreshSchedule: true
                }
            }
        );

    } catch (error) {

        console.error(
            "Manual completion failed:",
            error
        );

        setCheckInStatus(
            "error"
        );

        toast.error(
            error?.response?.data?.error?.message ||
            error?.response?.data?.message ||
            error.message ||
            "Unable to complete the task."
        );
    } finally {
        setIsCompleting(false);
    }
  };

  useEffect(() => {
    if (!sessionId || isPaused || timeLeft <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sessionId, isPaused]);

  const getSessionTimeLeftSeconds = (session) => {
    if (!session) {
        return 0;
    }

    if (
        session.status === "check_in_pending" ||
        session.status === "snoozed" ||
        session.status === "recovery" ||
        session.status === "skipped" ||
        session.status === "completed"
    ) {
        return 0;
    }

    const remainingMinutes =
        Number(
            session.remainingDuration ??
            session.plannedDuration ??
            0
        );

    if (!Number.isFinite(remainingMinutes) || remainingMinutes <= 0) {
        return 0;
    }

    if (
        session.status === "active" &&
        session.startedAt
    ) {
        const startedAt =
            new Date(session.startedAt).getTime();

        if (!Number.isNaN(startedAt)) {
            const elapsedSeconds =
                Math.max(
                    0,
                    Math.floor(
                        (Date.now() - startedAt) / 1000
                    )
                );

            return Math.max(
                0,
                Math.ceil(
                    remainingMinutes * 60 -
                    elapsedSeconds
                )
            );
        }
    }

    return Math.max(
        0,
        Math.round(
            remainingMinutes * 60
        )
    );
  };

  const applyNextSession = (data) => {
    const nextSession =
        data?.session ||
        data?.nextSession;

    const nextTask =
        data?.task ||
        data?.nextTask;

    if (!nextSession || !nextTask) {
        console.error(
            "Invalid next session payload:",
            data
        );

        return false;
    }

    if (
        appliedSessionIdRef.current &&
        appliedSessionIdRef.current === nextSession._id
    ) {
        return true;
    }

    appliedSessionIdRef.current =
        nextSession._id;
    finalNavigationRef.current = false;

    setShowCheckIn(false);
    setCheckInStatus("listening");
    setTranscript("");

    setSessionId(
        nextSession._id
    );

    voiceSessionService.setSession(
        nextSession._id
    );

    setCurrentTaskTitle(
        nextTask.title ||
        nextTask.name ||
        "No active task"
    );

    setMode(
        nextSession.mode ||
        "gentle"
    );

    setIsPaused(
        nextSession.status === "paused"
    );

    setVoiceTimeout(
        nextSession.voiceResponseTimeout
    );

    setPlannedDuration(
        Number(
            nextSession.plannedDuration ||
            0
        ) * 60
    );

    setTimeLeft(
        getSessionTimeLeftSeconds(
            nextSession
        )
    );

    socket.emit(
        "join_focus_session",
        nextSession._id
    );

    toast.success(
        `Next task: ${
            nextTask.title ||
            nextTask.name ||
            "Next task"
        }`
    );

    return true;
  };

  const beginSessionOnceRef = useRef(false);

  useEffect(() => {
    if (beginSessionOnceRef.current) {
      return;
    }

    beginSessionOnceRef.current = true;

    async function beginSession() {
      try {
        console.log("[FocusMode] beginSession() called on mount");
        const response = await resumeSession();

        console.log("[FocusMode] resumeSession response:", response);
        console.log("[FocusMode] session object:", response?.session);

        if (!response?.session) {
            console.warn("[FocusMode] No active session found - navigating to timetable");
            toast.error("Start focus from your timetable.");
            navigate("/timetable");
            return;
        }

        console.log("[FocusMode] Found active session:", {
          _id: response.session._id,
          status: response.session.status,
          plannedDuration: response.session.plannedDuration,
          remainingDuration: response.session.remainingDuration,
          startedAt: response.session.startedAt
        });

        if (response.session.status === "recovery") {
            console.log("[FocusMode] Session status is recovery - navigating to recovery page");
            navigate("/recovery");
            return;
        }

        const activeTask = response.session.task;

        const activeTaskTitle =
            activeTask?.title ||
            activeTask?.name ||
            "No active task";

        setCurrentTaskTitle(
            activeTaskTitle
        );

        setSessionId(
            response.session._id
        );

        setIsPaused(
            response.session.status === "paused"
        );

        setMode(
            response.session.mode ?? "gentle"
        );

        setVoiceTimeout(
            response.session.voiceResponseTimeout
        );

        setPlannedDuration(
            Number(
                response.session.plannedDuration || 0
            ) * 60
        );

        const timeLeftSeconds = getSessionTimeLeftSeconds(
            response.session
        );
        
        console.log("[FocusMode] Restored session with time left:", timeLeftSeconds, "seconds");
        setTimeLeft(timeLeftSeconds);

        // FIX 5: If session is already in check-in state, show check-in UI
        // but don't restart voice recording - wait for socket event
        if (response.session.status === "check_in_pending") {
            console.log("[FocusMode] Session already in check-in state - showing check-in UI");
            setShowCheckIn(true);
            setCheckInStatus("listening");
        }

      } catch (error) {
        console.error("[FocusMode] ERROR in beginSession:", error);
        console.error("[FocusMode] Error response:", error?.response?.data);
        toast.error(
          error?.response?.data?.error?.message || error.message || "Unable to load focus mode."
        );
        navigate("/timetable");
      }
    }

    beginSession();
  }, []);


  useEffect(() => {
    if (!sessionId) {
        return;
    }

    const joinSessionRoom = () => {
        socket.emit(
            "join_focus_session",
            sessionId
        );
    };

    connectSocket();

    if (socket.connected) {
        joinSessionRoom();
    }

    socket.on(
        "connect",
        joinSessionRoom
    );

    const interval =
        setInterval(() => {
            socket.emit(
                "heartbeat",

                {
                    sessionId
                }
            );
        },30000);
    return () => {

        socket.off(
            "connect",
            joinSessionRoom
        );

        clearInterval(interval);
    };
  },[sessionId]);

  useEffect(()=>{
    const handleShowCheckIn = async (data) => {
    const settings = await getSettings().catch(() => ({}));

    setShowCheckIn(true);
    setVoiceTimeout(data.timeout);

    if (
        settings?.notificationsEnabled !== false &&
        window.electronAPI?.notify
    ) {
        await window.electronAPI.notify({
            title: "FYNIX Check-in",
            body: "Your focus session is complete. Check in with FYNIX.",
            silent: false
        });
    }
    if (
        settings?.overlayEnabled !== false &&
        window.electronAPI?.showOverlay
    ) {
        const overlayResult = await window.electronAPI.showOverlay({
            ...data,
            voiceEnabled: settings?.voiceEnabled !== false
        });

        if (overlayResult?.inApp || overlayResult?.overlayShown === false) {
            return;
        }

        return;
    }

    if (settings?.voiceEnabled !== false) {
        await startVoiceCheckIn(data);
    }
  };

    const handleFocusNextTask = (data) => {
        applyNextSession(data);
    };

    const handleFocusComplete = () => {
        if (finalNavigationRef.current) {
            return;
        }

        finalNavigationRef.current = true;

        console.log(
            "FOCUS COMPLETE EVENT RECEIVED"
        );

        setShowCheckIn(false);

        voiceSessionService.clearSession();

        toast.success(
            "Today's timetable is complete."
        );

        navigate(
            "/dashboard",
            {
                state: {
                    refreshSchedule: true
                }
            }
        );
    };

    const handleFocusEnded = () => {
        if (
            manualEndInFlightRef.current ||
            finalNavigationRef.current
        ) {
            return;
        }

        finalNavigationRef.current = true;

        console.log(
            "FOCUS SESSION ENDED"
        );

        setShowCheckIn(false);

        voiceSessionService.clearSession();

        toast.success(
            "Session ended. The task was marked as ended."
        );

        navigate(
            "/dashboard",
            {
                state: {
                    refreshSchedule: true
                }
            }
        );
    };

    socket.on(
      "show-check-in",
      handleShowCheckIn
    );

    socket.on(
        "focus:next-task",
        handleFocusNextTask
    );

    socket.on(
        "focus:complete",
        handleFocusComplete
    );
    socket.on(
      "focus:ended",
      handleFocusEnded
    );

    socket.on(
        "focus:snoozed",
        ()=>{
            setShowCheckIn(false);
        }
    );

    socket.on(
        "focus:recovery",
        ()=>{
            setShowCheckIn(false);
            voiceSessionService.clearSession();
            navigate("/recovery");
        }
    );

    socket.on(
      "focus:clarify",
      async (data) => {

        setCheckInStatus("clarify");

        try {

          await ttsService.speak(
            data?.message ||
            "Please tell me whether you completed the task or need help."
          );

          setCheckInStatus("listening");

          await recorder.current.start();

          setTimeout(async () => {

            try {

              const blob =
                await recorder.current.stop();

              setCheckInStatus(
                "processing"
              );

              const result =
                await uploadVoice(blob);

              const spokenText =
                result?.transcript?.trim();

              if (!spokenText) {
                return;
              }

              setTranscript(spokenText);

              socket.emit(
                "voice-response",
                {
                  sessionId: data.sessionId,
                  transcript: spokenText
                }
              );

            } catch (error) {

              console.error(
                "Clarification recording failed:",
                error
              );

              setCheckInStatus("error");
            }

          }, VOICE_CONFIG.RECORDING_DURATION_MS);

        } catch (error) {

          console.error(
            "Clarification failed:",
            error
          );

          setCheckInStatus("error");
        }
      }
    );

    return () => {

        socket.off(
            "show-check-in",
            handleShowCheckIn
        );

        socket.off(
            "focus:next-task",
            handleFocusNextTask
        );

        socket.off(
            "focus:complete",
            handleFocusComplete
        );

        socket.off(
            "focus:ended",
            handleFocusEnded
        );

        socket.off(
            "focus:snoozed"
        );

        socket.off(
            "focus:recovery"
        );

        socket.off(
            "focus:clarify"
        );
    };
  },[]);

  // Show Electron overlay when check-in is ready
  const progress = plannedDuration > 0
    ? ((plannedDuration - timeLeft) / plannedDuration) * 100
    : 0;
  const strokeDashoffset = 283 - (283 * progress) / 100;
  const canShowCompletionCheckIn = showCheckIn && timeLeft <= 0;

  useEffect(() => {
    if (
        !canShowCompletionCheckIn &&
        window.electronAPI
    ) {
        window.electronAPI
            .hideOverlay()
            .catch((error) => {
                console.error(
                    "[FocusMode] Failed to hide overlay:",
                    error
                );
            });
    }
  }, [canShowCompletionCheckIn]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0a0a0a] relative overflow-hidden">
      
      {/* Background element for mode indication */}
      <div className={`absolute inset-0 z-0 transition-colors duration-700 ${
        mode === "gentle" 
          ? "bg-blue-500/5 dark:bg-blue-500/10" 
          : "bg-orange-500/5 dark:bg-orange-500/10"
      }`} />

      {/* Top Accountability Selector */}
      <header className="p-6 relative z-10 flex justify-center">
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-1 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center shadow-sm">
          <button
            disabled
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === "gentle" 
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm" 
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Gentle
            </div>
          </button>
          <button
            disabled
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === "strict" 
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 shadow-sm" 
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Strict
            </div>
          </button>
        </div>
      </header>

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        
        {/* Progress Ring and Timer */}
        <div className="relative w-80 h-80 flex items-center justify-center mb-8">
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-neutral-100 dark:text-neutral-800"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className={`transition-all duration-1000 ${
                mode === "gentle" ? "text-blue-500" : "text-orange-500"
              }`}
              style={{ strokeDasharray: 283, strokeDashoffset }}
            />
          </svg>
          
          <div className="text-center flex flex-col items-center">
            <span className="text-neutral-500 dark:text-neutral-400 font-medium text-sm tracking-widest uppercase mb-2">
              Deep Work
            </span>
            <div className={`text-7xl font-light tracking-tighter tabular-nums ${
              mode === "gentle" ? "text-blue-950 dark:text-blue-50" : "text-orange-950 dark:text-orange-50"
            }`}>
              {formatTime(timeLeft)}
            </div>
            <span className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {currentTaskTitle|| "No active task"}
            </span>
          </div>
        </div>

        {/* Current Task Details */}
        <div className="text-center max-w-md px-6">
          <h2 className="text-2xl font-medium mb-2">Current Task</h2>
          <p className={`text-sm ${mode === "gentle" ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>
            {mode === "gentle" 
              ? "You're doing great. Stay focused, you got this." 
              : "No distractions. Complete this block."}
          </p>
        </div>

      </div>

      {/* Bottom Controls */}
      <div className="p-8 relative z-10 flex justify-center gap-4">
        <Button 
          variant={isPaused ? "primary" : "outline"}
          onClick={handlePause}
          className="w-32"
        >
          {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button 
          variant="ghost"
          onClick={handleEndSession}
          className="w-32 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <Square className="w-4 h-4 mr-2" />
          End Session
        </Button>
      </div>

      {/* VOICE CHECK-IN OVERLAY (FRAME 8) */}
      <AnimatePresence>
        {canShowCompletionCheckIn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl shadow-blue-500/10"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                {checkInStatus === "listening" && (
                  <>
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1] }} 
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-blue-500/20 rounded-full"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ duration: 2, delay: 0.2, repeat: Infinity }}
                      className="absolute inset-0 bg-blue-500/30 rounded-full"
                    />
                  </>
                )}
                <Mic className="w-8 h-8 text-blue-500 relative z-10" />
              </div>

              <h2 className="text-2xl font-medium mb-2">Voice Check-In</h2>
              <p className="text-neutral-500 mb-2">
                {mode === "strict"
                  ? "Time's up. Tell me clearly. Did you finish the task or not?"
                  : "Your focus session is complete. Did you finish the task?"}
              </p>

              <p className="text-xs text-neutral-400">
                Respond within {voiceTimeout} seconds
              </p>

              {checkInStatus === "listening" && (
                <div className="mb-8 flex justify-center gap-1 h-8 items-center">
                  {[1,2,3,4,5].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: ["20%", "100%", "20%"] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1.5 bg-blue-500 rounded-full"
                    />
                  ))}
                </div>
              )}

              <p className="text-sm text-neutral-400 italic mb-8">

                {checkInStatus === "speaking" &&
                  "FYNIX is speaking..."}

                {checkInStatus === "listening" &&
                  "Listening..."}

                {checkInStatus === "processing" &&
                  "Understanding your response..."}

                {checkInStatus === "clarify" &&
                  "I didn't quite understand that..."}

                {checkInStatus === "error" &&
                  "Voice check-in unavailable."}

              </p>

              {transcript && (
                <p className="text-sm text-neutral-500 mb-6">
                  You said: "{transcript}"
                </p>
              )}

              <div className="flex gap-3">
                <Button
                    className="flex-1"
                    variant="primary"
                    disabled={isCompleting}
                    onClick={
                        handleManualComplete
                    }
                >
                    {isCompleting ? "Completing..." : "Completed"}
                </Button>
                <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                        console.log("[FocusMode] Need Help clicked - navigating to recovery");
                        navigate("/recovery");
                    }}
                >
                    Need Help
                </Button>
              
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* END SESSION CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showEndSessionConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="max-w-sm w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl text-center"
            >
              <h3 className="text-xl font-semibold mb-3">End Session?</h3>
              <p className="text-neutral-500 mb-8">
                Are you sure you want to end this focus session? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={cancelEndSession}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmEndSession}
                >
                  End Session
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
