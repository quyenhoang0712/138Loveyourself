import { useCallback, useEffect, useState } from 'react'
import './DeveloperPage.css'
import { VisualEditor } from './VisualEditor'

async function readJson(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`)
  return data
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days ? `${days}d ` : ''}${hours}h ${minutes}m`
}

const probes = [
  { key: 'api', method: 'GET', path: '/api/health', label: 'API server' },
  { key: 'database', method: 'PING', path: 'MongoDB', label: 'Database' },
  { key: 'auth', method: 'GET', path: '/api/auth/me', label: 'Auth session' },
  { key: 'memories', method: 'GET', path: '/api/community-memories', label: 'Memories API' },
]

export function DeveloperPage() {
  const [user, setUser] = useState(undefined)
  const [overview, setOverview] = useState(null)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [probeResults, setProbeResults] = useState({})

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewData, logData] = await Promise.all([
        fetch('/api/developer/overview', { credentials: 'include' }).then(readJson),
        fetch('/api/developer/logs', { credentials: 'include' }).then(readJson),
      ])
      setOverview(overviewData)
      setLogs(logData.items || [])
    } catch (loadError) { setError(loadError.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' }).then(readJson).then((data) => {
      const nextUser = data.user || null
      setUser(nextUser)
      if (['admin', 'developer'].includes(nextUser?.role)) loadData()
      else setLoading(false)
    }).catch(() => { setUser(null); setLoading(false) })
  }, [loadData])

  async function runProbe(target) {
    setProbeResults((items) => ({ ...items, [target]: { loading: true } }))
    try {
      const result = await fetch('/api/developer/probe', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      }).then(readJson)
      setProbeResults((items) => ({ ...items, [target]: result }))
    } catch (probeError) {
      setProbeResults((items) => ({ ...items, [target]: { ok: false, error: probeError.message } }))
    }
  }

  if (user === undefined) return <main className="developer-loading">Đang xác thực developer…</main>
  if (!['admin', 'developer'].includes(user?.role)) return <main className="developer-access"><h1>Developer Console</h1><p>Tài khoản này không có quyền developer.</p><a href="/auth?returnTo=/developer">Đăng nhập</a></main>

  return <main className="developer-page">
    <aside className="developer-sidebar">
      <div className="developer-brand"><img src="/logo.svg" alt="LOVE YOURSELF 138knitwear" /><strong>DEV CONSOLE</strong></div>
      <div className="developer-identity"><span>{user.role}</span><strong>{user.name}</strong><small>{user.email}</small></div>
      <nav aria-label="Developer navigation">
        <a href="#dev-status">System Status</a><a href="#dev-connections">Connections</a><a href="#dev-api">API Explorer</a><a href="#dev-database">Database</a><a href="#dev-logs">Logs</a><a href="#dev-visual">Visual Editor</a>
      </nav>
      <div className="developer-sidebar-links"><a href="/admin">Admin page</a><a href="/">Main website</a></div>
    </aside>

    <div className="developer-content">
      <header className="developer-topbar"><div><span>INTERNAL TOOLING</span><h1>Developer Console</h1></div><button type="button" disabled={loading} onClick={loadData}>{loading ? 'Refreshing…' : 'Refresh data'}</button></header>
      {error ? <p className="developer-error">{error}</p> : null}

      <section className="developer-section" id="dev-status"><header><span>01</span><div><h2>System Status</h2><p>Runtime health and server information.</p></div></header>
        <div className="developer-status-grid">
          <article><span>API</span><strong className="is-online">{overview?.system.api || '—'}</strong></article>
          <article><span>Database</span><strong className="is-online">{overview?.system.database || '—'}</strong></article>
          <article><span>Environment</span><strong>{overview?.system.environment || '—'}</strong></article>
          <article><span>Uptime</span><strong>{overview ? formatUptime(overview.system.uptimeSeconds) : '—'}</strong></article>
          <article><span>Node</span><strong>{overview?.system.nodeVersion || '—'}</strong></article>
          <article><span>Response</span><strong>{overview ? `${overview.system.responseTimeMs} ms` : '—'}</strong></article>
        </div>
      </section>

      <section className="developer-section" id="dev-connections"><header><span>02</span><div><h2>Connections</h2><p>Only configuration names are shown. Secrets remain server-side.</p></div></header>
        <div className="developer-connection-grid">{overview?.connections.map((connection) => <article key={connection.key}><div><strong>{connection.label}</strong><code>{connection.configuration}</code></div><span className={connection.connected ? 'is-online' : 'is-offline'}>{connection.connected ? 'CONNECTED' : 'NOT CONFIGURED'}</span></article>)}</div>
      </section>

      <section className="developer-section" id="dev-api"><header><span>03</span><div><h2>API Explorer</h2><p>Safe, read-only probes for approved services.</p></div></header>
        <div className="developer-api-table"><div className="developer-table-head"><span>METHOD</span><span>ENDPOINT</span><span>RESULT</span><span>ACTION</span></div>{probes.map((probe) => { const result = probeResults[probe.key]; return <div className="developer-api-row" key={probe.key}><code>{probe.method}</code><div><strong>{probe.label}</strong><small>{probe.path}</small></div><span className={result?.ok ? 'is-online' : result?.error ? 'is-offline' : ''}>{result?.loading ? 'RUNNING' : result?.ok ? `${result.status} · ${result.durationMs}ms` : result?.error || 'NOT RUN'}</span><button type="button" disabled={result?.loading} onClick={() => runProbe(probe.key)}>Run</button></div> })}</div>
      </section>

      <section className="developer-section" id="dev-database"><header><span>04</span><div><h2>Database Inspector</h2><p>Read-only document counts. No records can be edited here.</p></div></header>
        <div className="developer-collection-grid">{overview?.collections.map((collection) => <article key={collection.name}><code>{collection.name}</code><strong>{collection.count.toLocaleString('vi-VN')}</strong><span>documents</span></article>)}</div>
      </section>

      <section className="developer-section" id="dev-logs"><header><span>05</span><div><h2>System Logs</h2><p>Latest authentication and analytics events.</p></div></header>
        <div className="developer-log-viewer"><div className="developer-log-head"><span>TIME</span><span>SOURCE</span><span>EVENT</span><span>DETAIL</span></div>{logs.length ? logs.map((log) => <div className="developer-log-row" key={log.id}><time>{new Date(log.createdAt).toLocaleString('vi-VN')}</time><code>{log.source}</code><strong>{log.event}</strong><span>{log.detail}</span></div>) : <p>No logs found.</p>}</div>
      </section>
      <VisualEditor />
    </div>
  </main>
}
