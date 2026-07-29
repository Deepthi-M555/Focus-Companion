import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  Play, 
  Sparkles, 
  GripVertical, 
  Coffee, 
  BrainCircuit, 
  MoreHorizontal,
  Clock
} from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { useEffect } from "react";
import { getSchedule } from "../services/scheduleService";
import { saveSchedule } from "../services/taskService";
import {
  startSession,
  failSession,
  resumeActiveSession
} from "../services/sessionService";
import { toast } from "sonner";
import voiceSessionService from "../services/voiceSessionService";

export function Timetable() {
  const navigate = useNavigate();

  const [blocks, setBlocks] = useState([]);
  const [hasPendingSchedule, setHasPendingSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeConflict, setActiveConflict] = useState(null);
  const [pendingStartTask, setPendingStartTask] = useState(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  useEffect(() => {
    async function loadSchedule() {
      const pending =
        sessionStorage.getItem("pendingSchedule");

      if (pending) {
        try {
          const parsed = JSON.parse(pending);

          setBlocks(
            Array.isArray(parsed) ? parsed : []
          );

          setHasPendingSchedule(true);
        } catch (error) {
          console.error(
            "Invalid pending schedule:",
            error
          );

          sessionStorage.removeItem(
            "pendingSchedule"
          );
        }

        return;
      }

      try {
        const response =
          await getSchedule();

        setBlocks(
          Array.isArray(response.schedule)
            ? response.schedule
            : []
        );

        setHasPendingSchedule(false);

      } catch (error) {
        console.error(
          "Unable to load timetable:",
          error
        );

        toast.error(
          "Unable to load your timetable."
        );
      }
    }

    loadSchedule();
  }, []);

  const getFirstStartableTask = (tasks = []) => {
    return tasks.find(
      task => task.status === "pending"
    ) || null;
  };

  const startFocusForTask = async (task) => {
    if (!task?._id) {
      throw new Error("Timetable task was not saved.");
    }

    if (!Number.isFinite(task.estimatedDuration) || task.estimatedDuration <= 0) {
      throw new Error("Timetable task missing a valid duration.");
    }

    try {
      const activeSessionResponse = await resumeActiveSession();

      console.log("===== ACTIVE SESSION =====");
      console.log(activeSessionResponse);

      if (activeSessionResponse?.session) {
        voiceSessionService.setSession(activeSessionResponse.session._id);
        navigate("/focus");
        return;
      }

      const response = await startSession({
        taskId: task._id,
        duration: task.estimatedDuration,
        mode: "gentle"
      });

      voiceSessionService.setSession(
        response.session._id
      );

      navigate("/focus");
    } catch (error) {
      if (error.response?.status === 409) {
        setActiveConflict(error.response.data.session);
        setPendingStartTask(task);
        return;
      }

      throw error;
    }
  };

  const handleSaveAndStart = async () => {
    if (!blocks.length) {
      toast.error(
        "Add a task before starting focus mode."
      );
      return;
    }

    setIsSaving(true);

    try {

      /*
      * CASE 1:
      * Newly generated timetable.
      * It does not exist in MongoDB yet.
      */
      if (hasPendingSchedule) {

        const response =
          await saveSchedule({
            tasks: blocks
          });

        const savedTasks =
          response.tasks ||
          response.schedule ||
          [];

        console.log(
          "===== SAVED TASKS =====",
          savedTasks
        );

        if (!savedTasks.length) {
          throw new Error(
            "Timetable was not saved correctly."
          );
        }

        setBlocks(savedTasks);

        sessionStorage.removeItem(
          "pendingSchedule"
        );

        setHasPendingSchedule(false);

        const firstTask =
          getFirstStartableTask(
            savedTasks
          );

        if (!firstTask) {
          throw new Error(
            "No pending task is available to start."
          );
        }

        toast.success(
          "Timetable saved."
        );

        await startFocusForTask(
          firstTask
        );

        return;
      }

      /*
      * CASE 2:
      * Timetable already came from MongoDB.
      * DO NOT save/recreate it again.
      */
      const firstTask =
        getFirstStartableTask(
          blocks
        );

      if (!firstTask) {
        toast.error(
          "No pending task is available to start."
        );
        return;
      }

      await startFocusForTask(
        firstTask
      );

    } catch (error) {

      console.error(
        "Start focus failed:",
        error
      );

      toast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error.message ||
        "Unable to start focus mode."
      );

    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeExisting = () => {
    setActiveConflict(null);
    setPendingStartTask(null);
    navigate("/focus");
  };

  const handleCancelConflict = () => {
    setActiveConflict(null);
    setPendingStartTask(null);
  };

  const handleEndPreviousAndStart = async () => {
    if (!activeConflict?._id || !pendingStartTask) return;

    setIsResolvingConflict(true);

    try {
      await failSession(activeConflict._id);
      setActiveConflict(null);
      await startFocusForTask(pendingStartTask);
    } catch (error) {
      toast.error(
        error?.response?.data?.error?.message ||
        error.message ||
        "Unable to replace the active session."
      );
    } finally {
      setIsResolvingConflict(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0a0a0a] overflow-hidden">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800/60 bg-white/50 dark:bg-black/20 backdrop-blur-xl flex items-center justify-between z-10 shrink-0">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Today's Timetable</h2>
          <p className="text-neutral-500 text-sm mt-1">Optimized for maximum retention and deep work.</p>
        </div>
        <Button variant="primary" size="lg" className="shadow-lg shadow-blue-500/20 px-8" onClick={handleSaveAndStart} disabled={!blocks.length || isSaving}>
          <Play className="w-5 h-5 mr-2" fill="currentColor" />
          Start Focus
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 relative scrollbar-hide">
        
        {/* AI Explanation Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Today's AI Study Plan</h4>
            <p className="text-sm text-blue-800/80 dark:text-blue-200/70 leading-relaxed max-w-3xl">
              I've front-loaded your DSA study session when your cognitive energy typically peaks. 
              The 90-minute block is followed by a deliberate 15-minute mindful break to help consolidate memory before context-switching to Operating Systems.
            </p>
          </div>
        </motion.div>

        {/* Timetable Grid Experience */}
        <div className="max-w-4xl space-y-4 pb-20">
          
          {blocks.map((block, idx) => {
            const blockType = block.type === "INELASTIC" ? "fixed" : "focus";
            const startTime = block.startTime || block.fixedStartTime;
            const displayTime = startTime
              ? new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Flexible";

            return (
            <motion.div
              key={block._id || block.taskId || `${block.title}-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`group flex items-stretch gap-4 p-4 rounded-2xl border transition-all hover:shadow-md bg-white dark:bg-neutral-900/40 backdrop-blur-sm ${
                blockType === 'focus' ? 'border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800' :
                blockType === 'break' ? 'border-purple-200 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-800' :
                'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {/* Drag Handle */}
              <div className="flex items-center text-neutral-300 dark:text-neutral-700 cursor-grab active:cursor-grabbing hover:text-neutral-500 dark:hover:text-neutral-500 transition-colors">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Time Column */}
              <div className="w-24 shrink-0 flex flex-col justify-center border-r border-neutral-100 dark:border-neutral-800/50 pr-4">
                <span className="font-semibold text-sm">{displayTime}</span>
                <span className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {block.estimatedDuration}m
                </span>
              </div>

              {/* Color Indicator */}
              <div className={`w-1.5 rounded-full shrink-0 ${block.color}`} />

              {/* Content */}
              <div className="flex-1 flex items-center justify-between pl-2">
                <div>
                  <h3 className="font-medium text-base tracking-tight mb-1">{block.title}</h3>
                  <div className="flex gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    blockType === 'focus' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    blockType === 'break' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    blockType === 'fixed' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {blockType}
                    </span>
                  </div>
                </div>

                {/* Icon based on type */}
                <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center shrink-0">
                  {blockType === 'focus' ? <BrainCircuit className="w-5 h-5 text-blue-500" /> :
                   blockType === 'break' ? <Coffee className="w-5 h-5 text-purple-500" /> :
                   <button onClick={() => alert("Edit/Delete Block")} className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-neutral-400" />
</button>}
                </div>
              </div>

            </motion.div>
            );
          })}
          
          <div className="pt-8 flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              + Add Study Goal
            </Button>

            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSaveAndStart}
              disabled={!blocks.length || isSaving}
            >
              {isSaving ? "Saving..." : "Start Work"}
            </Button>
          </div>

        </div>
      </div>

      {activeConflict && (
        <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-2xl">
            <h3 className="text-xl font-medium mb-2">Active Focus Session Detected</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {activeConflict.task?.title
                ? `You already have an active focus session for ${activeConflict.task.title}.`
                : "You already have an active focus session."}
            </p>

            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleResumeExisting}
                disabled={isResolvingConflict}
              >
                Resume Existing Session
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleEndPreviousAndStart}
                disabled={isResolvingConflict}
              >
                {isResolvingConflict ? "Ending Previous Session..." : "End Previous Session & Start New"}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={handleCancelConflict}
                disabled={isResolvingConflict}
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
