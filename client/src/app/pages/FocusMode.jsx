import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Square, Mic, Shield, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button.jsx";
import { toast } from "sonner";
import {getSchedule} from "../services/scheduleService";

import {
    failSession,
    resumeSession,
    pauseSession,
    resumePausedSession
} from "../services/sessionService";

import socket, {connectSocket} from "../services/socketService";
import voiceSessionService from "../services/voiceSessionService";

import {
  requestMicrophonePermission
} from "../services/microphoneService";

import VoiceRecorder from "../services/voiceRecorder";

import {
  uploadVoice
} from "../services/voiceUploadService";

import ttsService from "../services/ttsService";

import {
  VOICE_CONFIG
} from "../config/voiceConfig";

export function FocusMode() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("gentle");
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [plannedDuration, setPlannedDuration] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState("listening");
  const [voiceTimeout, setVoiceTimeout] = useState(60);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(1);
  const [totalTasks, setTotalTasks] = useState(1);
  const [currentTaskTitle, setCurrentTaskTitle] = useState("No active task");

  const [transcript, setTranscript] = useState("");
  const recorder = useRef(new VoiceRecorder());
  const modeRef = useRef("gentle");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const startVoiceCheckIn =
  async (data) => {
    try {
      setTranscript("")
      setCheckInStatus(
        "speaking"
      );
      const allowed =
        await requestMicrophonePermission();
      if (!allowed) {
        setCheckInStatus(
          "error"
        );
        toast.error(
          "Microphone permission is required for voice check-in."
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
      setTimeout(
        async () => {
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
              setCheckInStatus(
                "listening"
              );
              return;
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
              "Voice processing failed:",
              error
            );
            setCheckInStatus(
              "error"
            );
          }
        },
        VOICE_CONFIG.RECORDING_DURATION_MS
      );
    } catch (error) {
      console.error(
        "Voice check-in failed:",
        error
      );
      setCheckInStatus(
        "error"
      );
    }
  };

  // Formatting time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const syncTaskProgressFromSchedule = (scheduleItems = []) => {
    const todaysTasks = Array.isArray(scheduleItems)
      ? scheduleItems.filter(task => task.status !== "completed")
      : [];

    const firstTask = todaysTasks.find(task => task.status === "pending") || todaysTasks[0] || null;
    const taskIndex = firstTask
      ? todaysTasks.findIndex(task => (task._id || task.id || task.taskId) === (firstTask._id || firstTask.id || firstTask.taskId)) + 1
      : 1;
    const taskTotal = todaysTasks.length || 1;
    setCurrentTaskIndex(taskIndex);
    setTotalTasks(taskTotal);

    return { firstTask, taskIndex, taskTotal };
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
    try {
      await failSession(sessionId);
      toast.success("Focus session ended.");
// Wait for socket.
// Don't navigate here.

    } catch (error) {
      toast.error("Unable to end the focus session.");
    }
  };

  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, timeLeft]);

  const getScheduleItems = async () => {
    try {
      const savedSchedule = await getSchedule();
      return Array.isArray(savedSchedule.schedule) ? savedSchedule.schedule : [];
    } catch (error) {
      console.error("Schedule load failed", error);
      return [];
    }
  };

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

    return Math.max(
      0,
      Math.round(
        remainingMinutes * 60
      )
    );
  };

  useEffect(() => {
    async function beginSession() {
      try {
        const response = await resumeSession();

        console.log("===== RESUME SESSION =====");
        console.log(response.session);

        const scheduleItems = await getScheduleItems();
        const taskProgress = syncTaskProgressFromSchedule(scheduleItems);

        if (response.session) {
          const activeTask = response.session.task;
          const activeTaskTitle = activeTask?.title || activeTask?.name || "No active task";

          const activeTaskId = activeTask?._id || activeTask?.id || activeTask?.taskId;
          const indexFromSchedule = scheduleItems.findIndex(
            (task) => (task._id || task.id || task.taskId) === activeTaskId
          );
          const activeIndex = indexFromSchedule >= 0 ? indexFromSchedule + 1 : 1;

          setCurrentTaskIndex(activeIndex);
          setTotalTasks(Math.max(scheduleItems.length || taskProgress.taskTotal, 1));
          setCurrentTaskTitle(activeTaskTitle);
          setSessionId(response.session._id);
          setIsPaused(response.session.status === "paused");
          setMode(response.session.mode ?? "gentle");

          setPlannedDuration((response.session.plannedDuration ?? activeTask?.estimatedDuration ?? 0) * 60);
          setTimeLeft(getSessionTimeLeftSeconds(response.session));
          return;
        }

        toast.error("Start focus from your timetable.");
        navigate("/timetable");
      } catch (error) {
        console.error("FocusMode error", error);
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
    const handleShowCheckIn =
      async (data) => {

        setShowCheckIn(true);

        setVoiceTimeout(
          data.timeout ?? 60
        );

        await startVoiceCheckIn(data);
      };

    socket.on(
      "show-check-in",
      handleShowCheckIn
    );

    socket.on("focus:complete", () => {

        console.log("FOCUS COMPLETE EVENT RECEIVED");

        setShowCheckIn(false);

        voiceSessionService.clearSession();

        navigate("/dashboard");

    });
    socket.on(
      "focus:ended",
      () => {

        console.log(
          "FOCUS SESSION ENDED"
        );

        setShowCheckIn(false);

        voiceSessionService.clearSession();

        navigate("/dashboard");
      }
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

    return()=>{
        socket.off("show-check-in", handleShowCheckIn);
        socket.off("focus:complete");
        socket.off("focus:ended");
        socket.off("focus:snoozed");
        socket.off("focus:recovery");
        socket.off("focus:clarify");
    };
  },[]);

  const progress = plannedDuration > 0
    ? ((plannedDuration - timeLeft) / plannedDuration) * 100
    : 0;
  const strokeDashoffset = 283 - (283 * progress) / 100;

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
            <span className="mt-3 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs rounded-full font-medium">
              Focus Block {currentTaskIndex} / {totalTasks}
            </span>
            <span className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {currentTaskTitle}
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
        {showCheckIn && (
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
                  onClick={async()=>{

                    socket.emit(

                      "voice-response",

                      {

                        sessionId,

                        transcript: "I completed the task"

                      }

                    );

                  }}

                >
                  Completed
                </Button>
              
              </div>

              <button 
                onClick={()=>{
                    socket.emit(
                      "voice-response",
                      {
                        sessionId,
                        transcript:"I need help"
                      }
                    );
                  }}
                className="mt-6 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
              I need help
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
