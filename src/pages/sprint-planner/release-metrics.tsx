interface ReleaseMetricsData {
  totalAvailable: number
  totalActualAvailable: number
  totalPlanned: number
  totalAdhoc: number
  totalDelivered: number
  plannedUtil: number
  actualUtil: number
  completionRate: number
  sprintCount: number
}

interface Props {
  metrics: ReleaseMetricsData
}

export function ReleaseMetrics({ metrics }: Props) {
  if (metrics.sprintCount === 0) return null

  return (
    <div className="release-metrics">
      <div className="release-metrics-header">
        <h4>Release Overview</h4>
        <span className="release-metrics-sprints">{metrics.sprintCount} sprint{metrics.sprintCount !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="release-metrics-grid">
        <MetricItem label="Total Available" value={metrics.totalAvailable} />
        <MetricItem label="Committed" value={metrics.totalPlanned} />
        <MetricItem label="Adhoc" value={metrics.totalAdhoc} variant="pink" />
        <MetricItem label="Delivered" value={metrics.totalDelivered} variant="emerald" />
        
        <UtilItem label="Plan %" value={metrics.plannedUtil} />
        <UtilItem label="Actual %" value={metrics.actualUtil} />
        <UtilItem label="Done %" value={metrics.completionRate} isCompletion />
      </div>
    </div>
  )
}

function MetricItem({ label, value, variant }: { label: string; value: number; variant?: 'pink' | 'emerald' }) {
  const colors: Record<string, string> = {
    pink: '#ec4899',
    emerald: '#10b981'
  }

  return (
    <div className="release-metric-item">
      <span className="release-metric-label">{label}</span>
      <span 
        className="release-metric-value"
        style={{ color: variant ? colors[variant] : undefined }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  )
}

function UtilItem({ label, value, isCompletion }: { label: string; value: number; isCompletion?: boolean }) {
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

  return (
    <div className="release-metric-item util">
      <span className="release-metric-label">{label}</span>
      <span 
        className="release-metric-value"
        style={{ color: getColor(value) }}
      >
        {isFinite(value) ? value.toFixed(1) : '0.0'}%
      </span>
    </div>
  )
}
