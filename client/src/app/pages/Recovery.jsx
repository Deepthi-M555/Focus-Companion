import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { recoverSchedule } from "../services/recoveryService";

function calculateRemainingMinutes() {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 0, 0, 0);

  return Math.max(0, Math.floor((end - now) / (1000 * 60)));
}

export function Recovery() {
  const navigate = useNavigate();
  const [isRecovering, setIsRecovering] = useState(false);

  const handleResume = async () => {
    setIsRecovering(true);

    try {
      const result = await recoverSchedule({
        action: "resume"
      });

      if (result?.nextTask && Object.keys(result.nextTask).length) {
        navigate("/focus");
        return;
      }

      navigate("/dashboard");
      toast.success("Today's schedule completed.");
    } catch (error) {
      toast.error("Unable to resume your session.");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRecovering(true);

    try {
      await recoverSchedule({
        action: "regenerate",
        availableMinutes: calculateRemainingMinutes()
      });

      navigate("/dashboard", {
        state: {
          refreshSchedule: true
        }
      });
      toast.success("Schedule regenerated.");
    } catch (error) {
      toast.error("Unable to regenerate your schedule.");
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] p-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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
            onClick={handleRegenerate}
            disabled={isRecovering}
            className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-between group"
          >
            <div className="text-left">
              <div className="font-medium text-sm">{isRecovering ? "Regenerating..." : "Regenerate Schedule"}</div>
              <div className="text-xs text-neutral-500">Push tasks forward automatically</div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500" />
          </button>

          <button
            onClick={handleResume}
            disabled={isRecovering}
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
    </div>
  );
}
