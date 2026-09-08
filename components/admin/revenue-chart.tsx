'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function RevenueChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => new Date(v).getDate().toString()}
            tick={{ fontSize: 11, fill: 'rgb(var(--color-ink-700))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--color-ink-700))' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']}
            labelFormatter={(label) => new Date(label).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
            contentStyle={{ fontSize: 12, borderRadius: 0 }}
          />
          <Line type="monotone" dataKey="total" stroke="rgb(var(--color-signal-500))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
