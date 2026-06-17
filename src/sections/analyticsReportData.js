export const ageGroupLabels = {
  'under-13': 'Dưới 13',
  '13-17': '13-17',
  '18-24': '18-24',
  '25-34': '25-34',
  '35-44': '35-44',
  '45-54': '45-54',
  '55+': '55+',
}

export const chartColors = ['#4789C8', '#EBAAB4', '#F8DB8E', '#9AB4EE', '#74B8A7', '#C9A4D8', '#E6A16F']

export const eventLabels = {
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

export const genderLabels = {
  female: 'Nữ',
  male: 'Nam',
  other: 'Khác',
}

export const roomLabels = {
  'card-room': 'Phòng thiệp',
  community: 'Cộng đồng',
  'focus-room': 'Phòng tập trung',
  'healing-room': 'Phòng chữa lành',
  home: 'Trang chính',
  'play-room': 'Phòng âm thanh',
  'sound-room': 'Phòng âm thanh',
}

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function getMonthKey(dateValue) {
  return dateValue.slice(0, 7)
}

export function getDateValueForPeriod(period, dateValue) {
  if (period === 'month') return getMonthKey(dateValue)
  return dateValue
}

export function getPeriodLabel(report) {
  if (!report) return 'Chưa tải dữ liệu'
  if (report.period === 'month') return 'Báo cáo theo tháng'
  if (report.period === 'week') return 'Báo cáo theo tuần'
  return 'Báo cáo theo ngày'
}

export function getReportRangeLabel(report) {
  const start = new Date(report.start)
  const end = new Date(report.end)
  end.setMilliseconds(end.getMilliseconds() - 1)

  return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`
}

export function formatSeconds(totalSeconds = 0) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return `${minutes}m ${seconds}s`

  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

export function getChartItems({
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
