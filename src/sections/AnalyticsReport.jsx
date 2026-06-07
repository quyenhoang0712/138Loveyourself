import { useState } from 'react'

const adminTokenStorageKey = 'love-yourself-admin-token'
const ageGroupLabels = {
  'under-13': 'Dưới 13',
  '13-17': '13-17',
  '18-24': '18-24',
  '25-34': '25-34',
  '35-44': '35-44',
  '45-54': '45-54',
  '55+': '55+',
}
const eventLabels = {
  ambient_toggle: 'Bật/tắt âm thanh',
  decision_ask: 'Hỏi vị thần quyết định',
  letter_open: 'Mở thiệp',
  profile_saved: 'Lưu tuổi/giới tính',
  quote_save: 'Lưu lời nhắn',
  quote_share: 'Chia sẻ lời nhắn',
  room_view: 'Vào phòng',
  session_start: 'Bắt đầu phiên',
  spotify_view: 'Xem playlist',
  timer_pause: 'Tạm dừng tập trung',
  timer_reset: 'Đặt lại tập trung',
  timer_start: 'Bắt đầu tập trung',
}
const genderLabels = {
  female: 'Nữ',
  male: 'Nam',
  other: 'Khác',
}
const roomLabels = {
  'card-room': 'Phòng thiệp',
  'focus-room': 'Phòng tập trung',
  home: 'Trang chính',
  'play-room': 'Phòng âm thanh',
  'sound-room': 'Phòng âm thanh',
}
const chartColors = ['#4789C8', '#EBAAB4', '#F8DB8E', '#9AB4EE', '#74B8A7', '#C9A4D8', '#E6A16F']

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getMonthKey(dateValue) {
  return dateValue.slice(0, 7)
}

function getDateValueForPeriod(period, dateValue) {
  if (period === 'month') return getMonthKey(dateValue)
  return dateValue
}

function getPeriodLabel(report) {
  if (!report) return 'Chưa tải dữ liệu'
  if (report.period === 'month') return 'Báo cáo theo tháng'
  if (report.period === 'week') return 'Báo cáo theo tuần'
  return 'Báo cáo theo ngày'
}

