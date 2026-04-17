import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../lib/api';

interface PatientRow {
  id: number;
  firstName: string;
  lastName: string;
  bedNumber: string;
  admissionDate: string;
  lastEntry: string | null;
}

export function PatientsPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<PatientRow[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      apiRequest<PatientRow[]>(`/patients${query}`, {}, token).then(setPatients).catch(console.error);
    }, 200);

    return () => clearTimeout(timeout);
  }, [search, token]);

  return (
    <section className="page-stack">
      <div className="section-heading page-heading-card">
        <div>
          <p className="eyebrow">{t('nav.patients')}</p>
          <h2>{t('patients.title')}</h2>
        </div>
        <Link to="/patients/new" className="primary-button text-link-button">{t('patients.new')}</Link>
      </div>

      <section className="panel-card search-panel">
        <label className="field search-field">
          <span>{t('common.search')}</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} />
          <small className="search-hint">{t('patients.searchHint')}</small>
        </label>
      </section>

      <section className="panel-card">
        <div className="table-like">
          {patients.length ? patients.map((patient) => (
            <Link key={patient.id} className="table-row linked-row" to={`/patients/${patient.id}`}>
              <div className="row-main">
                <strong>{patient.lastName} {patient.firstName}</strong>
                <p className="muted">{t('patients.bed')}: {patient.bedNumber}</p>
              </div>
              <div className="row-meta">
                <span className="meta-label">{patient.admissionDate}</span>
                <span className="date-pill">{patient.lastEntry ?? '-'}</span>
              </div>
            </Link>
          )) : <p className="muted">{t('common.empty')}</p>}
        </div>
      </section>
    </section>
  );
}
