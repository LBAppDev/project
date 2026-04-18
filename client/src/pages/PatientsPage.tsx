import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../lib/api';
import { formatAdmissionDateTime } from '../lib/patientAdmission';

interface PatientRow {
  id: number;
  firstName: string;
  lastName: string;
  bedNumber: string;
  admissionDate: string;
  dischargeDate: string;
  status: 'active' | 'discharged';
  lastEntry: string | null;
}

interface PatientsPageProps {
  status: 'active' | 'discharged';
}

export function PatientsPage({ status }: PatientsPageProps) {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<PatientRow[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const query = new URLSearchParams();
      query.set('status', status);
      if (search) {
        query.set('search', search);
      }

      apiRequest<PatientRow[]>(`/patients?${query.toString()}`, {}, token).then(setPatients).catch(console.error);
    }, 200);

    return () => clearTimeout(timeout);
  }, [search, status, token]);

  const title = status === 'discharged' ? t('patients.dischargedTitle') : t('patients.title');

  return (
    <section className="page-stack">
      <div className="section-heading page-heading-card">
        <div>
          <p className="eyebrow">{status === 'discharged' ? t('nav.dischargedPatients') : t('nav.patients')}</p>
          <h2>{title}</h2>
        </div>
        {user?.role !== 'doctor' && status === 'active' ? (
          <Link to="/patients/new" className="primary-button text-link-button">{t('patients.new')}</Link>
        ) : null}
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
                {status === 'discharged' ? (
                  <p className="muted">{t('patients.dischargeDate')}: {formatAdmissionDateTime(patient.dischargeDate)}</p>
                ) : null}
              </div>
              <div className="row-meta">
                <span className="meta-label">{formatAdmissionDateTime(patient.admissionDate)}</span>
                <span className="date-pill">{patient.lastEntry ?? '-'}</span>
              </div>
            </Link>
          )) : <p className="muted">{t('common.empty')}</p>}
        </div>
      </section>
    </section>
  );
}
