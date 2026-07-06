import { RouterProvider } from "react-router-dom";
import { router } from "./routes.jsx";
import { ThemeProvider } from "./theme.jsx";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}
