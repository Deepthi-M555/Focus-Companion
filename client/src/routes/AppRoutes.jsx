// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate
// } from "react-router-dom";

// import LoginPage
// from "../pages/LoginPage";

// import SignupPage
// from "../pages/SignupPage";

// import DashboardPage
// from "../pages/DashboardPage";

// function AppRoutes() {

//   return (

//     <BrowserRouter>

//       <Routes>

//         <Route
//           path="/"
//           element={<LoginPage />}
//         />

//         <Route
//           path="/signup"
//           element={<SignupPage />}
//         />

//         <Route
//           path="/dashboard"
//           element={<DashboardPage />}
//         />

//         <Route
//           path="*"
//           element={<Navigate to="/" />}
//         />

//       </Routes>

//     </BrowserRouter>

//   );

// }

// export default AppRoutes;


import {

  BrowserRouter,
  Routes,
  Route

} from "react-router-dom";

import LoginPage
from "../features/auth/pages/LoginPage";

import SignupPage
from "../features/auth/pages/SignupPage";

import DashboardPage
from "../features/dashboard/pages/DashboardPage";

import SchedulePage
from "../features/schedule/pages/SchedulePage";

import AnalyticsPage
from "../features/analytics/pages/AnalyticsPage";

import FocusPage
from "../features/focus/pages/FocusPage";

import ChatWorkspace
from "../features/companion/pages/ChatWorkspace";

function AppRoutes() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/schedule"
          element={<SchedulePage />}
        />

        <Route
          path="/analytics"
          element={<AnalyticsPage />}
        />

        <Route
          path="/focus"
          element={<FocusPage />}
        />

        <Route
          path="/companion"
          element={<ChatWorkspace />}
        />

      </Routes>

    </BrowserRouter>

  );

}

export default AppRoutes;