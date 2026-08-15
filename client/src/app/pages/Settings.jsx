import { User, Mail, Bell, Mic, Monitor, Moon, Sun } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { useTheme } from "../theme.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Select } from "../components/ui/Select.jsx";
import { Switch } from "../components/ui/Switch.jsx";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ProfileAvatar } from "../components/ProfileAvatar.jsx";
import { getCurrentUser } from "../services/userService";
import {
    getSettings,
    updateSettings,
    updateProfile,
    changePassword
} from "../services/settingsService";

function PermissionRow({ icon, title, description, status, checked, disabled, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex min-w-0 items-center gap-3">
        <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const outletContext = useOutletContext() || {};
  const sharedProfile = outletContext.profile || {
    name: "",
    email: "",
    avatar: ""
  };
  const setSharedProfile = outletContext.setProfile;
  const [profile,setProfile]=useState({
    name: sharedProfile.name || "",
    email: sharedProfile.email || "",
    avatar: sharedProfile.avatar || ""
  });
  const [permissions, setPermissions] = useState({
    microphone: "not_available",
    notifications: "not_available",
    alwaysOnTop: "not_available"
  });
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({

    currentPassword: "",

    newPassword: "",

    confirmPassword: ""

  });


  const [micEnabled, setMicEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [startupEnabled, setStartupEnabled] = useState(false);

  const [voiceResponseTimeout, setVoiceResponseTimeout] = useState("60");
  const [snoozeDuration, setSnoozeDuration] = useState("5");
  const [maxSnoozes, setMaxSnoozes] = useState("3");
  const [savingProfile, setSavingProfile] = useState(false);

  const [savingPreferences, setSavingPreferences] = useState(false);

  const syncPermissions = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const notifications =
      typeof window !== "undefined" && "Notification" in window
        ? (window.Notification.permission === "granted" ? "granted" : "denied")
        : "not_available";

    try {
      const electronStatus = await window.electronAPI?.getPermissionStatus?.();
      setPermissions({
        microphone: electronStatus?.microphone || "not_available",
        notifications,
        alwaysOnTop: electronStatus?.alwaysOnTop || "not_available"
      });
    } catch {
      setPermissions({
        microphone: "not_available",
        notifications,
        alwaysOnTop: "not_available"
      });
    }
  };

  useEffect(() => {
    setProfile({
      name: sharedProfile.name || "",
      email: sharedProfile.email || "",
      avatar: sharedProfile.avatar || ""
    });
  }, [sharedProfile.name, sharedProfile.email, sharedProfile.avatar]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await getCurrentUser();
        const nextProfile = {
          name: user.name || user.email || "User",
          email: user.email || "",
          avatar: user.avatar || ""
        };
        setSharedProfile?.(nextProfile);
        setProfile(nextProfile);
      } catch {
        toast.error("Unable to load profile.");
      }
    }

    loadProfile();
  }, [setSharedProfile]);

  useEffect(() => {
    async function loadSettings() {
        try {
            const data = await getSettings();

            setMicEnabled(data.voiceEnabled?? true);
            setNotificationsEnabled(data.notificationsEnabled?? true);
            setOverlayEnabled(data.overlayEnabled?? true);
            setStartupEnabled(data.startupEnabled?? false);
            setVoiceResponseTimeout(
                String(data.voiceResponseTimeout)
            );

            setSnoozeDuration(
                String(data.snoozeDuration)
            );

            setMaxSnoozes(
                String(data.maxSnoozes)
            );
    
        } catch (error) {
            toast.error("Unable to load settings.");
        }
    }

    loadSettings();
  }, []);

  useEffect(() => {
    void syncPermissions();
  }, []);

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
            <ProfileAvatar profile={profile} size="lg" />
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500">Name</label>
                  <div className="flex items-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2">
                    <User className="w-4 h-4 text-neutral-400 mr-2" />
                    <input type="text" value={profile.name} onChange={(e)=> setProfile({...profile, name:e.target.value})}
                    className="bg-transparent border-none outline-none text-sm w-full"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-500">Email</label>
                  <div className="flex items-center bg-neutral-100 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2">
                    <Mail className="w-4 h-4 text-neutral-400 mr-2" />
                    <input type="email" value={profile.email} readOnly className="bg-transparent border-none outline-none text-sm w-full text-neutral-500 cursor-default" />
                  </div>
                </div>
              </div>
              <div>
                <Button variant="outline" className="text-sm h-9"onClick={()=>setShowPasswordModal(true)}>
                  Change Password
                </Button>
                <div className="pt-4">
                    <Button
                    variant="primary"
                    disabled={savingProfile}
                    className="w-40"
                    onClick={async () => {
                        try {
                          setSavingProfile(true);
                          const updated = await updateProfile({
                            name: profile.name.trim()
                          });
                          const nextProfile = {
                            ...profile,
                            name: updated.user?.name || profile.name.trim(),
                            email: updated.user?.email || profile.email
                          };
                          setProfile(nextProfile);
                          setSharedProfile?.(nextProfile);
                          toast.success("Profile updated.");
                        } catch (error) {
                            toast.error(error?.response?.data?.error?.message || "Unable to update profile.");
                        } finally {
                            setSavingProfile(false);
                        }
                    }}
                    >
                    Save Profile
                    </Button>
                </div>
                {showPasswordModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-[420px]">

                        <h2 className="text-xl font-semibold mb-5">
                            Change Password
                        </h2>

                        <div className="space-y-4">

                            <input
                                type="password"
                                placeholder="Current Password"
                                value={passwordData.currentPassword}
                                onChange={(e)=>
                                    setPasswordData({
                                        ...passwordData,
                                        currentPassword:e.target.value
                                    })
                                }
                                className="w-full border rounded-lg p-3 dark:bg-neutral-800"
                            />

                            <input
                                type="password"
                                placeholder="New Password"
                                value={passwordData.newPassword}
                                onChange={(e)=>
                                    setPasswordData({
                                        ...passwordData,
                                        newPassword:e.target.value
                                    })
                                }
                                className="w-full border rounded-lg p-3 dark:bg-neutral-800"
                            />

                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={passwordData.confirmPassword}
                                onChange={(e)=>
                                    setPasswordData({
                                        ...passwordData,
                                        confirmPassword:e.target.value
                                    })
                                }
                                className="w-full border rounded-lg p-3 dark:bg-neutral-800"
                            />

                        </div>

                        <div className="flex justify-end gap-3 mt-6">

                            <Button
                                variant="outline"
                                onClick={()=>setShowPasswordModal(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                              onClick={async () => {
                                  try {
                                    if (
                                        passwordData.newPassword !==
                                        passwordData.confirmPassword
                                    ) {
                                        return;
                                    }
                                      await changePassword(
                                          passwordData
                                      );
                                      toast.success("Password changed successfully.");
                                      setPasswordData({
                                          currentPassword:"",
                                          newPassword:"",
                                          confirmPassword:""
                                      });
                                      setShowPasswordModal(false);
                                  }
                                  catch(error){
                                      toast.error(
                                          error?.response?.data?.error?.message ||
                                          "Failed to change password."
                                      );
                                  }
                              }}
                          >
                              Save
                          </Button>

                        </div>

                    </div>

                </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Focus Preferences Section */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2">Focus Preferences</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Voice Response Timeout (after session ends)
              </label>

              <Select
                value={voiceResponseTimeout}
                onChange={(e) =>
                  setVoiceResponseTimeout(e.target.value)
                }
              >
                <option value="30">30 Seconds</option>
                <option value="45">45 Seconds</option>
                <option value="60">60 Seconds</option>
                <option value="90">90 Seconds</option>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Snooze Duration</label>
              <Select
                  value={snoozeDuration}
                  onChange={(e) =>
                      setSnoozeDuration(e.target.value)
                  }
              >
                <option value="2">2 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum Snoozes</label>
              <Select
                  value={maxSnoozes}
                  onChange={(e) =>
                      setMaxSnoozes(e.target.value)
                  }
              >
                <option value="1">1 time</option>
                <option value="2">2 times</option>
                <option value="3">3 times</option>
                <option value="4">4 times</option>
                <option value="5">5 times</option>
              </Select>
            </div>
          </div>
        </section>

        {/* Permissions & Integration */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-2">Permissions & System</h3>
          
          <div className="space-y-4">
            <PermissionRow
              icon={<Mic className="w-4 h-4 text-blue-500" />}
              title="Microphone"
              description="Required for voice check-ins"
              status={permissions.microphone}
              checked={micEnabled}
              disabled={false}
              onCheckedChange={async (next) => {
                if (!next) {
                    setMicEnabled(false);
                    return;
                }

                try {
                    const result =
                        await window.electronAPI?.requestMicrophonePermission?.();

                    if (result?.success) {
                        setMicEnabled(true);
                        toast.success("Microphone enabled.");
                    } else {
                        setMicEnabled(false);
                        toast.error(
                            result?.error ||
                            "Microphone permission was not granted."
                        );
                    }

                    await syncPermissions();
                } catch {
                    setMicEnabled(false);
                    toast.error(
                        "Unable to request microphone permission."
                    );
                }
            }}
            />

            <PermissionRow
              icon={<Bell className="w-4 h-4 text-orange-500" />}
              title="Notification"
              description="Desktop notification permission"
              status={permissions.notifications}
              checked={permissions.notifications === "granted"}
              disabled={permissions.notifications === "not_available"}
              onCheckedChange={async (next) => {
                if (!next) {
                  toast.message("Notification permission can only be changed from your browser settings.");
                  await syncPermissions();
                  return;
                }

                if (typeof window === "undefined" || !("Notification" in window)) {
                  toast.error("Notifications are unavailable in this environment.");
                  return;
                }

                try {
                  const permission = await window.Notification.requestPermission();
                  if (permission === "granted") {
                    toast.success("Notifications enabled.");
                  } else {
                    toast.error("Notification permission was not granted.");
                  }
                  await syncPermissions();
                } catch {
                  toast.error("Unable to request notification permission.");
                }
              }}
            />

            <PermissionRow
                icon={<Monitor className="w-4 h-4 text-purple-500" />}
                title="Desktop Overlay"
                description="Show the FYNIX desktop check-in overlay"
                checked={overlayEnabled}
                disabled={false}
                onCheckedChange={setOverlayEnabled}
            />

            <PermissionRow
              icon={<Monitor className="w-4 h-4 text-purple-500" />}
              title="Always On Top"
              description="Desktop overlay window status"
              status={permissions.alwaysOnTop}
              checked={permissions.alwaysOnTop === "granted"}
              disabled={permissions.alwaysOnTop === "not_available"}
              onCheckedChange={async (next) => {
                try {
                  const result = await window.electronAPI?.setAlwaysOnTop?.(next);
                  if (result?.success) {
                    toast.success(next ? "Overlay stays on top." : "Overlay no longer stays on top.");
                  } else {
                    toast.error(result?.error || "Unable to update always-on-top mode.");
                  }
                  await syncPermissions();
                } catch {
                  toast.error("Unable to update always-on-top mode.");
                }
              }}
            />
          </div>
        </section>

        <div className="flex justify-end">
            <Button
                className="mt-6"
                disabled={savingPreferences}
                onClick={async () => {
                    try {
                      setSavingPreferences(true);
                      const normalizedPayload = {
                        voiceEnabled: micEnabled,
                        notificationsEnabled,
                        overlayEnabled,
                        startupEnabled,
                        voiceResponseTimeout: Number(voiceResponseTimeout),
                        snoozeDuration: Number(snoozeDuration),
                        maxSnoozes: Number(maxSnoozes)
                      };
                        await updateSettings(normalizedPayload);
                        toast.success("Preferences updated.");
                    } catch (error) {
                        toast.error(error?.response?.data?.error?.message || "Unable to update preferences.");
                    } finally {
                        setSavingPreferences(false);
                    }
                }}
            >
                Save Preferences
            </Button>
        </div>

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
