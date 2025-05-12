"use client"

import type * as React from "react"
import type { TooltipProps } from "recharts"
import { cn } from "@/lib/utils"

interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: ChartConfig
}

export function ChartContainer({ children, config, className, ...props }: ChartContainerProps) {
  return (
    <div
      className={cn("chart-container relative", className)}
      style={
        {
          "--color-chart-1": "var(--primary)",
          "--color-chart-2": "var(--muted)",
          "--color-chart-3": "var(--accent)",
          "--color-chart-4": "var(--blue-500)",
          "--color-chart-5": "var(--green-500)",
          "--color-chart-6": "var(--purple-500)",
          "--color-chart-7": "var(--amber-500)",
          "--color-chart-8": "var(--indigo-500)",
          "--color-chart-9": "var(--red-500)",
          ...(config
            ? Object.entries(config).reduce(
                (acc, [key, value]) => ({
                  ...acc,
                  [`--color-${key}`]: value.color,
                }),
                {},
              )
            : {}),
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: {
      [key: string]: any
    }
  }>
  label?: string
  formatter?: (value: number, name: string, props: any) => [string, string]
  labelFormatter?: (label: string) => string
  config?: ChartConfig
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  config,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        {label && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {labelFormatter ? labelFormatter(label) : label}
            </span>
          </div>
        )}
        <div className="grid gap-1">
          {payload.map((item, index) => {
            const dataKey = item.name || item.dataKey || ""
            const formattedValue = formatter ? formatter(item.value, dataKey, item) : item.value
            const color = config?.[dataKey]?.color || `var(--color-${dataKey})`
            const label = config?.[dataKey]?.label || dataKey

            return (
              <div key={index} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
                </div>
                <span className="text-xs font-medium">{formattedValue}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ChartTooltip(props: TooltipProps<any, any>) {
  return <></>
}
