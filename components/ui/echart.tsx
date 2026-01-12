'use client'

import React, { useRef, useEffect, CSSProperties } from 'react'
import * as echarts from 'echarts/core'
import { useIsMobile } from '@/hooks/use-mobile'

// Import the necessary ECharts modules
import {
  BarChart,
  LineChart,
  PieChart,
  BarSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
} from 'echarts/charts'
import {
  TooltipComponent,
  TooltipComponentOption,
  GridComponent,
  GridComponentOption,
  LegendComponent,
  LegendComponentOption,
  TitleComponent,
  TitleComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

type ECOption = echarts.ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | TitleComponentOption
>

interface EChartProps {
  option: ECOption
  style?: CSSProperties
  className?: string
  onEvents?: Record<string, (params?: any) => void>
}

export function EChart({ option, style, className, onEvents }: EChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (chartRef.current) {
      // Initialize the chart
      chartInstance.current = echarts.init(chartRef.current, null, {
        renderer: 'canvas',
        useDirtyRect: false,
      })

      // Set chart options
      chartInstance.current.setOption(option, true)

      // Bind events
      if (onEvents) {
        Object.entries(onEvents).forEach(([event, handler]) => {
          chartInstance.current?.on(event, handler)
        })
      }

      // Handle window resize
      const handleResize = () => {
        chartInstance.current?.resize()
      }
      window.addEventListener('resize', handleResize)

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
        chartInstance.current?.dispose()
      }
    }
  }, [option, onEvents])

  // Update chart on mobile state change
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(option, true)
      chartInstance.current.resize()
    }
  }, [isMobile, option])

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: isMobile ? '220px' : '300px',
        ...style,
      }}
      className={className}
    />
  )
}

// Helper function to format currency
const formatCurrency = (value: number) => {
  return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 0 })}`
}

export { formatCurrency }
