import { useState, useEffect, useRef } from "react";
import { Mic, X } from "lucide-react";
import { motion } from "motion/react";
import { requestMicrophonePermission } from "../services/microphoneService";
import socket, { connectSocket } from "../services/socketService";
import { VOICE_CONFIG } from "../config/voiceConfig";

import VoiceRecorder from "../services/voiceRecorder";
import { uploadVoice } from "../services/voiceUploadService";
import ttsService from "../services/ttsService";

const VoiceStates = {
  IDLE: "idle",
  SPEAKING: "speaking",
  LISTENING: "listening",
  PROCESSING: "processing",
  COMPLETED: "completed",
  SNOOZED: "snoozed",
  RECOVERY: "recovery",
  ERROR: "error"
};

export function Overlay() {
  const [voiceState, setVoiceState] = useState(VoiceStates.IDLE);
  const [transcript, setTranscript] = useState("");
  const [sessionId, setSessionId] = useState(null);

  const recorder = useRef(new VoiceRecorder());

  const startVoiceCheckIn = async (data) => {
    try {
      const question = data?.message || VOICE_CONFIG.CHECK_IN_MESSAGE;
      const voiceEnabled = data?.voiceEnabled !== false;

      console.log("[CHECKIN-TTS] CHECK-IN UI ACTIVE");
      console.log("[CHECKIN-TTS] electronAPI:", !!window.electronAPI);
      console.log("[CHECKIN-TTS] speak:", typeof window.electronAPI?.speak);
      console.log("[CHECKIN-TTS] question:", question);
      console.log("[CHECKIN-TTS] voiceEnabled:", voiceEnabled);
      console.log("[CHECKIN-TTS] ABOUT TO CALL NATIVE TTS");

      setTranscript("");
      setVoiceState(VoiceStates.SPEAKING);

      try {
        const result = await window.electronAPI.speak(question);
        console.log("[CHECKIN-TTS] NATIVE TTS COMPLETED", result);
      } catch (error) {
        console.error("[CHECKIN-TTS] NATIVE TTS FAILED", error);
        throw error;
      }

      const allowed = await requestMicrophonePermission();

      if (!allowed) {
        setVoiceState(VoiceStates.ERROR);
        console.error("[Overlay] Microphone permission denied");
        return;
      }

      setVoiceState(VoiceStates.LISTENING);

      console.log("[Overlay:MIC] getUserMedia called");

      await recorder.current.start();

      console.log("[Overlay:MIC] MediaRecorder started");

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            VOICE_CONFIG.RECORDING_DURATION_MS
          )
      );

      console.log("[Overlay:MIC] recording duration complete, stopping recorder");

      const blob = await recorder.current.stop();

      console.log("[Overlay:MIC] recorder stopped, blob size:", blob?.size);

      if (!blob || blob.size === 0) {
        setVoiceState(VoiceStates.ERROR);
        console.error("[Overlay] Empty blob recorded");
        return;
      }

      setVoiceState(VoiceStates.PROCESSING);

      console.log("[Overlay:MIC] uploading voice blob");

      try {
        const result = await uploadVoice(blob);

        console.log("[Overlay:MIC] upload response:", result);

        setTranscript(result.transcript);

        socket.emit("voice-response", {
          sessionId: data?.sessionId,
          transcript: result.transcript
        });

        console.log(
            "[Overlay:VOICE] Response sent; waiting for server result"
        );
      } catch (error) {
        setVoiceState(VoiceStates.ERROR);
        console.error("[Overlay] Upload voice failed:", error);
      }
    } catch {
      setVoiceState(VoiceStates.ERROR);
      console.error("[Overlay] Voice check-in failed");
    }
  };

  useEffect(() => {
    connectSocket();

    socket.on(
        "connect",
        () => {

            console.log(
                "[Overlay:SOCKET] Connected:",
                socket.id
            );

        }
    );

    socket.on(
        "connect_error",
        (error) => {

            console.error(
                "[Overlay:SOCKET] Connection error:",
                error
            );

        }
    );

    const handleElectronCheckIn = (data) => {

        const currentSessionId =
            data?.sessionId;

        setSessionId(
            currentSessionId
        );

        if (currentSessionId) {

            socket.emit(
                "join_focus_session",
                currentSessionId
            );

            console.log(
                "[Overlay:SOCKET] Joined focus session:",
                currentSessionId
            );
        }

        startVoiceCheckIn(data);
    };

    const removeElectronListener = window.electronAPI?.onCheckInRequired?.(
      handleElectronCheckIn
    );

    window.electronAPI?.notifyOverlayReady?.();

    socket.on("focus:complete", () => {
      setVoiceState(VoiceStates.COMPLETED);
      window.electronAPI?.hideOverlay?.();
    });

    socket.on(
        "focus:next-task",
        (data) => {

            console.log(
                "[Overlay:SOCKET] Current task completed; next task:",
                data?.task?.title ||
                data?.task?.name
            );

            setVoiceState(
                VoiceStates.COMPLETED
            );

            window.electronAPI?.hideOverlay?.();
        }
    );

    socket.on(
        "focus:clarify",
        async (data) => {

            console.log(
                "[Overlay:SOCKET] Clarification requested:",
                data
            );

            setVoiceState(
                VoiceStates.SPEAKING
            );

            try {

                await startVoiceCheckIn({
                    sessionId:
                        data?.sessionId ||
                        sessionId,

                    message:
                        data?.message ||
                        VOICE_CONFIG.CHECK_IN_MESSAGE
                });

            } catch (error) {

                console.error(
                    "[Overlay] Clarification failed:",
                    error
                );

                setVoiceState(
                    VoiceStates.ERROR
                );
            }
        }
    );

    socket.on("focus:snoozed", () => {
      setVoiceState(VoiceStates.SNOOZED);
      window.electronAPI?.hideOverlay?.();
    });

    socket.on("focus:recovery", () => {
      setVoiceState(VoiceStates.RECOVERY);
      window.electronAPI?.hideOverlay?.();
    });

    return () => {

        removeElectronListener?.();
        socket.off("connect");

        socket.off("connect_error");

        socket.off("focus:complete");

        socket.off("focus:next-task");

        socket.off("focus:snoozed");

        socket.off("focus:recovery");

        socket.off("focus:clarify");
    };
  }, []);

  useEffect(() => {
    document.body.style.backgroundColor = "transparent";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 selection:bg-blue-500/30">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-white/90 dark:bg-[#121212]/90 backdrop-blur-2xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl shadow-2xl overflow-hidden p-6"
        style={{ WebkitAppRegion: "drag" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            FYNIX Check-in
          </h2>
          <button
            onClick={() => window.electronAPI?.hideOverlay?.()}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-600 dark:text-neutral-400"
            style={{ WebkitAppRegion: "no-drag" }}
            aria-label="Close overlay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Microphone Status */}
        <div className="flex justify-center mb-4">
          <div
            className={`p-4 rounded-full ${
              voiceState === VoiceStates.LISTENING
                ? "bg-blue-100 dark:bg-blue-900/30 animate-pulse"
                : voiceState === VoiceStates.SPEAKING
                ? "bg-green-100 dark:bg-green-900/30 animate-pulse"
                : voiceState === VoiceStates.PROCESSING
                ? "bg-yellow-100 dark:bg-yellow-900/30 animate-pulse"
                : voiceState === VoiceStates.ERROR
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-neutral-100 dark:bg-neutral-800"
            }`}
          >
            <Mic
              className={`w-8 h-8 ${
                voiceState === VoiceStates.LISTENING
                  ? "text-blue-600 dark:text-blue-400"
                  : voiceState === VoiceStates.SPEAKING
                  ? "text-green-600 dark:text-green-400"
                  : voiceState === VoiceStates.PROCESSING
                  ? "text-yellow-600 dark:text-yellow-400"
                  : voiceState === VoiceStates.ERROR
                  ? "text-red-600 dark:text-red-400"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            />
          </div>
        </div>

        {/* Status Text */}
        <p className="text-center text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
          {voiceState === VoiceStates.SPEAKING && "FYNIX is speaking..."}
          {voiceState === VoiceStates.LISTENING && "Listening to your response..."}
          {voiceState === VoiceStates.PROCESSING && "Processing your voice..."}
          {voiceState === VoiceStates.COMPLETED && "Check-in complete"}
          {voiceState === VoiceStates.SNOOZED && "Session snoozed"}
          {voiceState === VoiceStates.RECOVERY && "Recovery initiated"}
          {voiceState === VoiceStates.ERROR && "Something went wrong"}
          {voiceState === VoiceStates.IDLE && "Ready"}
        </p>

        {/* Transcript */}
        {transcript && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center mb-4 italic">
            "{transcript}"
          </p>
        )}

        {/* Info */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
          Speak your response when ready
        </p>
      </motion.div>
    </div>
  );
}