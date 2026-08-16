import { createBrowserRouter, createHashRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout.jsx";
import { AppLayout } from "./layouts/AppLayout.jsx";
import { Login } from "./pages/Login.jsx";
import { Signup } from "./pages/Signup.jsx";
import { Setup } from "./pages/Setup.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Timetable } from "./pages/Timetable.jsx";
import { FocusMode } from "./pages/FocusMode.jsx";
import { Analytics } from "./pages/Analytics.jsx";
import { Settings } from "./pages/Settings.jsx";
import { Recovery } from "./pages/Recovery.jsx";
import { Overlay } from "./pages/Overlay.jsx";
import { ErrorPage } from "./pages/ErrorPage.jsx";

import ProtectedRoute from "./components/ProtectedRoute";

const createAppRouter =
    typeof window !== "undefined" &&
    window.location.protocol === "file:"
        ? createHashRouter
        : createBrowserRouter;

export const router = createAppRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
    errorElement: <ErrorPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
    ],
    errorElement: <ErrorPage />,
  },
  {
    path: "setup",
    element: (
      <ProtectedRoute>
        <Setup />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "overlay",
    element: <Overlay />,
    errorElement: <ErrorPage />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "timetable",
        element: (
          <ProtectedRoute>
            <Timetable />
          </ProtectedRoute>
        ),
      },
      {
        path: "focus",
        element: (
          <ProtectedRoute>
            <FocusMode />
          </ProtectedRoute>
        ),
      },
      {
        path: "recovery",
        element: (
          <ProtectedRoute>
            <Recovery />
          </ProtectedRoute>
        ),
      },
      {
        path: "analytics",
        element: (
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
    ],
    errorElement: <ErrorPage />,
  },
]);
