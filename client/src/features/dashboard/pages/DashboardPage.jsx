import MainLayout
from "../../../components/layout/MainLayout";

function DashboardPage() {

  return (

    <MainLayout>

      <div className="dashboard-page">

        <h1>
          Dashboard
        </h1>

        <div className="dashboard-cards">

          <div className="card">

            <h2>
              Focus Hours
            </h2>

            <p>
              5.2h
            </p>

          </div>

          <div className="card">

            <h2>
              Tasks Completed
            </h2>

            <p>
              8
            </p>

          </div>

        </div>

      </div>

    </MainLayout>

  );

}

export default DashboardPage;