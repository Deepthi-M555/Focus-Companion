import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";import { motion } from "motion/react";
import { Mic, Bell, Monitor, Settings } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { Label } from "../components/ui/Label.jsx";
import { Switch } from "../components/ui/Switch.jsx";
import { RadioGroup, RadioGroupItem } from "../components/ui/RadioGroup.jsx";
import { Select } from "../components/ui/Select.jsx";
import { Input } from "../components/ui/Input.jsx";

import {saveSetup, getSetup}from "../services/setupService";
export function Setup() {
  const navigate = useNavigate();

  const [frequency, setFrequency] = useState("30");
  const [customFrequency, setCustomFrequency] = useState("");

  const [micEnabled, setMicEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [snoozeDuration, setSnoozeDuration] = useState("5");
  const [maxSnoozes, setMaxSnoozes] = useState("3");
  
  useEffect(() => {
    const loadSetup = async () => {
        try {
            const response =
                await getSetup();
            if (!response.setup) {
                return;
            }
            const setup =
                response.setup;
            setMicEnabled(
                setup.micEnabled
            );

            setNotificationsEnabled(
                setup.notificationsEnabled
            );

            setOverlayEnabled(
                setup.overlayEnabled
            );

            const predefined = ["15","30","45"];
              if (
                  predefined.includes(
                      String(setup.checkInFrequency)
                  )
              ){
                  setFrequency(
                      String(setup.checkInFrequency)
                  );
              }else{

                  setFrequency("custom");

                  setCustomFrequency(
                      String(setup.checkInFrequency)
                  );
              }

            setSnoozeDuration(
                String(
                    setup.snoozeDuration
                )
            );

            setMaxSnoozes(
                setup.maxSnoozes === -1

                    ? "unlimited"

                    : String(
                        setup.maxSnoozes
                    )
            );
        }
        catch (error) {
            console.error(
                "Failed to load setup",
                error
            );
        }
    };
    loadSetup();
  }, []);

  const handleFinish = async (e) => {
    e.preventDefault();
    if (
      frequency === "custom" &&
      !customFrequency.trim()
    ) {
        alert("Please enter a custom check-in interval.");
    return;
    }
    try {
        await saveSetup({
            micEnabled,
            notificationsEnabled,
            overlayEnabled,

            checkInFrequency:
                frequency === "custom"
                    ? Number(customFrequency)
                    : Number(frequency),

            snoozeDuration: Number(snoozeDuration),
            maxSnoozes:
                maxSnoozes === "unlimited"
                    ? -1
                    : Number(maxSnoozes)
        });
        navigate("/dashboard");
    }
    catch (error) {
        console.error(error);
        alert("Setup failed.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-900 dark:text-neutral-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl bg-white dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-neutral-200/50 dark:shadow-black/50"
      >
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Personalize Your FYNIX</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Configure your companion to work exactly how you need it to.</p>
        </div>

        <form onSubmit={handleFinish} className="space-y-10">
          
          {/* Permissions */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium border-b border-neutral-100 dark:border-neutral-800 pb-2">Permissions</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                    <Mic className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Microphone</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Required for voice interactions with FYNIX.</p>
                  </div>
                </div>
                <Switch checked={micEnabled} onCheckedChange={setMicEnabled} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                    <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Notifications</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Get gentle nudges for focus blocks and breaks.</p>
                  </div>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                    <Monitor className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Desktop Overlay</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Keep your current task visible at all times.</p>
                  </div>
                </div>
                <Switch checked={overlayEnabled} onCheckedChange={setOverlayEnabled} />
              </div>
            </div>
          </section>

          {/* Check-In Frequency */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium border-b border-neutral-100 dark:border-neutral-800 pb-2">Default Check-In Frequency</h2>
              <RadioGroup value={frequency} onValueChange={setFrequency} className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                <RadioGroupItem value="15" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer">Every 15 minutes</Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                <RadioGroupItem value="30" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer">Every 30 minutes</Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                <RadioGroupItem value="45" id="r3" />
                <Label htmlFor="r3" className="cursor-pointer">Every 45 minutes</Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                <RadioGroupItem value="custom" id="r4" />
                <Label htmlFor="r4" className="cursor-pointer">Custom</Label>
              </div>
            </RadioGroup>

            {frequency === "custom" && (
            <div className="mt-4">
              <Label>Custom Check-in Interval (minutes)</Label>

              <Input
                type="number"
                placeholder="Enter minutes"
                value={customFrequency}
                onChange={(e) => setCustomFrequency(e.target.value)}
                className="mt-2"
                min="1"
              />
            </div>
          )}
          
          </section>

          {/* Snooze Preferences */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium border-b border-neutral-100 dark:border-neutral-800 pb-2">Snooze Preferences</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Snooze Duration</Label>
                <Select value={snoozeDuration} onValueChange={(e) => setSnoozeDuration(e.target.value)}>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Maximum Snoozes</Label>
                <Select value={maxSnoozes} onValueChange={(e) => setMaxSnoozes(e.target.value)}>
                  <option value="1">1 time</option>
                  <option value="2">2 times</option>
                  <option value="3">3 times</option>
                  <option value="unlimited">Unlimited</option>
                </Select>
              </div>
            </div>
          </section>

          <Button type="submit" variant="primary" size="lg" className="w-full" >
            Finish Setup
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
