import { useCurrentSprint } from '@/store/sprint-planner'
import { calculateSprintMetrics } from '@/lib/calculations'

export function Dashboard() {
  const sprint = useCurrentSprint()
  if (!sprint) return null

  const metrics = calculateSprintMetrics(sprint)

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <MetricCard label="Available" value={metrics.totalAvailable} variant="violet" hint="After adhoc reserve" />
        <MetricCard label="Committed" value={metrics.totalPlanned} hint="Planned SP (excl adhoc)" />
        <MetricCard label="Adhoc SP" value={metrics.totalAdhoc} variant="pink" hint="Unplanned work" />
        <MetricCard label="Delivered" value={metrics.totalDelivered} variant="emerald" hint="All completed" />
        <MetricCard label="Unplan Leave" value={metrics.totalUnplannedLeaves} variant="amber" hint="Sick/emergency" />
        <MetricCard label="Actual Avail" value={metrics.totalActualAvailable} hint="Avail - Unplanned" />
      </div>

      <div className="dashboard-row">
        <UtilCard 
          label="Planned Util" 
          value={metrics.plannedUtil} 
          formula="Committed / Available" 
        />
        <UtilCard 
          label="Actual Util" 
          value={metrics.actualUtil} 
          formula="Delivered / Actual Avail" 
        />
        <UtilCard 
          label="Completion" 
          value={metrics.completionRate} 
          formula="Done (planned) / Committed" 
          isCompletion 
        />
      </div>
    </div>
  )
}

function MetricCard({ label, value, variant, hint }: { label: string; value: number; variant?: 'amber' | 'violet' | 'emerald' | 'pink'; hint?: string }) {
  const bgColors: Record<string, string> = {
    amber: 'rgba(245, 158, 11, 0.1)',
    violet: 'rgba(99, 102, 241, 0.1)',
    emerald: 'rgba(16, 185, 129, 0.1)',
    pink: 'rgba(236, 72, 153, 0.1)'
  }

  const textColors: Record<string, string> = {
    amber: '#f59e0b',
    violet: 'var(--ring)',
    emerald: '#10b981',
    pink: '#ec4899'
  }

  const borderColors: Record<string, string> = {
    amber: 'rgba(245, 158, 11, 0.25)',
    violet: 'rgba(99, 102, 241, 0.25)',
    emerald: 'rgba(16, 185, 129, 0.25)',
    pink: 'rgba(236, 72, 153, 0.25)'
  }

  return (
    <div 
      className="metric-card" 
      style={{ 
        background: variant ? bgColors[variant] : undefined,
        borderColor: variant ? borderColors[variant] : undefined
      }}
    >
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: variant ? textColors[variant] : undefined }}>
        {value.toFixed(1)}
      </div>
      {hint && <div className="metric-hint">{hint}</div>}
    </div>
  )
}

function UtilCard({ label, value, formula, isCompletion }: { label: string; value: number; formula: string; isCompletion?: boolean }) {
  const getColor = (v: number) => {
    if (isCompletion) {
      if (v >= 100) return '#10b981'
      if (v >= 80) return '#f59e0b'
      return '#f43f5e'
    }
    if (v < 85) return '#f43f5e'
    if (v <= 100) return '#10b981'
    return '#ec4899'
  }

  const color = getColor(value)

  return (
    <div className="util-card">
      <div className="util-card-header">
        <span className="util-card-label">{label}</span>
        <span className="util-card-desc">{formula}</span>
      </div>
      <div className="util-card-value" style={{ color }}>
        {isFinite(value) ? value.toFixed(1) : '0.0'}%
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${Math.min(value, 150) / 1.5}%`, background: color }}
        />
      </div>
    </div>
  )
}
