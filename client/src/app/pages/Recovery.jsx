import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { getRecoverySummary, recoverSchedule, skipAndResume } from "../services/recoveryService";

function formatMinutes(minutes) {
  const safeMinutes = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  if (hours && mins) {
    return `${hours}h ${mins}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${mins}m`;
}

export function Recovery() {
  const navigate = useNavigate();
  const [isRecovering, setIsRecovering] = useState(false);
  const [step, setStep] = useState(2);
  const [extraMinutes, setExtraMinutes] = useState(0);
  const [recovery, setRecovery] = useState({
    originalPlannedMinutes: 0,
    remainingPlannedMinutes: 0
  });

  useEffect(() => {
    const loadRecoverySummary = async () => {
      try {
        const summary = await getRecoverySummary();
        setRecovery(summary);
      } catch (error) {
        setRecovery({
          originalPlannedMinutes: 0,
          remainingPlannedMinutes: 0
        });
      }
    };

    loadRecoverySummary();
  }, []);

  const handleSkipResume = async () => {
    setIsRecovering(true);

    try {
      const result = await skipAndResume();

      if (result?.nextTask && Object.keys(result.nextTask).length) {
        navigate("/focus");
        return;
      }

      toast.success("Today's schedule completed.");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Unable to skip and resume your session.");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleOpenRegenerateView = () => {
    setStep(2);
  };

  const handleRegenerate = async () => {
    setIsRecovering(true);

    try {
      const result = await recoverSchedule({
        action: "regenerate",
        extraMinutes
      });

      setRecovery(result);
      toast.success("Schedule regenerated successfully.");
      navigate("/dashboard", {
        state: {
          refreshSchedule: true
        }
      });
    } catch (error) {
      toast.error("Unable to regenerate schedule.");
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] p-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />

      {step === 1 ? (
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
              onClick={handleOpenRegenerateView}
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
              onClick={handleSkipResume}
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
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl z-10"
        >
          <h2 className="text-2xl font-medium mb-6 text-center">Recovery</h2>
          <div className="space-y-4 text-left">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="text-sm text-neutral-500">Original Time</div>
              <div className="text-xl font-semibold">{formatMinutes(recovery?.originalPlannedMinutes ?? recovery?.totalPlannedMinutes ?? 0)}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="text-sm text-neutral-500">Remaining Planned Time</div>
              <div className="text-xl font-semibold">{formatMinutes(recovery?.remainingPlannedMinutes ?? 0)}</div>
            </div>

            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="text-sm font-medium mb-3">Extra Time</div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setExtraMinutes(0)}
                  className={`rounded-full px-3 py-2 text-sm border text-left ${extraMinutes === 0 ? "bg-blue-500 text-white border-blue-500" : "border-neutral-200 dark:border-neutral-800"}`}
                >
                  Keep Remaining Time
                </button>
                {[30, 60].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => setExtraMinutes(minutes)}
                    className={`rounded-full px-3 py-2 text-sm border text-left ${extraMinutes === minutes ? "bg-blue-500 text-white border-blue-500" : "border-neutral-200 dark:border-neutral-800"}`}
                  >
                    +{minutes} Minutes
                  </button>
                ))}
                <div className="flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 px-3 py-2">
                  <span className="text-sm">Custom</span>
                  <input
                    type="number"
                    min={0}
                    step={15}
                    value={extraMinutes}
                    onChange={(event) => setExtraMinutes(Number(event.target.value) || 0)}
                    className="w-24 bg-transparent text-sm outline-none"
                  />
                  <span className="text-sm">minutes</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleRegenerate}
                disabled={isRecovering}
                className="flex-1 rounded-xl bg-blue-600 text-white px-4 py-3 font-medium"
              >
                {isRecovering ? "Regenerating..." : "Regenerate"}
              </button>
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3"
              >
                Back
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
