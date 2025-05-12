"use client"

import { useCurrency } from "@/contexts/currency-context"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

// Sample data for sales by region
const regionData = [
  { name: "Ontario", value: 425000 },
  { name: "Quebec", value: 320000 },
  { name: "British Columbia", value: 280000 },
  { name: "Alberta", value: 175000 },
  { name: "Manitoba", value: 95000 },
  { name: "Other", value: 105000 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export function SalesByRegionChart() {
  const { currency, convertCurrency } = useCurrency()

  // Convert the data based on the selected currency
  const convertedData = regionData.map((item, index) => ({
    ...item,
    value: currency === "CAD" ? item.value : convertCurrency(item.value, "CAD"),
    color: COLORS[index % COLORS.length],
  }))

  return (
    <div className="h-[300px]">
      <div className="flex h-full">
        <ResponsiveContainer width="60%" height="100%">
          <PieChart>
            <Pie
              data={convertedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {convertedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                "Sales",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="w-[40%] flex flex-col justify-center">
          <div className="space-y-2">
            {convertedData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                <div className="text-sm flex justify-between w-full">
                  <span>{item.name}</span>
                  <span className="font-medium">
                    {currency} {item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
