'use client'

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { eliteForgeColors } from '@/lib/theme/elite-forge'

type StatData = { stat: string; value: number }

export function StatsRadar({
  data,
  height = 220,
}: {
  data: StatData[]
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={eliteForgeColors.carbonBorder} />
        <PolarAngleAxis
          dataKey="stat"
          tick={{ fill: eliteForgeColors.muted, fontSize: 11 }}
        />
        <Radar
          dataKey="value"
          stroke={eliteForgeColors.emerald}
          fill={eliteForgeColors.emerald}
          fillOpacity={0.4}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
