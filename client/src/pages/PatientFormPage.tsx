import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../lib/api';

const emptyPatient = {
  firstName: '',
  lastName: '',
  age: '',
  weight: '',
  medicalHistory: '',
  admissionDate: '',
  bedNumber: '',
};

export function PatientFormPage() {
  const { patientId } = useParams();
  const { token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyPatient);

  useEffect(() => {
    if (!patientId) {
      return;
    }

    apiRequest<{ patient: { firstName: string; lastName: string; age: number | null; weight: number | null; medicalHistory: string | null; admissionDate: string; bedNumber: string } }>(`/patients/${patientId}`, {}, token)
      .then((response) => {
        setForm({
          firstName: response.patient.firstName,
          lastName: response.patient.lastName,
          age: response.patient.age?.toString() ?? '',
          weight: response.patient.weight?.toString() ?? '',
          medicalHistory: response.patient.medicalHistory ?? '',
          admissionDate: response.patient.admissionDate,
          bedNumber: response.patient.bedNumber,
        });
      })
      .catch(console.error);
  }, [patientId, token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const isEdit = Boolean(patientId);
    const response = await apiRequest<{ id: number }>(isEdit ? `/patients/${patientId}` : '/patients', {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(form),
    }, token);
    navigate(`/patients/${response.id ?? patientId}`);
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t('patients.profile')}</p>
          <h2>{patientId ? t('patients.update') : t('patients.new')}</h2>
        </div>
      </div>

      <form className="panel-card form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t('patients.firstName')}</span>
          <input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} required />
        </label>
        <label className="field">
          <span>{t('patients.lastName')}</span>
          <input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} required />
        </label>
        <label className="field">
          <span>{t('patients.age')}</span>
          <input type="number" value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} />
        </label>
        <label className="field">
          <span>{t('patients.weight')}</span>
          <input type="number" step="0.1" value={form.weight} onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))} />
        </label>
        <label className="field">
          <span>{t('patients.admissionDate')}</span>
          <input type="date" value={form.admissionDate} onChange={(event) => setForm((current) => ({ ...current, admissionDate: event.target.value }))} required />
        </label>
        <label className="field">
          <span>{t('patients.bed')}</span>
          <input value={form.bedNumber} onChange={(event) => setForm((current) => ({ ...current, bedNumber: event.target.value }))} required />
        </label>
        <label className="field full">
          <span>{t('patients.history')}</span>
          <textarea rows={5} value={form.medicalHistory} onChange={(event) => setForm((current) => ({ ...current, medicalHistory: event.target.value }))} />
        </label>
        <div className="inline-actions">
          <button type="submit" className="primary-button">{patientId ? t('common.update') : t('common.create')}</button>
        </div>
      </form>
    </section>
  );
}
