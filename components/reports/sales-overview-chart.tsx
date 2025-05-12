"use client"

import type React from "react"

import { useCurrency } from "@/contexts/currency-context"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

// Sample data for the sales overview chart
const salesData = [
  { month: "Jan", revenue: 42500, target: 40000, previousYear: 38000 },
  { month: "Feb", revenue: 45200, target: 42000, previousYear: 39500 },
  { month: "Mar", revenue: 48900, target: 45000, previousYear: 42000 },
  { month: "Apr", revenue: 51600, target: 48000, previousYear: 45500 },
  { month: "May", revenue: 49800, target: 50000, previousYear: 47000 },
  { month: "Jun", revenue: 55300, target: 52000, previousYear: 49500 },
  { month: "Jul", revenue: 58100, target: 55000, previousYear: 52000 },
  { month: "Aug", revenue: 56400, target: 58000, previousYear: 54500 },
  { month: "Sep", revenue: 62700, target: 60000, previousYear: 57000 },
  { month: "Oct", revenue: 65900, target: 62000, previousYear: 59500 },
  { month: "Nov", revenue: 68200, target: 65000, previousYear: 62000 },
  { month: "Dec", revenue: 72500, target: 68000, previousYear: 64500 },
]

export function SalesOverviewChart() {
  const { currency, convertCurrency } = useCurrency()

  // Convert the data based on the selected currency
  const convertedData = salesData.map((item) => ({
    ...item,
    revenue: currency === "CAD" ? item.revenue : convertCurrency(item.revenue, "CAD"),
    target: currency === "CAD" ? item.target : convertCurrency(item.target, "CAD"),
    previousYear: currency === "CAD" ? item.previousYear : convertCurrency(item.previousYear, "CAD"),
  }))

  return (
    <div
      className="h-[300px]"
      style={
        {
          "--color-revenue": "hsl(215, 100%, 60%)",
          "--color-target": "hsl(145, 63%, 42%)",
          "--color-previousYear": "hsl(275, 80%, 71%)",
        } as React.CSSProperties
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={convertedData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <XAxis 
            dataKey="month" 
            tickLine={false} 
            axisLine={false} 
            padding={{ left: 10, right: 10 }} 
            // stroke="var(--foreground)"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value) =>
              `${currency} ${value.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}`
            }
            tickLine={false}
            axisLine={false}
            tickCount={6}
            // stroke="var(--foreground)"
            fontSize={12}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              return [
                `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                name === "revenue" ? "Revenue" : name === "target" ? "Target" : "Previous Year",
              ]
            }}
            contentStyle={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)"
            }}
          />
          <Line type="monotone" dataKey="revenue" strokeWidth={2} activeDot={{ r: 6 }} stroke="var(--color-revenue)" />
          <Line type="monotone" dataKey="target" strokeWidth={2} stroke="var(--color-target)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="previousYear"
            strokeWidth={2}
            stroke="var(--color-previousYear)"
            opacity={0.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
