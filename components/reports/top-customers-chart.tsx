"use client"

import type React from "react"

import { useCurrency } from "@/contexts/currency-context"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

// Sample data for top customers
const topCustomersData = [
  { name: "ABC Electronics", sales: 156420 },
  { name: "Tech Solutions", sales: 98750 },
  { name: "Global Systems", sales: 87450 },
  { name: "Midwest Dist.", sales: 65320 },
  { name: "IJS Globe", sales: 45780 },
]

export function TopCustomersChart() {
  const { currency, convertCurrency } = useCurrency()

  // Convert the data based on the selected currency
  const convertedData = topCustomersData.map((item) => ({
    ...item,
    sales: currency === "CAD" ? item.sales : convertCurrency(item.sales, "CAD"),
  }))

  return (
    <div
      className="h-[300px]"
      style={
        {
          "--color-sales": "hsl(215, 100%, 60%)",
        } as React.CSSProperties
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={convertedData} layout="vertical" margin={{ top: 5, right: 10, left: 70, bottom: 0 }}>
          <XAxis
            type="number"
            tickFormatter={(value) =>
              `${currency} ${value.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}`
            }
            tickLine={false}
            axisLine={false}
            tickCount={5}
            // stroke="var(--foreground)"
            fontSize={12}
            tickMargin={5}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tickLine={false} 
            axisLine={false} 
            // stroke="var(--foreground)"
            fontSize={12}
          />
          <Tooltip
            formatter={(value: number) => [
              `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              "Sales",
            ]}
            contentStyle={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)"
            }}
          />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
