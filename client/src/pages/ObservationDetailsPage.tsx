import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ObservationSectionCard } from '../components/ObservationSectionCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { type AssessmentValue } from '../data/assessmentSchema';
import { apiRequest } from '../lib/api';
import { downloadObservationDocument, getObservationSections } from '../lib/observationDisplay';

interface EntryResponse {
  id: number;
  patientId: number;
  entryDate: string;
  entryTime: string;
  assessment: Record<string, Record<string, AssessmentValue>>;
  createdByName: string;
  updatedAt: string;
}

interface PatientResponse {
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    age: number | null;
    weight: number | null;
    medicalHistory: string | null;
    admissionDate: string;
    bedNumber: string;
  };
}

export function ObservationDetailsPage() {
  const { entryId } = useParams();
  const { token } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<EntryResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse['patient'] | null>(null);

  useEffect(() => {
    if (!entryId) {
      return;
    }

    apiRequest<EntryResponse>(`/entries/${entryId}`, {}, token)
      .then((entryResponse) => {
        setEntry(entryResponse);
        return apiRequest<PatientResponse>(`/patients/${entryResponse.patientId}`, {}, token);
      })
      .then((patientResponse) => setPatient(patientResponse.patient))
      .catch(console.error);
  }, [entryId, token]);

  const sections = useMemo(() => {
    if (!entry) {
      return [];
    }

    return getObservationSections(entry.assessment, language, t('common.yes'), t('common.no'));
  }, [entry, language, t]);

  function handleExport() {
    if (!entry || !patient) {
      return;
    }

    downloadObservationDocument({
      assessment: entry.assessment,
      patient,
      entry,
      language,
      yesLabel: t('common.yes'),
      noLabel: t('common.no'),
      labels: {
        observationTitle: t('entry.detailsTitle'),
        patientLabel: t('entry.patient'),
        bedLabel: t('patients.bed'),
        admissionDateLabel: t('patients.admissionDate'),
        dateLabel: t('entry.date'),
        timeLabel: t('entry.time'),
        createdByLabel: t('entry.createdBy'),
        updatedAtLabel: t('entry.updatedAt'),
        emptyLabel: t('entry.noDetails'),
      },
    });
  }

  if (!entry || !patient) {
    return <div className="page-loader">{t('common.loading')}</div>;
  }

  return (
    <section className="page-stack">
      <div className="section-heading page-heading-card">
        <div>
          <p className="eyebrow">{`${patient.lastName} ${patient.firstName}`}</p>
          <h2>{t('entry.detailsTitle')}</h2>
        </div>
        <div className="inline-actions">
          <button type="button" className="ghost-button" onClick={() => navigate(`/patients/${patient.id}`)}>
            {t('common.back')}
          </button>
          <button type="button" className="ghost-button" onClick={handleExport}>
            {t('common.export')}
          </button>
          <Link className="primary-button text-link-button" to={`/entries/${entry.id}/edit`}>
            {t('common.edit')}
          </Link>
        </div>
      </div>

      <section className="panel-card">
        <div className="observation-summary-grid">
          <article className="detail-stat">
            <span className="observation-label">{t('entry.patient')}</span>
            <strong>{patient.lastName} {patient.firstName}</strong>
          </article>
          <article className="detail-stat">
            <span className="observation-label">{t('entry.date')}</span>
            <strong>{entry.entryDate}</strong>
          </article>
          <article className="detail-stat">
            <span className="observation-label">{t('entry.time')}</span>
            <strong>{entry.entryTime}</strong>
          </article>
          <article className="detail-stat">
            <span className="observation-label">{t('entry.createdBy')}</span>
            <strong>{entry.createdByName}</strong>
          </article>
          <article className="detail-stat">
            <span className="observation-label">{t('patients.bed')}</span>
            <strong>{patient.bedNumber}</strong>
          </article>
          <article className="detail-stat">
            <span className="observation-label">{t('entry.updatedAt')}</span>
            <strong>{entry.updatedAt.slice(0, 16).replace('T', ' ')}</strong>
          </article>
        </div>
      </section>

      {sections.length ? (
        sections.map((section) => <ObservationSectionCard key={section.key} section={section} />)
      ) : (
        <section className="panel-card">
          <p className="muted">{t('entry.noDetails')}</p>
        </section>
      )}
    </section>
  );
}
