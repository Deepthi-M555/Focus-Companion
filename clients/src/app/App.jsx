import { RouterProvider } from "react-router";
import { router } from "./routes.jsx";
import { ThemeProvider } from "./theme.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
