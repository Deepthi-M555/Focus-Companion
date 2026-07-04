import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Square, Mic, Shield, ShieldAlert, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button.jsx";
import {
    getSchedule
} from "../services/scheduleService";

import {
    startSession,
    completeSession,
    snoozeSession,
    failSession,
    resumeSession,
    pauseSession,
    resumePausedSession
} from "../services/sessionService";

import socket, {
    connectSocket,
    disconnectSocket
} from "../services/socketService";

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
  const [personality, setPersonality] = useState("GENTLE");

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

            await resumePausedSession(

                sessionId

            );

        }else{

            await pauseSession(

                sessionId

            );

        }

        setIsPaused(

            prev=>!prev

        );

    }

    catch(error){

        console.error(error);

    }

  };

  const handleComplete = async () => {
    if (!sessionId) return;
    await completeSession(
        sessionId
    );
    navigate("/dashboard");
  };

  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, timeLeft]);

  useEffect(() => {
    async function beginSession() {

        try {

            const response =
                await resumeSession();

            if (response.session) {

                setSessionId(
                    response.session._id
                );

                setTimeLeft(
                    response.session.plannedDuration * 60
                );

                setPlannedDuration(
                    response.session.plannedDuration * 60
                );

                connectSocket();

                socket.emit(
                    "join_focus_session",
                    response.session._id
                );

                return;
            }

            const schedule =
                await getSchedule();

            const firstTask =
                schedule.schedule.find(
                    task =>
                        task.status === "pending"
                );

            if (!firstTask) {

                navigate("/dashboard");

                return;
            }

            const session =
                await startSession({

                    taskId:
                        firstTask._id,

                    duration:
                        firstTask.estimatedDuration,

                    mode

                });

            setSessionId(
                session.session._id
            );

            setTimeLeft(
                firstTask.estimatedDuration * 60
            );

            setPlannedDuration(
                firstTask.estimatedDuration * 60
            );

            connectSocket();

            socket.emit(

                "join_focus_session",

                session.session._id

            );

        }

        catch (error) {

            console.error(error);

        }

    }

    beginSession();
  }, []);

  useEffect(() => {
    return () => {
        disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
        return;
    }
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

        clearInterval(interval);
    };
  },[sessionId]);

  useEffect(()=>{

    socket.on(

        "show-check-in",

        data=>{

            setShowCheckIn(true);

            setCheckInStatus("listening");

            setVoiceTimeout(

                data.timeout

            );

            setPersonality(

                data.personality

            );

        }

    );

    socket.on(

        "session-completed",

        ()=>{

            setShowCheckIn(false);

            navigate("/dashboard");

        }

    );

    socket.on(

        "session-snoozed",

        ()=>{

            setShowCheckIn(false);

        }

    );

    socket.on(

        "go-recovery",

        ()=>{

            setShowCheckIn(false);

            navigate("/recovery");

        }

    );

    socket.on(

        "listen-again",

        ()=>{

            setCheckInStatus(

                "listening"

            );

        }

    );

    return()=>{

        socket.off("show-check-in");

        socket.off("session-completed");

        socket.off("session-snoozed");

        socket.off("go-recovery");

        socket.off("listen-again");

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
            onClick={() => setMode("gentle")}
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
            onClick={() => setMode("strict")}
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
              Focus Block 1 / 4
            </span>
          </div>
        </div>

        {/* Current Task Details */}
        <div className="text-center max-w-md px-6">
          <h2 className="text-2xl font-medium mb-2">Current Focus Task</h2>
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
          variant="outline"
          onClick={handleComplete}
          className="w-32"
        >
          <Check className="w-4 h-4 mr-2" />
          Complete Session
        </Button>
        <Button 
          variant="ghost"
          onClick={handleComplete}
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
                {personality === "STRICT"
                  ? "Focus check. Respond now."
                  : "Hey! Are you still studying?"}
              </p>

              <p className="text-xs text-neutral-400">
                Listening for {voiceTimeout} seconds...
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

              {checkInStatus === "listening" && (
                <p className="text-sm text-neutral-400 italic mb-8">"Listening..."</p>
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

                        transcript:"yes"

                      }

                    );

                  }}

                >
                  Yes
                </Button>
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={async()=>{

                    socket.emit(

                      "voice-response",

                      {

                        sessionId,

                        transcript:"snooze"

                      }

                    );

                  }}
                >
                  Snooze
                </Button>
              </div>

              <button 
                onClick={()=>{

                    socket.emit(

                      "voice-response",

                      {

                        sessionId,

                        transcript:"help"

                      }

                    );

                  }}
                className="mt-6 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                No, I missed it...
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
