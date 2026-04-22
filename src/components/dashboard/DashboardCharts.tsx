"use client"

import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Pie, 
  PieChart, 
  Label,
  Cell
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

// ── AREA CHART COMPONENT ───────────────────────

interface AreaChartProps {
  data: { month: string; revenue: number }[]
  title?: string
}

export function SalesAreaChart({ data, title = "Análise de Faturamento" }: AreaChartProps) {
  const chartConfig = {
    revenue: {
      label: "Faturamento",
      color: "#4F46E5",
    },
  } satisfies ChartConfig

  return (
    <Card className="rounded-[32px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="grid gap-1">
          <CardTitle className="text-lg font-bold text-slate-800">{title}</CardTitle>
          <CardDescription className="text-[13px] font-medium text-slate-500">
            Evolução mensal do faturamento em {new Date().getFullYear()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            data={data}
            margin={{ left: 12, right: 12, top: 10, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
              style={{ fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' }}
            />
            <YAxis hide domain={[0, 'auto']} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              dataKey="revenue"
              type="natural"
              fill="url(#fillRevenue)"
              stroke="#4F46E5"
              strokeWidth={2}
              stackId="a"
              animationDuration={1500}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// ── DONUT CHART COMPONENT ──────────────────────

interface DonutChartProps {
  data: { status: string; count: number; fill: string }[]
  total: number
}

export function InvoicesDonutChart({ data, total }: DonutChartProps) {
  const chartConfig = {
    count: {
      label: "Quantidade",
    },
    pago: {
      label: "Pago",
      color: "#10B981",
    },
    pendente: {
      label: "Pendente",
      color: "#4F46E5",
    },
    atrasado: {
      label: "Atrasado",
      color: "#1E1B4B",
    },
  } satisfies ChartConfig

  return (
    <Card className="flex flex-col rounded-[32px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <CardHeader className="items-start pb-0">
        <CardTitle className="text-lg font-bold text-slate-800">Estatísticas de Faturas</CardTitle>
        <CardDescription className="text-[13px] font-medium text-slate-500">Distribuição por status</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={65}
              outerRadius={85}
              strokeWidth={8}
              stroke="#fff"
              paddingAngle={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-slate-900 text-3xl font-black tracking-tighter"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-slate-400 text-[13px] font-black uppercase tracking-widest"
                        >
                          Faturas
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-4 text-sm pt-0">
        <div className="w-full space-y-2">
           {data.map((item, i) => (
             <div key={i} className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                 <span className="text-[13px] font-bold text-slate-400 capitalize">{item.status}</span>
               </div>
               <span className="text-[13px] font-black text-slate-800">{item.count}</span>
             </div>
           ))}
        </div>
      </CardFooter>
    </Card>
  )
}
