import { useState, useEffect, useCallback } from 'react'

// ─── Helpers ───────────────────────────────────────────
const STORAGE_KEY = 'attendance-tracker-data'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function calcPercent(attended, conducted) {
  if (!conducted || conducted <= 0) return 0
  return Math.min(100, (attended / conducted) * 100)
}

function getStatusInfo(percent) {
  if (percent >= 75) return { status: 'safe', label: 'On Track', icon: '✓' }
  if (percent >= 60) return { status: 'warning', label: 'At Risk', icon: '!' }
  return { status: 'danger', label: 'Critical', icon: '✕' }
}

// ─── Default State ─────────────────────────────────────
const defaultState = {
  startDate: '2026-04-01',
  endDate: '2026-04-30',
  theory: { conducted: '', attended: '' },
  practical: { conducted: '', attended: '' },
  mentoring: { conducted: '', attended: '' },
}

// ─── App ───────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(() => {
    const saved = loadData()
    return saved || { ...defaultState }
  })
  const [saved, setSaved] = useState(false)

  // Persist every change
  useEffect(() => {
    saveData(data)
    setSaved(true)
    const timer = setTimeout(() => setSaved(false), 1500)
    return () => clearTimeout(timer)
  }, [data])

  const updateDate = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateCategory = useCallback((category, field, value) => {
    // Allow empty string so user can clear the field
    const numVal = value === '' ? '' : Math.max(0, parseInt(value) || 0)
    setData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: numVal }
    }))
  }, [])

  // ─── Calculations ─────────────────────────────────────
  const getNum = (val) => (val === '' || val === undefined) ? 0 : Number(val)

  const theoryPercent = calcPercent(getNum(data.theory.attended), getNum(data.theory.conducted))
  const practicalPercent = calcPercent(getNum(data.practical.attended), getNum(data.practical.conducted))
  const mentoringPercent = calcPercent(getNum(data.mentoring.attended), getNum(data.mentoring.conducted))

  const totalConducted = getNum(data.theory.conducted) + getNum(data.practical.conducted) + getNum(data.mentoring.conducted)
  const totalAttended = getNum(data.theory.attended) + getNum(data.practical.attended) + getNum(data.mentoring.attended)
  const overallPercent = calcPercent(totalAttended, totalConducted)

  const overallStatus = getStatusInfo(overallPercent)
  const dateRange = `${formatDate(data.startDate)} – ${formatDate(data.endDate)}`

  // ─── Category Config ──────────────────────────────────
  const categories = [
    { key: 'theory', title: 'Theory Classes', icon: '📖', percent: theoryPercent },
    { key: 'practical', title: 'Practical / Lab', icon: '🧪', percent: practicalPercent },
    { key: 'mentoring', title: 'Mentoring', icon: '🎯', percent: mentoringPercent },
  ]

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header__icon">📊</div>
        <h1 className="header__title">Attendance Tracker</h1>
        <p className="header__subtitle">Track your attendance across all categories</p>
      </header>

      {/* Date Range Picker */}
      <section className="date-range" id="date-range-section">
        <span className="date-range__label">From</span>
        <input
          type="date"
          className="date-range__input"
          id="start-date"
          value={data.startDate}
          onChange={e => updateDate('startDate', e.target.value)}
        />
        <span className="date-range__separator">→</span>
        <span className="date-range__label">To</span>
        <input
          type="date"
          className="date-range__input"
          id="end-date"
          value={data.endDate}
          onChange={e => updateDate('endDate', e.target.value)}
        />
      </section>

      {/* Category Cards */}
      <div className="cards-grid">
        {categories.map(cat => {
          const catData = data[cat.key]
          const statusInfo = getStatusInfo(cat.percent)
          return (
            <div
              key={cat.key}
              className={`category-card category-card--${cat.key}`}
              id={`card-${cat.key}`}
            >
              <div className="category-card__header">
                <div className="category-card__title-group">
                  <div className="category-card__icon">{cat.icon}</div>
                  <div>
                    <div className="category-card__title">{cat.title}</div>
                    <div className="category-card__date">{dateRange}</div>
                  </div>
                </div>
                <div className="category-card__percentage">
                  {cat.percent.toFixed(1)}%
                </div>
              </div>

              <div className="category-card__inputs">
                <div className="input-group">
                  <label className="input-group__label" htmlFor={`${cat.key}-conducted`}>
                    Total Conducted
                  </label>
                  <input
                    type="number"
                    className="input-group__field"
                    id={`${cat.key}-conducted`}
                    placeholder="0"
                    min="0"
                    value={catData.conducted}
                    onChange={e => updateCategory(cat.key, 'conducted', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-group__label" htmlFor={`${cat.key}-attended`}>
                    Total Attended
                  </label>
                  <input
                    type="number"
                    className="input-group__field"
                    id={`${cat.key}-attended`}
                    placeholder="0"
                    min="0"
                    value={catData.attended}
                    onChange={e => updateCategory(cat.key, 'attended', e.target.value)}
                  />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${cat.percent}%` }}
                />
              </div>

              {/* Status Badge */}
              {(getNum(catData.conducted) > 0) && (
                <div className="overall-card__header" style={{ textAlign: 'left', marginBottom: 0, marginTop: '12px' }}>
                  <span className={`status-badge status-badge--${statusInfo.status}`}>
                    <span className="status-badge__dot" />
                    {statusInfo.label}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Overall Summary Card */}
      <div className="overall-card" id="overall-summary">
        <div className="overall-card__header">
          <div className="overall-card__label">Overall Attendance</div>
          <div className="overall-card__percentage">
            {overallPercent.toFixed(1)}%
          </div>
          {totalConducted > 0 && (
            <span className={`status-badge status-badge--${overallStatus.status}`}>
              <span className="status-badge__dot" />
              {overallStatus.label} — {totalAttended} / {totalConducted} classes
            </span>
          )}
        </div>

        <div className="overall-card__breakdown">
          <div className="breakdown-item breakdown-item--theory">
            <div className="breakdown-item__label">Theory</div>
            <div className="breakdown-item__value">{theoryPercent.toFixed(1)}%</div>
          </div>
          <div className="breakdown-item breakdown-item--practical">
            <div className="breakdown-item__label">Practical</div>
            <div className="breakdown-item__value">{practicalPercent.toFixed(1)}%</div>
          </div>
          <div className="breakdown-item breakdown-item--mentoring">
            <div className="breakdown-item__label">Mentoring</div>
            <div className="breakdown-item__value">{mentoringPercent.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p className="footer__text">Data saved locally in your browser</p>
        <p className={`footer__saved ${saved ? 'footer__saved--visible' : ''}`}>
          ✓ Saved
        </p>
      </footer>
    </div>
  )
}
