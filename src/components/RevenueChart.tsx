import { useState } from "react";

interface Transaction {
  amount: number;
  status: string;
  createdAt: string;
}

interface RevenueChartProps {
  transactions: Transaction[];
}

const SERIES_COLOR = "#5b7cfa";
const SURFACE_COLOR = "#121620";
const GRIDLINE_COLOR = "#1e2330";
const MUTED_TEXT = "#9aa1b2";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function buildLastSevenDays(): { date: Date; label: string }[] {
  const days: { date: Date; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({ date, label: DAY_LABELS[date.getDay()] });
  }
  return days;
}

export default function RevenueChart({ transactions }: RevenueChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const days = buildLastSevenDays();
  const successful = transactions.filter((tx) => tx.status === "success");

  const values = days.map(({ date }) =>
    successful
      .filter(
        (tx) => new Date(tx.createdAt).toDateString() === date.toDateString()
      )
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  const total = values.reduce((sum, v) => sum + v, 0);

  const width = 560;
  const height = 180;
  const padding = { top: 16, right: 16, bottom: 28, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = niceMax(Math.max(...values, 0));
  const stepX = chartWidth / (days.length - 1);

  const xAt = (i: number) => padding.left + i * stepX;
  const yAt = (v: number) =>
    padding.top + chartHeight - (v / maxValue) * chartHeight;

  const linePoints = values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
  const areaPoints = `${xAt(0)},${yAt(0)} ${linePoints} ${xAt(
    days.length - 1
  )},${yAt(0)}`;

  const gridSteps = [0, 0.5, 1].map((f) => maxValue * f);

  if (total === 0) {
    return (
      <div style={styles.card}>
        <h2 style={styles.heading}>Revenue this week</h2>
        <p style={styles.emptyText}>
          No successful payments yet this week.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Revenue this week</h2>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={styles.svg}
        role="img"
        aria-label={`Revenue by day for the last 7 days, totaling Rs ${total.toLocaleString(
          "en-US"
        )}`}
      >
        {gridSteps.map((step) => (
          <line
            key={step}
            x1={padding.left}
            x2={width - padding.right}
            y1={yAt(step)}
            y2={yAt(step)}
            stroke={GRIDLINE_COLOR}
            strokeWidth={1}
          />
        ))}

        {gridSteps.map((step) => (
          <text
            key={step}
            x={padding.left - 10}
            y={yAt(step)}
            textAnchor="end"
            dominantBaseline="middle"
            fill={MUTED_TEXT}
            fontSize={11}
          >
            {step >= 1000 ? `${(step / 1000).toFixed(1)}k` : Math.round(step)}
          </text>
        ))}

        <polygon points={areaPoints} fill={SERIES_COLOR} fillOpacity={0.1} />

        <polyline
          points={linePoints}
          fill="none"
          stroke={SERIES_COLOR}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {values.map((v, i) => (
          <circle
            key={i}
            cx={xAt(i)}
            cy={yAt(v)}
            r={hoverIndex === i ? 6 : 5}
            fill={SERIES_COLOR}
            stroke={SURFACE_COLOR}
            strokeWidth={2}
          />
        ))}

        <text
          x={xAt(days.length - 1)}
          y={yAt(values[values.length - 1]) - 12}
          textAnchor="end"
          fill={MUTED_TEXT}
          fontSize={11}
          fontWeight={600}
        >
          Rs {values[values.length - 1].toLocaleString("en-US")}
        </text>

        {hoverIndex !== null && (
          <line
            x1={xAt(hoverIndex)}
            x2={xAt(hoverIndex)}
            y1={padding.top}
            y2={padding.top + chartHeight}
            stroke={GRIDLINE_COLOR}
            strokeWidth={1}
          />
        )}

        {days.map(({ label }, i) => (
          <text
            key={label + i}
            x={xAt(i)}
            y={height - 8}
            textAnchor="middle"
            fill={MUTED_TEXT}
            fontSize={11}
          >
            {label}
          </text>
        ))}

        {days.map((_, i) => (
          <rect
            key={i}
            x={xAt(i) - stepX / 2}
            y={padding.top}
            width={stepX}
            height={chartHeight}
            fill="transparent"
            tabIndex={0}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            onFocus={() => setHoverIndex(i)}
            onBlur={() => setHoverIndex(null)}
          />
        ))}

        {hoverIndex !== null && (
          <g>
            <rect
              x={Math.min(
                Math.max(xAt(hoverIndex) - 38, padding.left),
                width - padding.right - 76
              )}
              y={yAt(values[hoverIndex]) - 34}
              width={76}
              height={22}
              rx={6}
              fill={SURFACE_COLOR}
              stroke={GRIDLINE_COLOR}
            />
            <text
              x={Math.min(
                Math.max(xAt(hoverIndex), padding.left + 38),
                width - padding.right - 38
              )}
              y={yAt(values[hoverIndex]) - 19}
              textAnchor="middle"
              fill="#f5f6f8"
              fontSize={12}
              fontWeight={700}
            >
              Rs {values[hoverIndex].toLocaleString("en-US")}
            </text>
          </g>
        )}
      </svg>

      <table style={styles.srOnly}>
        <caption>Revenue by day, last 7 days</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {days.map(({ label }, i) => (
            <tr key={label + i}>
              <td>{label}</td>
              <td>Rs {values[i].toLocaleString("en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "#121620",
    border: "1px solid #232838",
    borderRadius: 12,
    padding: 20,
  },
  heading: {
    margin: "0 0 14px",
    fontSize: 15,
    fontWeight: 700,
    color: "#f5f6f8",
  },
  svg: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  emptyText: {
    margin: 0,
    fontSize: 14,
    color: "#9aa1b2",
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  },
};
