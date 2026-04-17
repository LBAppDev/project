import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function AppLayout() {
  const { logout, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const today = new Intl.DateTimeFormat(language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-GB' : 'fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const links = [
    { to: '/', label: t('nav.dashboard'), end: true },
    ...(user?.role === 'admin' ? [{ to: '/nurses', label: t('nav.nurses'), end: false }] : []),
    { to: '/patients', label: t('nav.patients'), end: true },
    { to: '/patients/new', label: t('nav.addPatient'), end: true },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-panel">
          <p className="eyebrow sidebar-eyebrow">{t('app.title')}</p>
          <h1>{t('app.subtitle')}</h1>
          <p className="sidebar-copy">{user?.role === 'admin' ? t('dashboard.helloAdmin') : t('dashboard.helloNurse')}</p>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
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
          <button type="button" className="ghost-button" onClick={logout}>
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-copy">
            <p className="eyebrow">{user?.role === 'admin' ? t('dashboard.helloAdmin') : t('dashboard.helloNurse')}</p>
            <strong>{user?.fullName}</strong>
          </div>
          <div className="topbar-meta">
            <span className="date-pill">{today}</span>
            <p className="muted">@{user?.username}</p>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
