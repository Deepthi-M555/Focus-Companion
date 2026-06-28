import { useState } from "react";
import { User, Mail, Lock, Bell, Mic, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../theme.jsx";
import { Switch } from "../components/ui/Switch.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Select } from "../components/ui/Select.jsx";

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  
  // Fake states for demonstration
  const [micEnabled, setMicEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [startupEnabled, setStartupEnabled] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0a0a0a] p-8 scrollbar-hide">
      <div className="max-w-3xl mx-auto space-y-12 pb-12">
        
        <div>
          <h2 className="text-3xl font-light tracking-tight mb-2">Settings</h2>
          <p className="text-neutral-500">Manage your profile, preferences, and permissions.</p>
        </div>

        {/* Profile Section */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2">Profile</h3>
          
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-800">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-white font-medium">Edit</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500">Name</label>
                  <div className="flex items-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2">
                    <User className="w-4 h-4 text-neutral-400 mr-2" />
                    <input type="text" defaultValue="Jane Doe" className="bg-transparent border-none outline-none text-sm w-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500">Email</label>
                  <div className="flex items-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2">
                    <Mail className="w-4 h-4 text-neutral-400 mr-2" />
                    <input type="email" defaultValue="jane@example.com" className="bg-transparent border-none outline-none text-sm w-full" />
                  </div>
                </div>
              </div>
              <div>
                <Button variant="outline" className="text-sm h-9">
                  <Lock className="w-3.5 h-3.5 mr-2" />
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Focus Preferences Section */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2">Focus Preferences</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Check-In Frequency</label>
              <Select defaultValue="45">
                <option value="25">Every 25 minutes</option>
                <option value="45">Every 45 minutes</option>
                <option value="60">Every 60 minutes</option>
                <option value="90">Every 90 minutes</option>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Snooze Duration</label>
              <Select defaultValue="5">
                <option value="2">2 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum Snoozes</label>
              <Select defaultValue="3">
                <option value="1">1 time</option>
                <option value="3">3 times</option>
                <option value="5">5 times</option>
                <option value="unlimited">Unlimited</option>
              </Select>
            </div>
          </div>
        </section>

        {/* Permissions & Integration */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2">Permissions & System</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                  <Mic className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Microphone Access</p>
                  <p className="text-xs text-neutral-500">Required for voice check-ins</p>
                </div>
              </div>
              <Switch checked={micEnabled} onCheckedChange={setMicEnabled} />
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                  <Bell className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs text-neutral-500">Allow desktop notifications</p>
                </div>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                  <Monitor className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Desktop Overlay</p>
                  <p className="text-xs text-neutral-500">Enable always-on-top mini player</p>
                </div>
              </div>
              <Switch checked={overlayEnabled} onCheckedChange={setOverlayEnabled} />
            </div>

            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                  <Monitor className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Launch on Startup</p>
                  <p className="text-xs text-neutral-500">Open FYNIX when computer starts</p>
                </div>
              </div>
              <Switch checked={startupEnabled} onCheckedChange={setStartupEnabled} />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2">Appearance</h3>
          
          <div className="flex gap-4">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex-1 p-4 rounded-xl border ${
                theme === 'light' 
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              } transition-all flex flex-col items-center gap-3`}
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                <Sun className="w-5 h-5 text-neutral-700" />
              </div>
              <span className="font-medium text-sm">Light Mode</span>
            </button>
            
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex-1 p-4 rounded-xl border ${
                theme === 'dark' 
                  ? 'border-blue-500 bg-blue-900/20 ring-1 ring-blue-500' 
                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              } transition-all flex flex-col items-center gap-3`}
            >
              <div className="w-10 h-10 rounded-full bg-neutral-900 shadow-sm flex items-center justify-center">
                <Moon className="w-5 h-5 text-neutral-300" />
              </div>
              <span className="font-medium text-sm">Dark Mode</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
