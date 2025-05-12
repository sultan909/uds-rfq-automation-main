"use client"

import type React from "react"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

// Sample data for RFQ conversion rate
const conversionData = [
  { month: "Jan", received: 85, converted: 58, rate: 68.2 },
  { month: "Feb", received: 92, converted: 63, rate: 68.5 },
  { month: "Mar", received: 78, converted: 52, rate: 66.7 },
  { month: "Apr", received: 102, converted: 71, rate: 69.6 },
  { month: "May", received: 110, converted: 75, rate: 68.2 },
  { month: "Jun", received: 95, converted: 67, rate: 70.5 },
  { month: "Jul", received: 88, converted: 62, rate: 70.5 },
  { month: "Aug", received: 94, converted: 65, rate: 69.1 },
  { month: "Sep", received: 115, converted: 82, rate: 71.3 },
  { month: "Oct", received: 108, converted: 78, rate: 72.2 },
  { month: "Nov", received: 118, converted: 86, rate: 72.9 },
  { month: "Dec", received: 125, converted: 92, rate: 73.6 },
]

export function RfqConversionChart() {
  return (
    <div
      className="h-[300px]"
      style={
        {
          "--color-received": "hsl(215, 100%, 60%)",
          "--color-converted": "hsl(145, 63%, 42%)",
          "--color-rate": "hsl(275, 80%, 71%)",
        } as React.CSSProperties
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={conversionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-received)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-received)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-converted)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-converted)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" orientation="left" />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "rate") {
                return [`${value}%`, "Conversion Rate"]
              }
              return [value.toString(), name === "received" ? "RFQs Received" : "RFQs Converted"]
            }}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="received"
            name="RFQs Received"
            stroke="var(--color-received)"
            fillOpacity={1}
            fill="url(#colorReceived)"
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="converted"
            name="RFQs Converted"
            stroke="var(--color-converted)"
            fillOpacity={1}
            fill="url(#colorConverted)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="rate"
            name="Conversion Rate (%)"
            stroke="var(--color-rate)"
            fill="none"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
