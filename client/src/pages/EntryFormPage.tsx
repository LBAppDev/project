import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AssessmentSection } from '../components/AssessmentSection';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { assessmentSchema, buildInitialAssessment, type AssessmentValue } from '../data/assessmentSchema';
import { apiRequest } from '../lib/api';

interface EntryResponse {
  id: number;
  patientId: number;
  entryDate: string;
  entryTime: string;
  assessment: Record<string, Record<string, AssessmentValue>>;
}

interface PatientResponse {
  patient: { id: number; firstName: string; lastName: string };
}

const current = new Date();

export function EntryFormPage() {
  const { patientId, entryId } = useParams();
  const { token, user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientResponse['patient'] | null>(null);
  const [entryDate, setEntryDate] = useState(current.toISOString().slice(0, 10));
  const [entryTime, setEntryTime] = useState(current.toTimeString().slice(0, 5));
  const [assessment, setAssessment] = useState(buildInitialAssessment());

  useEffect(() => {
    if (entryId) {
      apiRequest<EntryResponse>(`/entries/${entryId}`, {}, token)
        .then((entry) => {
          setEntryDate(entry.entryDate);
          setEntryTime(entry.entryTime);
          setAssessment({ ...buildInitialAssessment(), ...entry.assessment });
          return apiRequest<PatientResponse>(`/patients/${entry.patientId}`, {}, token);
        })
        .then((response) => setPatient(response.patient))
        .catch(console.error);
      return;
    }

    if (patientId) {
      apiRequest<PatientResponse>(`/patients/${patientId}`, {}, token).then((response) => setPatient(response.patient)).catch(console.error);
    }
  }, [entryId, patientId, token]);

  function updateField(sectionKey: string, fieldKey: string, value: AssessmentValue) {
    setAssessment((currentAssessment) => ({
      ...currentAssessment,
      [sectionKey]: {
        ...currentAssessment[sectionKey],
        [fieldKey]: value,
      },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = { entryDate, entryTime, assessment };

    if (entryId) {
      const response = await apiRequest<EntryResponse>(`/entries/${entryId}`, { method: 'PUT', body: JSON.stringify(payload) }, token);
      navigate(`/patients/${response.patientId}`);
      return;
    }

    await apiRequest(`/patients/${patientId}/entries`, { method: 'POST', body: JSON.stringify(payload) }, token);
    navigate(`/patients/${patientId}`);
  }

  async function handleDelete() {
    if (!entryId || !window.confirm(t('entry.deleteConfirm'))) {
      return;
    }
    const existing = await apiRequest<EntryResponse>(`/entries/${entryId}`, {}, token);
    await apiRequest(`/entries/${entryId}`, { method: 'DELETE' }, token);
    navigate(`/patients/${existing.patientId}`);
  }

  return (
    <form className="page-stack" onSubmit={handleSubmit}>
      <div className="section-heading page-heading-card">
        <div>
          <p className="eyebrow">{patient ? `${patient.lastName} ${patient.firstName}` : ''}</p>
          <h2>{entryId ? t('entry.editTitle') : t('entry.newTitle')}</h2>
        </div>
      </div>

      <section className="panel-card form-grid entry-meta-card">
        <label className="field">
          <span>{t('entry.date')}</span>
          <input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} required />
        </label>
        <label className="field">
          <span>{t('entry.time')}</span>
          <input type="time" value={entryTime} onChange={(event) => setEntryTime(event.target.value)} required />
        </label>
        <label className="field">
          <span>{t('entry.createdBy')}</span>
          <input value={user?.fullName ?? ''} readOnly />
        </label>
      </section>

      {assessmentSchema.map((section) => (
        <AssessmentSection
          key={section.key}
          section={section}
          values={assessment[section.key]}
          language={language}
          onChange={(fieldKey, value) => updateField(section.key, fieldKey, value)}
        />
      ))}

      <div className="inline-actions">
        <button type="submit" className="primary-button">{entryId ? t('common.update') : t('common.save')}</button>
        {entryId ? <button type="button" className="ghost-button danger" onClick={handleDelete}>{t('common.delete')}</button> : null}
      </div>
    </form>
  );
}
