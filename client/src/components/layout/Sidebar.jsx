import { Link }
from "react-router-dom";

function Sidebar() {

  return (

    <div className="sidebar">

      <h1>
        FYNIX
      </h1>

      <Link to="/dashboard">
        Dashboard
      </Link>

      <Link to="/schedule">
        Schedule
      </Link>

      <Link to="/analytics">
        Analytics
      </Link>

      <Link to="/focus">
        Focus
      </Link>

      <Link to="/companion">
        Companion
      </Link>

    </div>

  );

}

export default Sidebar;