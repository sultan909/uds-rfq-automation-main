"use client"

import { useCurrency } from "@/contexts/currency-context"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react"

export function SalesMetricsCards() {
  const { currency, formatCurrency, convertCurrency } = useCurrency()

  // Sample data for metrics
  const metrics = [
    {
      title: "Total Revenue",
      value: 675000,
      change: 12.5,
      trend: "up",
      icon: DollarSign,
      color: "blue",
    },
    {
      title: "Total Orders",
      value: 1248,
      change: 8.2,
      trend: "up",
      icon: ShoppingCart,
      color: "green",
    },
    {
      title: "Conversion Rate",
      value: 68.5,
      change: 4.3,
      trend: "up",
      icon: TrendingUp,
      color: "purple",
    },
    {
      title: "Active Customers",
      value: 312,
      change: -2.1,
      trend: "down",
      icon: Users,
      color: "amber",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        // Define specific classes for each color instead of using template literals
        let bgClass, iconBgClass, iconTextClass;
        
        switch(metric.color) {
          case "amber":
            bgClass = "bg-amber-50 dark:bg-amber-950/30";
            iconBgClass = "bg-amber-100 dark:bg-amber-800/30";
            iconTextClass = "text-amber-600 dark:text-amber-400";
            break;
          case "blue":
            bgClass = "bg-blue-50 dark:bg-blue-950/30";
            iconBgClass = "bg-blue-100 dark:bg-blue-800/30";
            iconTextClass = "text-blue-600 dark:text-blue-400";
            break;
          case "green":
            bgClass = "bg-green-50 dark:bg-green-950/30";
            iconBgClass = "bg-green-100 dark:bg-green-800/30";
            iconTextClass = "text-green-600 dark:text-green-400";
            break;
          case "purple":
            bgClass = "bg-purple-50 dark:bg-purple-950/30";
            iconBgClass = "bg-purple-100 dark:bg-purple-800/30";
            iconTextClass = "text-purple-600 dark:text-purple-400";
            break;
          default:
            bgClass = "bg-slate-50 dark:bg-slate-950/30";
            iconBgClass = "bg-slate-100 dark:bg-slate-800/30";
            iconTextClass = "text-slate-600 dark:text-slate-400";
        }
        
        const trendColorClass = metric.trend === "up" 
          ? "text-green-600 dark:text-green-400" 
          : "text-red-600 dark:text-red-400";
        
        return (
          <Card key={index} className={bgClass}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <div className="text-2xl font-bold mt-1 text-foreground">
                    {metric.title.includes("Revenue")
                      ? formatCurrency(currency === "CAD" ? metric.value : convertCurrency(metric.value, "CAD"))
                      : metric.title.includes("Rate")
                        ? `${metric.value}%`
                        : metric.value.toLocaleString()}
                  </div>
                </div>
                <div className={iconBgClass + " p-2 rounded-full"}>
                  <metric.icon className={`h-5 w-5 ${iconTextClass}`} />
                </div>
              </div>
              <div className={`flex items-center mt-2 text-xs ${trendColorClass}`}>
                {metric.trend === "up" ? (
                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                )}
                <span>{metric.change}% from last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  )
}
