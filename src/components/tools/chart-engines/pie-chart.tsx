import { Pie } from "@ant-design/charts";

export const PieChart = ({ data }: any) => {
  const sampledata = {
    data: [
      { type: "Category 1", value: 27 },
      { type: "Classification 2", value: 25 },
      { type: "Category 3", value: 18 },
      { type: "Category Four", value: 15 },
      { type: "Category five", value: 10 },
      { type: "other", value: 5 },
    ],
    angleField: "value",
    colorField: "type",
    label: {
      text: "value",
      style: {
        fontWeight: "bold",
      },
    },
    legend: {
      color: {
        title: false,
        position: "right",
        rowPadding: 5,
      },
    },
    theme: "dark",
  };
  return (
    <div className="pie-chart-container">
      <Pie {...sampledata} />
    </div>
  );
};