function getReportRangeLabel(report) {
  const start = new Date(report.start)
  const end = new Date(report.end)
  end.setMilliseconds(end.getMilliseconds() - 1)

  return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`
}

function formatSeconds(totalSeconds = 0) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return `${minutes}m ${seconds}s`

  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function getChartItems({
  items,
  labelFormatter = (value) => value || 'không rõ',
  labelKey = '_id',
  valueKey = 'count',
  valueFormatter = (value) => value,
}) {
  const normalizedItems = items || []
  const maxValue = Math.max(...normalizedItems.map((item) => item[valueKey] || 0), 1)
  const totalValue = normalizedItems.reduce((sum, item) => sum + (item[valueKey] || 0), 0)

  return {
    maxValue,
    totalValue,
    items: normalizedItems.map((item, index) => ({
      color: chartColors[index % chartColors.length],
      key: item[labelKey] || `item-${index}`,
      label: labelFormatter(item[labelKey]),
      percent: totalValue ? Math.round(((item[valueKey] || 0) / totalValue) * 100) : 0,
      value: item[valueKey] || 0,
      valueLabel: valueFormatter(item[valueKey] || 0),
    })),
  }
}

function BarChart({
  empty,
  items,
  labelFormatter = (value) => value || 'không rõ',
  labelKey = '_id',
  valueKey = 'count',
  valueFormatter = (value) => value,
}) {
  if (!items?.length) return <p className="analytics-empty">{empty}</p>

  const chart = getChartItems({ items, labelFormatter, labelKey, valueKey, valueFormatter })

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

function DonutChart({
  empty,
  items,
  labelFormatter = (value) => value || 'không rõ',
  labelKey = '_id',
  valueKey = 'count',
  valueFormatter = (value) => value,
}) {
  if (!items?.length) return <p className="analytics-empty">{empty}</p>

  const chart = getChartItems({ items, labelFormatter, labelKey, valueKey, valueFormatter })
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
  const gradientStops =
    gradient.currentPercent < 100
      ? [...gradient.stops, `${chartColors[chart.items.length % chartColors.length]} ${gradient.currentPercent}% 100%`]
      : gradient.stops

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

export function AnalyticsReport() {
  const [period, setPeriod] = useState('day')
  const [date, setDate] = useState(getTodayKey)
  const [token, setToken] = useState(() => localStorage.getItem(adminTokenStorageKey) || '')
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const loadReport = async () => {
    setIsLoading(true)
    setError('')

    try {
      localStorage.setItem(adminTokenStorageKey, token)
      const params = new URLSearchParams({ period, date })
      const response = await fetch(`/api/analytics/report?${params}`, {
        headers: { 'x-admin-token': token },
      })

      if (!response.ok) {
        throw new Error(response.status === 401 ? 'Token quản trị chưa đúng.' : 'Chưa tải được báo cáo.')
      }

      setReport(await response.json())
    } catch (loadError) {
      setReport(null)
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="analytics-report">
      <div className="analytics-controls">
        <label>
          <span>Token</span>
          <input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Nhập token quản trị" />
        </label>
        <label>
          <span>Chế độ</span>
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
          </select>
        </label>
        <label>
          <span>{period === 'month' ? 'Tháng' : 'Ngày'}</span>
          <input
            type={period === 'month' ? 'month' : 'date'}
            value={getDateValueForPeriod(period, date)}
            onChange={(event) => {
              if (!event.target.value) return
              setDate(period === 'month' ? `${event.target.value}-01` : event.target.value)
            }}
          />
        </label>
        <button type="button" onClick={loadReport} disabled={isLoading || !token}>
          {isLoading ? 'Đang tải' : 'Xem báo cáo'}
        </button>
      </div>

      {error ? <p className="analytics-error">{error}</p> : null}

      {report ? (
        <>
          <div className="analytics-report-label">
            <span>{getPeriodLabel(report)}</span>
            <strong>{getReportRangeLabel(report)}</strong>
          </div>

          <div className="analytics-summary">
            <div>
              <span>Người dùng mới</span>
              <strong>{report.totals.visitors}</strong>
            </div>
            <div>
              <span>Phiên truy cập</span>
              <strong>{report.totals.sessions}</strong>
            </div>
            <div>
              <span>Thời gian trung bình</span>
              <strong>{formatSeconds(report.totals.averageSessionSeconds)}</strong>
            </div>
            <div>
              <span>Tổng thời gian</span>
              <strong>{formatSeconds(report.totals.totalDurationSeconds)}</strong>
            </div>
          </div>

          <div className="analytics-grid">
            <article>
              <h2>Giới tính</h2>
              <DonutChart empty="Chưa có dữ liệu giới tính." items={report.visitorsByGender} labelFormatter={(value) => genderLabels[value] || 'Không rõ'} />
            </article>

            <article>
              <h2>Nhóm tuổi</h2>
              <BarChart empty="Chưa có dữ liệu tuổi." items={report.visitorsByAge} labelFormatter={(value) => ageGroupLabels[value] || 'Không rõ'} />
            </article>

            <article>
              <h2>Phòng được xem nhiều</h2>
              <BarChart empty="Chưa có lượt xem phòng." items={report.roomViews} labelFormatter={(value) => roomLabels[value] || value || 'Không rõ'} valueKey="views" />
            </article>

            <article>
              <h2>Người dùng dừng ở đâu</h2>
              <DonutChart empty="Chưa có phiên truy cập." items={report.stoppedRooms} labelFormatter={(value) => roomLabels[value] || value || 'Không rõ'} labelKey="room" />
            </article>

            <article>
              <h2>Thời gian theo phòng</h2>
              <BarChart
                empty="Chưa có thời gian phòng."
                items={report.roomDurations}
                labelFormatter={(value) => roomLabels[value] || value || 'Không rõ'}
                labelKey="room"
                valueKey="seconds"
                valueFormatter={formatSeconds}
              />
            </article>

            <article>
              <h2>Tương tác</h2>
              <BarChart empty="Chưa có tương tác." items={report.events} labelFormatter={(value) => eventLabels[value] || value || 'Không rõ'} />
            </article>
          </div>
        </>
      ) : null}
    </section>
  )
}
