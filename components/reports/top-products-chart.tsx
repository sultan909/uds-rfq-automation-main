"use client"

import type React from "react"

import { useCurrency } from "@/contexts/currency-context"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

// Sample data for top products
const topProductsData = [
  { name: "CF226X", quantity: 1245, revenue: 149400 },
  { name: "CE255X", quantity: 980, revenue: 94080 },
  { name: "CC364X", quantity: 875, revenue: 126875 },
  { name: "Q2612A", quantity: 750, revenue: 34500 },
  { name: "CE505X", quantity: 620, revenue: 40920 },
]

export function TopProductsChart() {
  const { currency, convertCurrency } = useCurrency()

  // Convert the data based on the selected currency
  const convertedData = topProductsData.map((item) => ({
    ...item,
    revenue: currency === "CAD" ? item.revenue : convertCurrency(item.revenue, "CAD"),
  }))

  return (
    <div
      className="h-[300px]"
      style={
        {
          "--color-quantity": "hsl(215, 100%, 60%)",
          "--color-revenue": "hsl(145, 63%, 42%)",
        } as React.CSSProperties
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={convertedData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="left"
            orientation="left"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              `${currency} ${value.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}`
            }
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "quantity") {
                return [value.toString(), "Quantity"]
              }
              return [`${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, "Revenue"]
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="quantity"
            name="Quantity"
            fill="var(--color-quantity)"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Bar
            yAxisId="right"
            dataKey="revenue"
            name="Revenue"
            fill="var(--color-revenue)"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
