import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

interface ChartBlockProps {
  labels: string[];
  data: number[];
}

export default function ChartBlock({ labels, data }: ChartBlockProps) {
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Pushes per Week",
            data,
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            fill: true,
            tension: 0.3,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          tooltip: {
            mode: "index" as const,
            intersect: false,
          },
        },
      }}
    />
  );
}
