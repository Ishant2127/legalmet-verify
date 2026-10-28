"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "10px",
  fontSize: "11px",
  color: "hsl(var(--popover-foreground))",
  boxShadow: "0 18px 40px -24px rgba(0,0,0,0.6)",
} as const;

const AXIS = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 9,
  fontFamily: "var(--font-mono)",
} as const;

const GRID = "hsl(var(--border) / 0.6)";

type TrendPoint = {
  month: string;
  issued: number;
  applications: number;
  verifications: number;
  expiring: number;
};

export function IssuanceTrend({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="issuedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="applicationsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "hsl(var(--gold) / 0.3)" }} />
        <Area
          type="monotone"
          dataKey="applications"
          name="Applications"
          stroke="hsl(var(--info))"
          strokeWidth={1.5}
          fill="url(#applicationsFill)"
        />
        <Area
          type="monotone"
          dataKey="issued"
          name="Certificates issued"
          stroke="hsl(var(--gold))"
          strokeWidth={2}
          fill="url(#issuedFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VerificationTrend({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line
          type="monotone"
          dataKey="verifications"
          name="Public verifications"
          stroke="hsl(var(--success))"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "hsl(var(--success))", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="expiring"
          name="Expiring"
          stroke="hsl(var(--warning))"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DistrictComplianceChart({
  data,
}: {
  data: Array<{ district: string; compliance: number; instruments: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        barCategoryGap={10}
      >
        <CartesianGrid stroke={GRID} strokeDasharray="3 4" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          unit="%"
        />
        <YAxis
          type="category"
          dataKey="district"
          tick={{ ...AXIS, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={94}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
        <Bar dataKey="compliance" name="Compliance" radius={[0, 4, 4, 0]} maxBarSize={14}>
          {data.map((entry) => (
            <Cell
              key={entry.district}
              fill={
                entry.compliance >= 85
                  ? "hsl(var(--success))"
                  : entry.compliance >= 65
                    ? "hsl(var(--gold))"
                    : "hsl(var(--warning))"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const MIX_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function InstrumentMix({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="flex h-full flex-col gap-3 sm:flex-row sm:items-center">
      <div className="mx-auto h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={44}
              outerRadius={64}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={MIX_COLORS[index % MIX_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: MIX_COLORS[index % MIX_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{entry.name}</span>
            <span className="font-mono text-foreground">{entry.value}</span>
            <span className="w-8 text-right font-mono text-[9px] text-muted-foreground">
              {total ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
