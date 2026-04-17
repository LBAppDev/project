import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../lib/api';

interface StatsResponse {
  nurses: number;
  patients: number;
  entriesToday: number;
  recentPatients: Array<{ id: number; firstName: string; lastName: string; bedNumber: string; updatedAt: string }>;
  recentEntries: Array<{ id: number; patientName: string; nurseName: string; entryDate: string; entryTime: string }>;
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    apiRequest<StatsResponse>('/dashboard/stats', {}, token).then(setStats).catch(console.error);
  }, [token]);

  return (
    <section className="page-stack">
      <div className="section-heading page-heading-card">
        <div>
          <p className="eyebrow">{user?.role === 'admin' ? t('dashboard.helloAdmin') : t('dashboard.helloNurse')}</p>
          <h2>{t('nav.dashboard')}</h2>
        </div>
        <p className="muted heading-note">{t('dashboard.quickNote')}</p>
      </div>

      <div className="stats-grid">
        <article className="stat-card stat-card-highlight">
          <span>{t('dashboard.nurses')}</span>
          <strong>{stats?.nurses ?? 0}</strong>
        </article>
        <article className="stat-card">
          <span>{t('dashboard.patients')}</span>
          <strong>{stats?.patients ?? 0}</strong>
        </article>
        <article className="stat-card">
          <span>{t('dashboard.entriesToday')}</span>
          <strong>{stats?.entriesToday ?? 0}</strong>
        </article>
      </div>

      <div className="two-column-grid">
        <section className="panel-card">
          <div className="panel-head">
            <h3>{t('dashboard.recentPatients')}</h3>
            <Link to="/patients" className="text-link">
              {t('nav.patients')}
            </Link>
          </div>
          <div className="list-stack">
            {stats?.recentPatients.length ? (
              stats.recentPatients.map((patient) => (
                <Link key={patient.id} className="list-row list-row-strong" to={`/patients/${patient.id}`}>
                  <div className="row-main">
                    <strong>{patient.lastName} {patient.firstName}</strong>
                    <p className="muted">{patient.bedNumber}</p>
                  </div>
                  <span className="date-pill">{patient.updatedAt.slice(0, 16).replace('T', ' ')}</span>
                </Link>
              ))
            ) : (
              <p className="muted">{t('common.empty')}</p>
            )}
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head">
            <h3>{t('dashboard.recentEntries')}</h3>
          </div>
          <div className="list-stack">
            {stats?.recentEntries.length ? (
              stats.recentEntries.map((entry) => (
                <Link key={entry.id} className="list-row list-row-strong" to={`/entries/${entry.id}`}>
                  <div className="row-main">
                    <strong>{entry.patientName}</strong>
                    <p className="muted">{entry.nurseName}</p>
                  </div>
                  <span className="date-pill">{entry.entryDate} {entry.entryTime}</span>
                </Link>
              ))
            ) : (
              <p className="muted">{t('common.empty')}</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
