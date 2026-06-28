import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Play, ArrowRight, RotateCcw, Clock, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";

export function Recovery() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] p-8 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl z-10 text-center"
          >
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-medium mb-2">Session Missed</h2>
            <p className="text-neutral-500 mb-8 leading-relaxed">
              It looks like you didn't check in. Life happens. How would you like to handle the rest of your schedule?
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => setStep(2)}
                className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-between group"
              >
                <div className="text-left">
                  <div className="font-medium text-sm">Regenerate Schedule</div>
                  <div className="text-xs text-neutral-500">Push tasks forward automatically</div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500" />
              </button>
              
              <button 
                onClick={() => navigate("/dashboard")}
                className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all flex items-center justify-between group"
              >
                <div className="text-left">
                  <div className="font-medium text-sm">Skip & Resume</div>
                  <div className="text-xs text-neutral-500">Mark missed time as free and continue</div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full z-10"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-3xl font-light tracking-tight mb-2">Schedule Updated</h2>
              <p className="text-neutral-500">I've shifted your tasks to accommodate the missed time. Completed work is preserved.</p>
            </div>

            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl mb-8 flex gap-6">
              <div className="flex-1 opacity-50 border-r border-neutral-200 dark:border-neutral-800 pr-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Previous
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm line-through">1:00 PM - Deep Work (Missed)</div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-sm">2:30 PM - Arrays</div>
                </div>
              </div>
              
              <div className="flex-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  New Plan
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300">
                    2:00 PM - Deep Work
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-lg text-sm">
                    3:30 PM - Arrays
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button size="lg" className="w-64 shadow-lg shadow-blue-500/20" onClick={() => navigate("/focus")}>
                <Play className="w-4 h-4 mr-2" />
                RESUME WORK
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
