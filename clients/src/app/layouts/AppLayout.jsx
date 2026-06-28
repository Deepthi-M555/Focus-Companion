import { Outlet, useLocation, Link } from "react-router";
import { 
  LayoutDashboard, 
  Target, 
  BarChart2, 
  Settings, 
  Moon, 
  Sun, 
  Flame,
  Clock,
  CheckCircle2,
  ListTodo,
  Brain,
  Coffee,
  PlayCircle
} from "lucide-react";
import { useTheme } from "../theme.jsx";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../components/ui/Collapsible.jsx";

export function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Focus", path: "/focus", icon: Target },
    { name: "Analytics", path: "/analytics", icon: BarChart2 },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-50 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-neutral-200 dark:border-neutral-800/60 bg-white/50 dark:bg-black/20 backdrop-blur-xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-xl tracking-tight">FYNIX</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md" 
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-4">
          <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Current Streak</span>
            </div>
            <span className="font-bold text-orange-600 dark:text-orange-500">12</span>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-0.5">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80" 
                  alt="User" 
                  className="w-full h-full rounded-full border-2 border-white dark:border-[#0a0a0a] object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">Jane Doe</span>
                <span className="text-xs text-neutral-500 mt-1">Pro Plan</span>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* CENTER WORKSPACE */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <Outlet />
      </main>

      {/* RIGHT CONTEXT PANEL */}
      <aside className="w-80 flex-shrink-0 border-l border-neutral-200 dark:border-neutral-800/60 bg-white/30 dark:bg-black/10 backdrop-blur-md overflow-y-auto z-20">
        <div className="p-6 space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Today's Context</h3>
          
          <div className="space-y-4">
            {location.pathname === "/focus" ? (
              <>
                {/* Focus Mode Cards */}
                <Collapsible defaultOpen>
                  <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all hover:shadow-md overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-sm">Current Task</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed font-medium">
                        Review Algorithms
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">Deep Work Phase</p>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                <Collapsible defaultOpen>
                  <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all hover:shadow-md overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Coffee className="w-5 h-5 text-orange-500" />
                        <span className="font-medium text-sm">Upcoming Break</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">In 45 mins</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">15m duration</span>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                <Collapsible defaultOpen>
                  <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all hover:shadow-md overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <PlayCircle className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-sm">Next Focus Block</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Practice LeetCode Arrays</p>
                      <p className="text-xs text-neutral-500 mt-1">90 mins planned</p>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                <Collapsible defaultOpen>
                  <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all hover:shadow-md overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <ListTodo className="w-5 h-5 text-neutral-500" />
                        <span className="font-medium text-sm">Remaining Schedule</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <ul className="space-y-3 relative before:absolute before:inset-y-2 before:left-2 before:w-px before:bg-neutral-200 dark:before:bg-neutral-800">
                        <li className="flex items-start gap-4 text-sm relative">
                          <div className="w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-[#121212] z-10" />
                          <div className="-mt-1">
                            <p className="font-medium">Deep Work</p>
                            <p className="text-xs text-neutral-500">Currently active</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-4 text-sm relative">
                          <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 border-4 border-white dark:border-[#121212] z-10" />
                          <div className="-mt-1 text-neutral-500">
                            <p>Break</p>
                            <p className="text-xs">15m</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-4 text-sm relative">
                          <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 border-4 border-white dark:border-[#121212] z-10" />
                          <div className="-mt-1 text-neutral-500">
                            <p>Deep Work</p>
                            <p className="text-xs">90m</p>
                          </div>
                        </li>
                      </ul>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </>
            ) : (
              <>
                {/* Glass Card 1 */}
                <Collapsible defaultOpen>
                  <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all hover:shadow-md overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-sm">Planned Hours</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-light tracking-tighter">6.5</span>
                        <span className="text-neutral-500 mb-1 text-sm">hrs</span>
                      </div>
                      <div className="mt-3 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full w-[45%]"></div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                {/* Glass Card 2 */}
                <Collapsible defaultOpen>
                  <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all hover:shadow-md overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-sm">Current Task</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
                        Review algorithms and data structures.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-full w-fit">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                        In Progress
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                {/* Glass Card 3 */}
                <Collapsible defaultOpen>
                  <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all hover:shadow-md overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-emerald-500" />
                        <span className="font-medium text-sm">Focus Integrity</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-light">94%</span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">+2% today</span>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </>
            )}
          </div>
        </div>
      </aside>

    </div>
  );
}
