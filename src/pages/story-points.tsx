import { useState } from 'react'
import { Check, X, Copy } from 'lucide-react'

const PRESETS = [
  { label: '30 min', days: 0, hours: 0, minutes: 30 },
  { label: '1 hour', days: 0, hours: 1, minutes: 0 },
  { label: 'Half day', days: 0, hours: 4, minutes: 0 },
  { label: '1 day', days: 1, hours: 0, minutes: 0 },
  { label: '2 days', days: 2, hours: 0, minutes: 0 },
  { label: '3 days', days: 3, hours: 0, minutes: 0 },
  { label: '1 week', days: 5, hours: 0, minutes: 0 },
]

export function StoryPointsPage() {
  const [days, setDays] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [activePreset, setActivePreset] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const daysVal = parseInt(days) || 0
  const hoursVal = parseInt(hours) || 0
  const minutesVal = parseInt(minutes) || 0
  
  const storyPoints = daysVal + (hoursVal / 8) + (minutesVal / 480)

  const applyPreset = (index: number, preset: typeof PRESETS[0]) => {
    setDays(preset.days ? String(preset.days) : '')
    setHours(preset.hours ? String(preset.hours) : '')
    setMinutes(preset.minutes ? String(preset.minutes) : '')
    setActivePreset(index)
  }

  const clearAll = () => {
    setDays('')
    setHours('')
    setMinutes('')
    setActivePreset(null)
  }

  const handleInputChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value.replace(/[^0-9]/g, ''))
    setActivePreset(null)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(storyPoints.toFixed(4))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page-layout">
      <div className="page-info">
        <h1 className="page-title">Story Points Calculator</h1>
        <p className="page-description">
          Quickly convert the time you've spent on a task into story points. 
          Useful for sprint planning, retrospectives, and tracking team velocity.
        </p>

        <div className="info-section">
          <h3 className="info-title">How it works</h3>
          <ul className="info-list">
            <li>
              <Check />
              Enter the days, hours, and minutes spent on a task
            </li>
            <li>
              <Check />
              Get instant story point conversion
            </li>
            <li>
              <Check />
              Copy the result with one click
            </li>
          </ul>
        </div>

        <div className="info-section">
          <h3 className="info-title">Formula</h3>
          <div className="formula-box">
            <code>
              <span>1 SP</span> = 1 day = 8 hours = 480 minutes<br />
              <span>SP</span> = days + hours ÷ 8 + minutes ÷ 480
            </code>
          </div>
        </div>
      </div>

      <div className="page-tool">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Calculate</h2>
            <button className="clear-btn" onClick={clearAll}>
              <X />
              Clear
            </button>
          </div>
          <div className="card-content">
            <div className="input-grid">
              <div className="form-field">
                <label className="form-label">Days</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    placeholder="0"
                    value={days}
                    onChange={handleInputChange(setDays)}
                  />
                  <span className="input-suffix">days</span>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Hours</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    placeholder="0"
                    value={hours}
                    onChange={handleInputChange(setHours)}
                  />
                  <span className="input-suffix">hrs</span>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Minutes</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    placeholder="0"
                    value={minutes}
                    onChange={handleInputChange(setMinutes)}
                  />
                  <span className="input-suffix">min</span>
                </div>
              </div>
            </div>

            <div className="presets-section">
              <div className="presets-label">Quick presets</div>
              <div className="presets-grid">
                {PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    className={`preset-btn ${activePreset === i ? 'active' : ''}`}
                    onClick={() => applyPreset(i, preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="separator" />

            <div className="results-label">Results</div>

            <div className="result-row primary">
              <div className="result-left">
                <div className="result-icon">✦</div>
                <span className="result-name">Total SP</span>
              </div>
              <div className="result-right">
                <span className="result-value">{storyPoints.toFixed(4)}</span>
                <button 
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={copyToClipboard}
                >
                  {copied ? <Check /> : <Copy />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
