import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function MainLayout({
  children
}) {

  return (

    <div className="app-layout">

      <Sidebar />

      <div className="main-section">

        <Topbar />

        <div className="page-content">

          {children}

        </div>

      </div>

    </div>

  );

}

export default MainLayout;