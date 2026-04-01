import { useState, useEffect, useCallback } from 'react'
import { db, auth } from './firebase'
import { doc, onSnapshot, setDoc } from "firebase/firestore"
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth"

// ─── Helpers ───────────────────────────────────────────
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

const defaultState = {
  startDate: '2026-04-01',
  endDate: '2026-04-30',
  theory: { conducted: '', attended: '' },
  practical: { conducted: '', attended: '' },
  mentoring: { conducted: '', attended: '' },
}

// ─── App ───────────────────────────────────────────────
export default function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // Data State
  const [data, setData] = useState({ ...defaultState })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "trackers", user.uid);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "trackers", user.uid);
    const delayDebounceFn = setTimeout(async () => {
      try {
        await setDoc(docRef, data);
        setSaved(true);
        const timer = setTimeout(() => setSaved(false), 1500);
        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error saving to Firebase:", error);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [data, user]);

  // --- Handlers ---
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert(err.message.replace("Firebase: ", ""));
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Check your inbox.");
    } catch (err) {
      alert(err.message.replace("Firebase: ", ""));
    }
  };

  const updateDate = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateCategory = useCallback((category, field, value) => {
    const numVal = value === '' ? '' : Math.max(0, parseInt(value) || 0)
    setData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: numVal }
    }))
  }, [])

  const getNum = (val) => (val === '' || val === undefined) ? 0 : Number(val)

  if (loading) {
    return <div className="app-container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;
  }

  // --- AUTH UI ---
  if (!user) {
    return (
      <div className="app-container" style={{ maxWidth: '420px', marginTop: '80px' }}>
        <header className="header">
          <div className="header__icon">🔒</div>
          <h1 className="header__title">{authMode === 'login' ? 'Sign In' : 'Create Account'}</h1>
          <p className="header__subtitle">Access your attendance from any device</p>
        </header>

        <form onSubmit={handleAuth} className="category-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label className="input-group__label">University Email</label>
            <input type="email" className="input-group__field" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com" required />
          </div>
          <div className="input-group">
            <label className="input-group__label">Password</label>
            <input type="password" className="input-group__field" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {authMode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '-10px' }}>
              <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: '0.75rem', cursor: 'pointer', padding: '0' }}>
                Forgot Password?
              </button>
            </div>
          )}

          <button type="submit" className="category-card" style={{ background: 'var(--gradient-purple)', color: 'white', fontWeight: 'bold', cursor: 'pointer', border: 'none', padding: '15px' }}>
            {authMode === 'login' ? 'Sign In' : 'Register Now'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {authMode === 'login' ? "New here? " : "Already have an account? "}
            <span style={{ color: 'var(--accent-purple)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              {authMode === 'login' ? 'Create an account' : 'Sign in instead'}
            </span>
          </p>
        </form>
      </div>
    );
  }

  // --- TRACKER UI ---
  const theoryPercent = calcPercent(getNum(data.theory?.attended), getNum(data.theory?.conducted))
  const practicalPercent = calcPercent(getNum(data.practical?.attended), getNum(data.practical?.conducted))
  const mentoringPercent = calcPercent(getNum(data.mentoring?.attended), getNum(data.mentoring?.conducted))

  const totalConducted = getNum(data.theory?.conducted) + getNum(data.practical?.conducted) + getNum(data.mentoring?.conducted)
  const totalAttended = getNum(data.theory?.attended) + getNum(data.practical?.attended) + getNum(data.mentoring?.attended)
  const overallPercent = calcPercent(totalAttended, totalConducted)

  const overallStatus = getStatusInfo(overallPercent)
  const dateRange = `${formatDate(data.startDate)} – ${formatDate(data.endDate)}`

  const categories = [
    { key: 'theory', title: 'Theory Classes', icon: '📖', percent: theoryPercent },
    { key: 'practical', title: 'Practical / Lab', icon: '🧪', percent: practicalPercent },
    { key: 'mentoring', title: 'Mentoring', icon: '🎯', percent: mentoringPercent },
  ]

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={() => signOut(auth)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: '6px', fontSize: '0.75rem', padding: '6px 12px', cursor: 'pointer' }}>
          Logout: {user.email.split('@')[0]}
        </button>
      </div>

      <header className="header">
        <div className="header__icon">📊</div>
        <h1 className="header__title">Attendance Tracker</h1>
        <p className="header__subtitle">Real-time attendance dashboard for your semester</p>
      </header>

      <section className="date-range" id="date-range-section">
        <span className="date-range__label">From</span>
        <input type="date" className="date-range__input" value={data.startDate} onChange={e => updateDate('startDate', e.target.value)} />
        <span className="date-range__separator">→</span>
        <span className="date-range__label">To</span>
        <input type="date" className="date-range__input" value={data.endDate} onChange={e => updateDate('endDate', e.target.value)} />
      </section>

      <div className="cards-grid">
        {categories.map(cat => {
          const catData = data[cat.key] || { conducted: '', attended: '' };
          const statusInfo = getStatusInfo(cat.percent)
          return (
            <div key={cat.key} className={`category-card category-card--${cat.key}`}>
              <div className="category-card__header">
                <div className="category-card__title-group">
                  <div className="category-card__icon">{cat.icon}</div>
                  <div>
                    <div className="category-card__title">{cat.title}</div>
                    <div className="category-card__date">{dateRange}</div>
                  </div>
                </div>
                <div className="category-card__percentage">{cat.percent.toFixed(1)}%</div>
              </div>

              <div className="category-card__inputs">
                <div className="input-group">
                  <label className="input-group__label">Total Conducted</label>
                  <input type="number" className="input-group__field" value={catData.conducted} onChange={e => updateCategory(cat.key, 'conducted', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-group__label">Total Attended</label>
                  <input type="number" className="input-group__field" value={catData.attended} onChange={e => updateCategory(cat.key, 'attended', e.target.value)} />
                </div>
              </div>

              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${cat.percent}%` }} />
              </div>

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

      <div className="overall-card" id="overall-summary">
        <div className="overall-card__header">
          <div className="overall-card__label">Overall Attendance</div>
          <div className="overall-card__percentage">{overallPercent.toFixed(1)}%</div>
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

      <footer className="footer">
        <p className="footer__text">Connected to Google Cloud Firestore</p>
        <p className={`footer__saved ${saved ? 'footer__saved--visible' : ''}`}>✓ Saved Securely</p>
      </footer>
    </div>
  )
}