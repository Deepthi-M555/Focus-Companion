import { Outlet } from "react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme.jsx";

export function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen w-full flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors duration-300">
      {/* Left side - content */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        <button
          onClick={toggleTheme}
          className="absolute top-8 left-8 sm:left-12 lg:left-24 xl:left-32 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="w-full max-w-md mx-auto">
          <Outlet />
        </div>
      </div>
      
      {/* Right side - illustration */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-neutral-900 dark:bg-black">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1567095751004-aa51a2690368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjBhaSUyMHNwYWNlJTIwZnV0dXJpc3RpY3xlbnwxfHx8fDE3ODE1OTQ3NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
            alt="Abstract AI futuristic theme" 
            className="w-full h-full object-cover opacity-80"
          />
          {/* Calm gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-purple-900/20 to-transparent mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/20 to-neutral-950/90 dark:to-black"></div>
        </div>
        
        {/* Subtle decorative elements */}
        <div className="relative z-10 flex flex-col justify-end p-16 w-full text-white pb-24">
          <div className="w-16 h-1 bg-blue-500 mb-6 rounded-full opacity-80 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          <h2 className="text-4xl font-light tracking-tight mb-4">Your Intelligent<br/><span className="font-medium">Focus Companion</span></h2>
          <p className="text-neutral-400 max-w-md text-lg font-light">
            Plan your day with precision. Stay deeply immersed. Let FYNIX handle the context switching.
          </p>
        </div>
      </div>
    </div>
  );
}
