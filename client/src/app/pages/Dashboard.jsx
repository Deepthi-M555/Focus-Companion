import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Send, Sparkles, StopCircle, Target } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { toast } from "sonner";

import VoiceRecorder from "../services/voiceRecorder";
import { uploadVoice } from "../services/voiceUploadService";

import { chat } from "../services/dashboardService";
import { loadActiveSchedule} from "../services/taskService";
import {resumeSession,failSession} from "../services/sessionService";
import { getScopedStorageKey, clearUserScopedClientState } from "../utils/token";

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return {
    heading: "Good morning.",
    body: "Ready to shape today's deep work?"
  };
  if (hour < 17) return {
    heading: "Good afternoon.",
    body: "Tell me what you'd like to accomplish today."
  };
  if (hour < 21) return {
    heading: "Good evening.",
    body: "Let's finish today's work with focused sessions."
  };
  return {
    heading: "Working late?",
    body: "Let's make this session count."
  };
};

const createInitialGreeting = () => {
  const greeting = getGreeting();

  return {
    role: "ai",
    text: `${greeting.heading} ${greeting.body}`
  };
};

const formatTaskMinutes = (tasks = []) => {
  const minutes = tasks.reduce(
    (sum, task) => sum + Number(task.estimatedDuration || 0),
    0
  );

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Number((minutes / 60).toFixed(1));
  return `${hours}h`;
};

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSending, setIsSending] = useState(false);const [showActiveSessionModal, setShowActiveSessionModal] = useState(false);
  const sendInFlightRef = useRef(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [messages, setMessages] = useState(() => {
  const storageKey = getScopedStorageKey("dashboardMessages");
  const storedMessages = localStorage.getItem(storageKey);

    if (storedMessages) {
      try {
        return JSON.parse(storedMessages);
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    return [createInitialGreeting()];
  });

  const bottomRef = useRef(null);
  const voiceRecorder = useRef(new VoiceRecorder());
  
  const fetchSchedule = async () => {
    try {
      const response = await loadActiveSchedule();
      setTodayTasks(response?.schedule || []);
    } catch {
      setTodayTasks([]);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(getScopedStorageKey("dashboardMessages"), JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    void fetchSchedule();
  }, []);

  useEffect(() => {
    if (location.state?.refreshSchedule) {
      void fetchSchedule();
    }
  }, [location]);

 const generateSchedule =
    async (
        userMessage,
        alreadyLocked = false
    ) => {

        const message =
            userMessage.trim();

        if (!message) {
            return;
        }


        /*
         * Prevent duplicate requests.
         *
         * This ref closes the small race
         * between clicking Send and the
         * first async operation completing.
         */

        if (
            !alreadyLocked &&
            sendInFlightRef.current
        ) {
            return;
        }


        const ownsLock =
            !alreadyLocked;

        if (ownsLock) {

            sendInFlightRef.current =
                true;

            setIsSending(
                true
            );

        }


        setMessages(
            prev => [
                ...prev,

                {
                    role:
                        "user",

                    text:
                        message
                }
            ]
        );


        setInputValue("");


        try {

            const response =
                await chat(
                    message
                );


            const generatedTasks =
                response.data?.tasks ||
                [];


            localStorage.removeItem(
                getScopedStorageKey(
                    "pendingSchedule"
                )
            );


            if (
                generatedTasks.length
            ) {

                localStorage.setItem(

                    getScopedStorageKey(
                        "pendingSchedule"
                    ),

                    JSON.stringify(
                        generatedTasks
                    )

                );

            }


            setMessages(
                prev => [
                    ...prev,

                    {
                        role:
                            "ai",

                        text:
                            generatedTasks.length
                                ? "I've created an optimized focus schedule based on your available time and priorities. Review it before beginning your focus session."
                                : response.message ||
                                  "Your schedule is ready.",

                        hasSchedule:
                            generatedTasks.length >
                            0,

                        scheduleTasks:
                            generatedTasks
                    }

                ]
            );


        } catch (
            error
        ) {

            const message =
                error.response?.data?.message ||
                "FYNIX couldn't respond. Please try again.";


            toast.error(
                message
            );


            setMessages(
                prev => [
                    ...prev,

                    {
                        role:
                            "ai",

                        text:
                            message,

                        isError:
                            true
                    }
                ]
            );


        } finally {

            if (ownsLock) {

                sendInFlightRef.current =
                    false;

                setIsSending(
                    false
                );

            }

        }

    };

  const handleSend =
    async () => {

        const message =
            inputValue.trim();


        if (
            !message ||
            isSending ||
            sendInFlightRef.current
        ) {

            return;

        }


        /*
         * LOCK IMMEDIATELY.
         *
         * This is the important fix.
         *
         * We lock BEFORE resumeSession()
         * because that call is asynchronous.
         */

        sendInFlightRef.current =
            true;

        setIsSending(
            true
        );


        try {

            const active =
                await resumeSession();


            console.log(
                "[Dashboard] Active session:",
                active
            );


            if (
                active?.session
            ) {

                if (
                    active.session.status ===
                    "recovery"
                ) {

                    navigate(
                        "/recovery"
                    );

                    return;

                }


                setActiveSession(
                    active.session
                );


                setPendingPrompt(
                    message
                );


                setShowActiveSessionModal(
                    true
                );


                return;

            }


            /*
             * generateSchedule already has
             * our lock, so tell it that the
             * lock already exists.
             */

            await generateSchedule(
                message,
                true
            );


        } catch {

            /*
             * No active session.
             *
             * Generate the schedule normally.
             */

            await generateSchedule(
                message,
                true
            );


        } finally {

            /*
             * If an active-session modal
             * was opened, this request is
             * no longer in flight.
             *
             * Release the lock here.
             */

            sendInFlightRef.current =
                false;

            setIsSending(
                false
            );

        }

    };
    
  const handleResumeSession = () => {
    setShowActiveSessionModal(false);
    navigate("/focus");
  };
  const handleCancelSession = () => {
    setShowActiveSessionModal(false);
    setPendingPrompt("");
    setActiveSession(null);
  }
  const handleEndAndGenerate = async () => {
    try {
        await failSession(activeSession._id);
        setActiveSession(null);
        setPendingPrompt("");
        setShowActiveSessionModal(false);
        await generateSchedule(pendingPrompt);
    }
    catch (error) {
        toast.error(
            "Unable to end current session."
        );
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
        let blob = null;

        try {
            setIsRecording(false);
            setIsTranscribing(true);

            blob = await voiceRecorder.current.stop();

            if (!blob || blob.size === 0) {
                toast.error("No voice was captured.");
                return;
            }

            const result = await uploadVoice(blob);
            const transcript = result?.transcript?.trim();

            if (!transcript) {
                toast.error("No speech was detected.");
                return;
            }

            setInputValue(prev =>
                prev
                    ? `${prev} ${transcript}`
                    : transcript
            );
        } catch (error) {
            console.error(
                "Dashboard voice input failed:",
                error
            );

            toast.error(
                error?.message ||
                "Unable to process voice input."
            );
        } finally {
            setIsTranscribing(false);
            setIsRecording(false);
        }

        return;
    }

    try {
        await voiceRecorder.current.start();
        setIsRecording(true);
    } catch (error) {
        console.error(
            "Dashboard microphone failed:",
            error
        );

        setIsRecording(false);

        toast.error(
            error?.message ||
            "Unable to access the microphone."
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="p-6 relative z-10 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Focus Dashboard</h2>
          <p className="text-neutral-500 text-sm">Tell FYNIX what you need to accomplish</p>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 relative z-10 scrollbar-hide">
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col max-w-2xl ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
          >
            {msg.role === "ai" && (
              <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Fynix</span>
              </div>
            )}
            
            <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
              msg.role === "user" 
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-tr-sm" 
                : "bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-tl-sm text-neutral-800 dark:text-neutral-200 backdrop-blur-md"
            }`}>
              {msg.text}
            </div>

            {msg.role === "ai" && msg.hasSchedule && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 w-full"
              >
                <div className="p-5 border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      Generated Schedule Available
                    </h4>
                    <span className="text-xs text-neutral-500">
                      {formatTaskMinutes(msg.scheduleTasks)} total
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {(msg.scheduleTasks || []).map(task => (
                      <div key={task._id || task.title} className="flex justify-between gap-3 text-xs text-neutral-500 px-1">
                        <span className="truncate">{task.title}</span>
                        <span className="flex-shrink-0">{task.estimatedDuration}m</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => navigate("/timetable")}>
                      View Timetable
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-6 relative z-10">
        <div className="max-w-3xl mx-auto relative group">
          
          <AnimatePresence>
             {(isRecording || isTranscribing) && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute -top-16 left-0 right-0 flex justify-center"
              >
                <div className="bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200 dark:border-neutral-700 rounded-full px-6 py-2.5 flex items-center gap-4">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: ["8px", "20px", "8px"] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1 bg-red-500 rounded-full"
                      />
                    ))}
                  </div>
                  <span
                      className={`text-sm font-medium ${
                          isTranscribing
                              ? "text-blue-500"
                              : "animate-pulse text-red-500"
                      }`}
                  >
                      {isTranscribing
                          ? "Transcribing..."
                          : "Listening..."}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex items-end gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all">
            
            <textarea
              value={inputValue}
              disabled={
                  isRecording ||
                  isTranscribing ||
                  isSending
              }
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="e.g., I have 3 hours and need to study DSA and OS..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none py-3 px-4 text-[15px] focus:outline-none dark:text-neutral-100 placeholder:text-neutral-400"
              rows={1}
            />

            <div className="flex items-center gap-1 mb-1 mr-1">
              <button
                onClick={toggleRecording}
                disabled={isTranscribing || isSending}
                className={`p-3 rounded-full transition-colors flex-shrink-0 ${
                  isRecording 
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                    : "hover:bg-neutral-100 text-neutral-500 dark:hover:bg-neutral-800 dark:text-neutral-400"
                }`}
              >
                {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button
                onClick={handleSend}
                disabled={
                    !inputValue.trim() ||
                    isSending ||
                    isRecording ||
                    isTranscribing
                }
                className="p-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex-shrink-0"
              >
                <Send className={`w-5 h-5 ${isSending ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>
          <div className="flex justify-center mt-3 gap-3">
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Try asking:</span>
            <button 
              onClick={() => setInputValue("I have 12 hours and 5 modules.")}
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              "I have 12 hours and 5 modules."
            </button>
          </div>
        </div>
      </div>
      {showActiveSessionModal && (
      <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-2xl">
              <h3 className="text-xl font-medium mb-2">
                  Active Focus Session
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                  You already have an active focus session.
                  Finish it or resume it before creating another timetable.
              </p>
              <div className="space-y-3">

                  <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleResumeSession}
                  >
                      Resume Session
                  </Button>

                  <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleEndAndGenerate}
                  >
                      End Session & Generate New Plan
                  </Button>

                  <Button
                      variant="ghost"
                      className="w-full"
                      onClick={handleCancelSession}
                  >
                      Cancel
                  </Button>
              </div>
          </div>
      </div>
    )}
    </div>
  );
}
