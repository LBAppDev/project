import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../lib/api';

interface Nurse {
  id: number;
  fullName: string;
  username: string;
  role: 'nurse' | 'doctor';
  status: 'active' | 'inactive';
}

const blankForm = { id: 0, fullName: '', username: '', password: '', role: 'nurse' as 'nurse' | 'doctor', status: 'active' as 'active' | 'inactive' };

export function NursesPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState('');

  function loadNurses() {
    apiRequest<Nurse[]>('/nurses', {}, token).then(setNurses).catch(console.error);
  }

  useEffect(() => {
    loadNurses();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    try {
      if (form.id) {
        await apiRequest(`/nurses/${form.id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
      } else {
        await apiRequest('/nurses', { method: 'POST', body: JSON.stringify(form) }, token);
      }
      setForm(blankForm);
      loadNurses();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erreur');
    }
  }

  return (
    <section className="page-stack">
      <div className="section-heading page-heading-card">
        <div>
          <p className="eyebrow">{t('nav.nurses')}</p>
          <h2>{t('nurses.title')}</h2>
        </div>
      </div>

      <div className="two-column-grid">
        <section className="panel-card">
          <div className="panel-head">
            <h3>{t('nurses.addTitle')}</h3>
          </div>
          <form className="form-card elevated-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>{t('nurses.fullName')}</span>
              <input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
            </label>
            <label className="field">
              <span>{t('nurses.username')}</span>
              <input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} />
            </label>
            <label className="field">
              <span>{t('nurses.password')}</span>
              <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <label className="field">
              <span>{t('nurses.role')}</span>
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as 'nurse' | 'doctor' }))}>
                <option value="nurse">{t('nurses.nurseRole')}</option>
                <option value="doctor">{t('nurses.doctorRole')}</option>
              </select>
            </label>
            <label className="field">
              <span>{t('common.status')}</span>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))}>
                <option value="active">{t('nurses.active')}</option>
                <option value="inactive">{t('nurses.inactive')}</option>
              </select>
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <div className="inline-actions">
              <button type="submit" className="primary-button">{form.id ? t('common.update') : t('common.create')}</button>
              {form.id ? <button type="button" className="ghost-button" onClick={() => setForm(blankForm)}>{t('common.cancel')}</button> : null}
            </div>
          </form>
        </section>

        <section className="panel-card">
          <div className="table-like">
            {nurses.map((nurse) => (
              <article key={nurse.id} className="table-row">
                <div className="row-main">
                  <strong>{nurse.fullName}</strong>
                  <p className="muted">@{nurse.username} | {nurse.role === 'doctor' ? t('nurses.doctorRole') : t('nurses.nurseRole')}</p>
                </div>
                <div className="row-actions">
                  <span className={nurse.status === 'active' ? 'status-pill active' : 'status-pill inactive'}>
                    {nurse.status === 'active' ? t('nurses.active') : t('nurses.inactive')}
                  </span>
                  <button type="button" className="ghost-button" onClick={() => setForm({ ...nurse, password: '' })}>
                    {t('common.edit')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
