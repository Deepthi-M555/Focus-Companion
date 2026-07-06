import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Send, Sparkles, StopCircle, Play, Target } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { toast } from "sonner";

import { chat } from "../services/dashboardService";

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return {
    heading: "Good morning.",
    body: "Ready to plan today's deep work?"
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

export function Dashboard() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(() => {
    const storedMessages = sessionStorage.getItem("dashboardMessages");

    if (storedMessages) {
      try {
        return JSON.parse(storedMessages);
      } catch {
        sessionStorage.removeItem("dashboardMessages");
      }
    }

    return [createInitialGreeting()];
  });

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem("dashboardMessages", JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    const userMessage = inputValue;
    setMessages(prev => [
        ...prev,
        {
            role: "user",
            text: userMessage
        }
    ]);
    setInputValue("");
    setIsSending(true);
    try {
        const response = await chat(userMessage);
        const generatedTasks = response.data?.tasks || [];

        if (generatedTasks.length) {
          sessionStorage.setItem("pendingSchedule", JSON.stringify(generatedTasks));
        }

        setMessages(prev => [
            ...prev,
            {
                role: "ai",
                text: generatedTasks.length
                  ? "I've created an optimized focus schedule based on your available time and priorities. Review it before beginning your focus session."
                  : response.message || "Your plan is ready.",
                hasSchedule: generatedTasks.length > 0
            }
        ]);
    }
    catch (error) {
        const message = error.response?.data?.message ||
          "FYNIX couldn't respond. Please try again.";
        toast.error(message);
        setMessages(prev => [
          ...prev,
          { role: "ai", text: message, isError: true }
        ]);
    } finally {
        setIsSending(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setInputValue(prev => prev + (prev ? " " : "") + "I have 3 hours and need to study DSA and OS.");
    } else {
      setIsRecording(true);
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
          <h2 className="text-2xl font-light tracking-tight">Focus Planning</h2>
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
                      Generated Plan Available
                    </h4>
                    <span className="text-xs text-neutral-500">3 hrs total</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500 w-[45%]" title="DSA"></div>
                      <div className="h-full bg-purple-500 w-[15%]" title="Break"></div>
                      <div className="h-full bg-emerald-500 w-[40%]" title="OS"></div>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 px-1">
                      <span>DSA (90m)</span>
                      <span>Break (15m)</span>
                      <span>OS (75m)</span>
                    </div>
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
            {isRecording && (
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
                  <span className="text-sm font-medium animate-pulse text-red-500">Listening...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex items-end gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all">
            
            <textarea
              value={inputValue}
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
                disabled={!inputValue.trim() || isSending}
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
    </div>
  );
}
