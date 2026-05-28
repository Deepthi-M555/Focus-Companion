import {

  LineChart,
  Line,
  XAxis,
  YAxis

} from "recharts";

function WeeklyChart({

  data

}) {

  return (

    <LineChart
      width={500}
      height={300}
      data={data}
    >

      <XAxis dataKey="day" />

      <YAxis />

      <Line
        type="monotone"
        dataKey="hours"
      />

    </LineChart>

  );

}

export default WeeklyChart;