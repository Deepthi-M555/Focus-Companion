import { createBrowserRouter, Navigate } from "react-router";
import { AuthLayout } from "./layouts/AuthLayout.jsx";
import { AppLayout } from "./layouts/AppLayout.jsx";
import { Login } from "./pages/Login.jsx";
import { Signup } from "./pages/Signup.jsx";
import { Setup } from "./pages/Setup.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Timetable } from "./pages/Timetable.jsx";
import { FocusMode } from "./pages/FocusMode.jsx";
import { Overlay } from "./pages/Overlay.jsx";
import { Analytics } from "./pages/Analytics.jsx";
import { Settings } from "./pages/Settings.jsx";
import { Recovery } from "./pages/Recovery.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
    ],
  },
  {
    path: "setup",
    element: <Setup />,
  },
  {
    path: "overlay",
    element: <Overlay />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "timetable", element: <Timetable /> },
      { path: "focus", element: <FocusMode /> },
      { path: "recovery", element: <Recovery /> },
      { path: "analytics", element: <Analytics /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
