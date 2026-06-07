const maxActivityGapSeconds = 120

export function getAgeGroup(age) {
  if (age < 13) return 'under-13'
  if (age <= 17) return '13-17'
  if (age <= 24) return '18-24'
  if (age <= 34) return '25-34'
  if (age <= 44) return '35-44'
  if (age <= 54) return '45-54'
  return '55+'
}

export function getDateRange(period = 'day', dateValue) {
  const base = dateValue ? new Date(`${dateValue}T00:00:00.000Z`) : new Date()
  if (Number.isNaN(base.getTime())) {
    throw new Error('Invalid date')
  }

  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()))

  if (period === 'week') {
    const day = start.getUTCDay() || 7
    start.setUTCDate(start.getUTCDate() - day + 1)
  } else if (period === 'month') {
    start.setUTCDate(1)
  }

  const end = new Date(start)
  if (period === 'month') {
    end.setUTCMonth(end.getUTCMonth() + 1)
  } else {
    end.setUTCDate(end.getUTCDate() + (period === 'week' ? 7 : 1))
  }

  return { start, end }
}

export function secondsBetween(start, end) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
}

export function applySessionActivity(session, nextRoom = 'home', now = new Date()) {
  if (session.lastActiveAt && session.lastRoom) {
    const activeSeconds = Math.min(secondsBetween(session.lastActiveAt, now), maxActivityGapSeconds)

    if (activeSeconds > 0) {
      const currentDuration = session.roomDurations?.get(session.lastRoom) || 0
      session.roomDurations.set(session.lastRoom, currentDuration + activeSeconds)
      session.durationSeconds += activeSeconds
    }
  }

  session.lastActiveAt = now
  session.lastRoom = nextRoom || session.lastRoom || 'home'
}
