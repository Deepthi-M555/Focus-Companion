import MainLayout
from "../../../components/layout/MainLayout";

import TimelineGrid
from "../components/TimelineGrid";

function SchedulePage() {

  const schedule = [

    {
      id: "1",
      title: "Math",
      startTime: "9:00 AM",
      endTime: "10:00 AM"
    },

    {
      id: "2",
      title: "Coding",
      startTime: "11:00 AM",
      endTime: "1:00 PM"
    }

  ];

  return (

    <MainLayout>

      <h1>
        Smart Schedule
      </h1>

      <TimelineGrid
        schedule={schedule}
      />

    </MainLayout>

  );

}

export default SchedulePage;