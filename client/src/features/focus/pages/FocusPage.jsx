import MainLayout
from "../../../components/layout/MainLayout";

function FocusPage() {

  return (

    <MainLayout>

      <div className="focus-page">

        <h1>
          Focus Session
        </h1>

        <div className="timer-display">

          25:00

        </div>

        <button>
          Start Session
        </button>

      </div>

    </MainLayout>

  );

}

export default FocusPage;