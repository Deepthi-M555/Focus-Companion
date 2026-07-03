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

export function Timetable() {
  const navigate = useNavigate();

  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    async function loadSchedule() {
        try {
            const response = await getSchedule();
            setBlocks(response.schedule);
        } catch (error) {
            console.error(error);
        }
    }

    loadSchedule();
}, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0a0a0a] overflow-hidden">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800/60 bg-white/50 dark:bg-black/20 backdrop-blur-xl flex items-center justify-between z-10 shrink-0">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Today's Timetable</h2>
          <p className="text-neutral-500 text-sm mt-1">Optimized for maximum retention and deep work.</p>
        </div>
        <Button variant="primary" size="lg" className="shadow-lg shadow-blue-500/20 px-8" onClick={() => navigate("/focus")}>
          <Play className="w-5 h-5 mr-2" fill="currentColor" />
          START WORK
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
          
          {blocks.map((block, idx) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`group flex items-stretch gap-4 p-4 rounded-2xl border transition-all hover:shadow-md bg-white dark:bg-neutral-900/40 backdrop-blur-sm ${
                block.type === 'focus' ? 'border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800' :
                block.type === 'break' ? 'border-purple-200 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-800' :
                'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {/* Drag Handle */}
              <div className="flex items-center text-neutral-300 dark:text-neutral-700 cursor-grab active:cursor-grabbing hover:text-neutral-500 dark:hover:text-neutral-500 transition-colors">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Time Column */}
              <div className="w-24 shrink-0 flex flex-col justify-center border-r border-neutral-100 dark:border-neutral-800/50 pr-4">
                <span className="font-semibold text-sm">{block.time}</span>
                <span className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {block.duration}m
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
                      block.type === 'focus' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      block.type === 'break' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      block.type === 'fixed' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {block.type}
                    </span>
                  </div>
                </div>

                {/* Icon based on type */}
                <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center shrink-0">
                  {block.type === 'focus' ? <BrainCircuit className="w-5 h-5 text-blue-500" /> :
                   block.type === 'break' ? <Coffee className="w-5 h-5 text-purple-500" /> :
                   <button onClick={() => alert("Edit/Delete Block")} className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-neutral-400" />
</button>}
                </div>
              </div>

            </motion.div>
          ))}
          
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
              onClick={async () => {
                await saveSchedule({
                  tasks: blocks
                });

                navigate("/focus");
              }}
            >
              Start Work
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
