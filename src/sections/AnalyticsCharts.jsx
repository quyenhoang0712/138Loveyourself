import { useMemo } from 'react'
import { chartColors, getChartItems } from './analyticsReportData'

export function BarChart({
  empty,
  items,
  labelFormatter = (value) => value || 'không rõ',
  labelKey = '_id',
  valueKey = 'count',
  valueFormatter = (value) => value,
}) {
  const chart = useMemo(
    () => getChartItems({ items, labelFormatter, labelKey, valueKey, valueFormatter }),
    [items, labelFormatter, labelKey, valueFormatter, valueKey],
  )

  if (!items?.length) return <p className="analytics-empty">{empty}</p>

  return (
    <div className="analytics-bar-chart">
      {chart.items.map((item) => (
        <div className="analytics-bar-row" key={item.key}>
          <div className="analytics-bar-meta">
            <span>{item.label}</span>
            <strong>{item.valueLabel}</strong>
          </div>
          <div className="analytics-bar-track" aria-hidden="true">
            <span
              style={{
                '--bar-color': item.color,
                '--bar-width': `${Math.max(7, Math.round((item.value / chart.maxValue) * 100))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DonutChart({
  empty,
  items,
  labelFormatter = (value) => value || 'không rõ',
  labelKey = '_id',
  valueKey = 'count',
  valueFormatter = (value) => value,
}) {
  const chart = useMemo(
    () => getChartItems({ items, labelFormatter, labelKey, valueKey, valueFormatter }),
    [items, labelFormatter, labelKey, valueFormatter, valueKey],
  )
  const gradientStops = useMemo(() => {
    const gradient = chart.items.reduce(
      (currentGradient, item) => {
        const nextPercent = currentGradient.currentPercent + (chart.totalValue ? (item.value / chart.totalValue) * 100 : 0)

        return {
          currentPercent: nextPercent,
          stops: [...currentGradient.stops, `${item.color} ${currentGradient.currentPercent}% ${nextPercent}%`],
        }
      },
      { currentPercent: 0, stops: [] },
    )

    return gradient.currentPercent < 100
      ? [...gradient.stops, `${chartColors[chart.items.length % chartColors.length]} ${gradient.currentPercent}% 100%`]
      : gradient.stops
  }, [chart.items, chart.totalValue])

  if (!items?.length) return <p className="analytics-empty">{empty}</p>

  return (
    <div className="analytics-donut-wrap">
      <div className="analytics-donut" style={{ '--donut-gradient': gradientStops.join(', ') }} aria-hidden="true">
        <span>{chart.totalValue}</span>
      </div>
      <div className="analytics-donut-legend">
        {chart.items.map((item) => (
          <div className="analytics-donut-row" key={item.key}>
            <span style={{ '--legend-color': item.color }} />
            <p>{item.label}</p>
            <strong>{item.valueLabel}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
