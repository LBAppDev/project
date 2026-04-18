import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function LoginPage() {
  const { login, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(username, password);
      const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
      navigate(nextPath, { replace: true });
    } catch (_error) {
      setError(t('auth.invalid'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-panel">
        <div className="login-showcase">
          <div className="language-switcher">
            {(['fr', 'en', 'ar'] as const).map((code) => (
              <button
                key={code}
                type="button"
                className={language === code ? 'chip active' : 'chip'}
                onClick={() => setLanguage(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="hero-copy">
            <p className="eyebrow">{t('app.title')}</p>
            <h1>{t('auth.signIn')}</h1>
            <p>{t('app.subtitle')}</p>
          </div>

          <div className="login-metric-grid">
            <div className="mini-stat-card">
              <span>24/7</span>
              <strong>Logs</strong>
            </div>
            <div className="mini-stat-card">
              <span>FR / EN / AR</span>
              <strong>UI</strong>
            </div>
          </div>

          <div className="info-card credential-card">
            <h2>{t('auth.demoTitle')}</h2>
            <div className="credential-line">
              <span className="role-badge">Admin</span>
              <p>{t('auth.admin')}</p>
            </div>
            <div className="credential-line">
              <span className="role-badge">Nurse</span>
              <p>{t('auth.nurse')}</p>
            </div>
            <div className="credential-line">
              <span className="role-badge">Doctor</span>
              <p>{t('auth.doctor')}</p>
            </div>
          </div>
        </div>

        <form className="form-card login-form-card" onSubmit={handleSubmit}>
          <div className="form-card-head">
            <p className="eyebrow">{t('auth.signIn')}</p>
            <h2>{t('app.title')}</h2>
          </div>
          <label className="field">
            <span>{t('auth.username')}</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="field">
            <span>{t('auth.password')}</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="primary-button" disabled={submitting}>
            {t('auth.signIn')}
          </button>
        </form>
      </section>
    </div>
  );
}
