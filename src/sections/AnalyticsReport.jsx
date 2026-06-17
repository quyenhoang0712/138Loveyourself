import { useCallback, useEffect, useState } from 'react'
import { BarChart, DonutChart } from './AnalyticsCharts'
import {
  ageGroupLabels,
  eventLabels,
  formatSeconds,
  getDateValueForPeriod,
  getPeriodLabel,
  getReportRangeLabel,
  getTodayKey,
  genderLabels,
  roomLabels,
} from './analyticsReportData'

export function AnalyticsReport() {
  const [period, setPeriod] = useState('day')
  const [date, setDate] = useState(getTodayKey)
  const [user, setUser] = useState(null)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)
  const isAdmin = user?.role === 'admin'

  const loadReport = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({ period, date })
      const response = await fetch(`/api/analytics/report?${params}`)

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? 'Chỉ tài khoản admin mới xem được báo cáo.'
            : 'Chưa tải được báo cáo.',
        )
      }

      setReport(await response.json())
    } catch (loadError) {
      setReport(null)
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [date, period])

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    async function checkAdmin() {
      setIsCheckingAdmin(true)
      setError('')

      try {
        const response = await fetch('/api/auth/me', { credentials: 'include', signal: controller.signal })
        const data = await response.json()
        if (ignore) return

        setUser(data.user || null)
        if (data.user?.role !== 'admin') {
          setReport(null)
          setError('Chỉ tài khoản admin mới xem được báo cáo.')
        }
      } catch (checkError) {
        if (!ignore && checkError.name !== 'AbortError') setError('Chưa kiểm tra được tài khoản admin.')
      } finally {
        if (!ignore) setIsCheckingAdmin(false)
      }
    }

    checkAdmin()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [])

  return (
    <section className="analytics-report">
      <div className="analytics-controls">
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
        <button type="button" onClick={loadReport} disabled={isCheckingAdmin || isLoading || !isAdmin}>
          {isCheckingAdmin || isLoading ? 'Đang tải' : 'Xem báo cáo'}
        </button>
      </div>

      {error ? <p className="analytics-error">{error}</p> : null}
      {!isCheckingAdmin && !isAdmin ? (
        <p className="analytics-empty">
          Bạn cần đăng nhập bằng tài khoản admin tại <a href="/auth">trang tài khoản</a> rồi quay lại báo cáo.
        </p>
      ) : null}

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
