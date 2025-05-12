"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

// Sample data for RFQ status distribution
const statusData = [
  { name: "New", value: 24, color: "#3b82f6" },
  { name: "Draft", value: 18, color: "#6b7280" },
  { name: "Priced", value: 32, color: "#10b981" },
  { name: "Sent", value: 45, color: "#8b5cf6" },
  { name: "Negotiating", value: 28, color: "#f59e0b" },
  { name: "Accepted", value: 52, color: "#059669" },
  { name: "Declined", value: 15, color: "#ef4444" },
  { name: "Processed", value: 38, color: "#6366f1" },
]

export function RfqStatusDistributionChart() {
  return (
    <div className="h-[300px]">
      <div className="flex h-full">
        <ResponsiveContainer width="60%" height="100%">
          <PieChart>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value.toString(), "Count"]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="w-[40%] flex flex-col justify-center">
          <div className="space-y-2">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                <div className="text-sm flex justify-between w-full">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
