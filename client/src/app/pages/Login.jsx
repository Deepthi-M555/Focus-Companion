import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Label } from "../components/ui/Label.jsx";

import { getAuthErrorMessage, login } from "../services/authService";
import { saveToken } from "../utils/token";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const response = await login({
            email,
            password
        });
        saveToken(response.token);
        toast.success("Welcome back!");

        const setupCompleted = response?.setupCompleted;
        const nextPath = setupCompleted === undefined ? "/setup" : setupCompleted ? "/dashboard" : "/setup";
        navigate(nextPath, { replace: true });
    } catch (error) {
        toast.error(getAuthErrorMessage(error));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back to FYNIX</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg">Your focus companion is ready.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input value={email} onChange={(e)=>setEmail(e.target.value)} id="email" type="email" 
          placeholder="Enter your email"
          required/>
        </div>
        
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <div className="relative">
            <Input 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              id="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter your password" 
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" variant="primary" className="w-full h-12 text-base mt-2" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          Create Account
        </Link>
      </p>
    </motion.div>
  );
}
