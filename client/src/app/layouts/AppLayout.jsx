import { useEffect, useState } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Target, 
  BarChart2, 
  Settings, 
  Moon, 
  Sun, 
  Flame,
  Clock,
  ListTodo,
  Brain,
} from "lucide-react";
import { useTheme } from "../theme.jsx";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../components/ui/Collapsible.jsx";
import { getAnalytics } from "../services/analyticsService";
import { resumeSession } from "../services/sessionService";
import { loadActiveSchedule } from "../services/taskService";
import { getCurrentUser } from "../services/userService";
import { ProfileAvatar } from "../components/ProfileAvatar.jsx";
import { removeToken, clearUserScopedClientState } from "../utils/token";
import { disconnectSocket } from "../services/socketService";
import voiceSessionService from "../services/voiceSessionService";

export function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    avatar: ""
  });
  const [contextSummary, setContextSummary] = useState({
    currentTask: "",
    focusIntegrity: 0,
    todayTasks: []
  });

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Focus", path: "/focus", icon: Target },
    { name: "Analytics", path: "/analytics", icon: BarChart2 },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    removeToken();
    clearUserScopedClientState();
    voiceSessionService.clearSession();
    disconnectSocket();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    let cancelled = false;

    async function loadCoreContext() {
      try {
        const [user, activeSession, schedule] = await Promise.all([
          getCurrentUser(),
          resumeSession(),
          loadActiveSchedule()
        ]);

        if (cancelled) {
          return;
        }

        const activeTask = activeSession?.session?.task;
        const todayTasks = schedule?.schedule || [];

        setProfile({
          name: user.name || user.email || "User",
          email: user.email || "",
          avatar: user.avatar || ""
        });
        setContextSummary((prev) => ({
          ...prev,
          currentTask: activeTask?.title || activeTask?.name || "",
          todayTasks
        }));
      } catch {
        if (!cancelled) {
          setProfile({ name: "User", email: "", avatar: "" });
        }
      }
    }

    async function loadAnalyticsContext() {
      try {
        const analytics = await getAnalytics();
        if (!cancelled) {
          setStreak(analytics?.stats?.streak ?? 0);
          setContextSummary((prev) => ({
            ...prev,
            focusIntegrity: analytics?.stats?.focusIntegrity ?? 0
          }));
        }
      } catch {
        if (!cancelled) {
          setStreak(0);
        }
      }
    }

    void loadCoreContext();
    const analyticsTimer = window.setTimeout(() => {
      void loadAnalyticsContext();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(analyticsTimer);
    };
  }, [location.pathname]);

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
            <span className="font-bold text-orange-600 dark:text-orange-500">{streak} Days</span>
          </div>

          <div className="flex items-center justify-between gap-2 px-2">
            <div className="min-w-0 flex flex-1 items-center gap-3 cursor-pointer" onClick={()=>navigate("/settings")} >
              <ProfileAvatar profile={profile} />
              <div className="min-w-0 flex flex-col justify-center">
                <span className="truncate text-sm font-medium leading-tight">{profile.name || "User"}</span>
                <span className="truncate text-xs text-neutral-500 leading-tight mt-1">{profile.email || "Active user"}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              title="Logout"
            >
              <span className="text-sm font-medium">↪</span>
            </button>
            <button 
              onClick={toggleTheme}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* CENTER WORKSPACE */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <Outlet context={{ profile, setProfile }} />
      </main>

      {/* RIGHT CONTEXT PANEL */}
      <aside className="w-80 flex-shrink-0 border-l border-neutral-200 dark:border-neutral-800/60 bg-white/30 dark:bg-black/10 backdrop-blur-md overflow-y-auto z-20">
        <div className="p-6 space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Today's Context</h3>
          
          <div className="space-y-4">
            <>
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
                        {contextSummary.currentTask || "No active task"}
                      </p>
                      {contextSummary.currentTask && (
                        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-full w-fit">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                          In Progress
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>

                <Collapsible defaultOpen>
                  <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all hover:shadow-md overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <ListTodo className="w-5 h-5 text-neutral-500" />
                        <span className="font-medium text-sm">Today's Tasks</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      {contextSummary.todayTasks.length === 0 ? (
                        <p className="text-sm text-neutral-500">No tasks scheduled today.</p>
                      ) : (
                        <ul className="space-y-3">
                          {contextSummary.todayTasks.map(task => (
                            <li key={task._id} className="flex items-start justify-between gap-3 text-sm">
                              <span className="min-w-0 truncate text-neutral-700 dark:text-neutral-200">{task.title}</span>
                              <span className="flex-shrink-0 text-xs text-neutral-500">{task.estimatedDuration}m</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>

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
                        <span className="text-2xl font-light">{contextSummary.focusIntegrity}%</span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">Live analytics</span>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </>
          </div>
        </div>
      </aside>

    </div>
  );
}
