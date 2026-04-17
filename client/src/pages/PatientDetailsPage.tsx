import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../lib/api';
import { downloadObservationDocument } from '../lib/observationDisplay';

interface Entry {
  id: number;
  entryDate: string;
  entryTime: string;
  createdByName: string;
  updatedAt: string;
  assessment: Record<string, Record<string, string | string[]>>;
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
  entries: Entry[];
}

type HistoryMode = 'day' | 'month' | 'year';

export function PatientDetailsPage() {
  const { patientId } = useParams();
  const { token } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<PatientResponse | null>(null);
  const [historyMode, setHistoryMode] = useState<HistoryMode>('day');

  function loadPatient() {
    if (!patientId) {
      return;
    }
    apiRequest<PatientResponse>(`/patients/${patientId}`, {}, token).then(setData).catch(console.error);
  }

  useEffect(() => {
    loadPatient();
  }, [patientId, token]);

  const dayGroups = useMemo(() => buildDayGroups(data?.entries ?? [], language), [data, language]);
  const monthGroups = useMemo(() => buildMonthGroups(data?.entries ?? [], language), [data, language]);
  const yearGroups = useMemo(() => buildYearGroups(data?.entries ?? [], language), [data, language]);

  async function handleDelete(entryId: number) {
    if (!window.confirm(t('entry.deleteConfirm'))) {
      return;
    }
    await apiRequest(`/entries/${entryId}`, { method: 'DELETE' }, token);
    loadPatient();
  }

  function handleExport(entry: Entry) {
    if (!data) {
      return;
    }

    downloadObservationDocument({
      assessment: entry.assessment,
      patient: data.patient,
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

  if (!data) {
    return <div className="page-loader">{t('common.loading')}</div>;
  }

  return (
    <section className="page-stack">
      <article className="patient-header-card">
        <div className="patient-header-main">
          <p className="eyebrow">{t('patients.profile')}</p>
          <h2>{data.patient.lastName} {data.patient.firstName}</h2>
          <div className="meta-badges">
            <span className="date-pill">{t('patients.bed')}: {data.patient.bedNumber}</span>
            <span className="date-pill">{t('patients.admissionDate')}: {data.patient.admissionDate}</span>
          </div>
        </div>
        <div className="inline-actions">
          <Link className="ghost-button text-link-button" to={`/patients/${data.patient.id}/edit`}>{t('patients.update')}</Link>
          <Link className="primary-button text-link-button" to={`/patients/${data.patient.id}/entries/new`}>{t('patients.newEntry')}</Link>
        </div>
      </article>

      <section className="panel-card">
        <div className="data-grid detail-stats-grid">
          <div className="detail-stat">
            <strong>{t('patients.age')}</strong>
            <p>{data.patient.age ?? '-'}</p>
          </div>
          <div className="detail-stat">
            <strong>{t('patients.weight')}</strong>
            <p>{data.patient.weight ?? '-'}</p>
          </div>
          <div className="full detail-stat detail-notes">
            <strong>{t('patients.history')}</strong>
            <p>{data.patient.medicalHistory || '-'}</p>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-head panel-head-wrap">
          <div>
            <h3>{t('patients.groupedHistory')}</h3>
            <p className="muted">{t('patients.historyHint')}</p>
          </div>
          <div className="history-mode-switcher">
            <button
              type="button"
              className={historyMode === 'day' ? 'chip active' : 'chip'}
              onClick={() => setHistoryMode('day')}
            >
              {t('patients.byDay')}
            </button>
            <button
              type="button"
              className={historyMode === 'month' ? 'chip active' : 'chip'}
              onClick={() => setHistoryMode('month')}
            >
              {t('patients.byMonth')}
            </button>
            <button
              type="button"
              className={historyMode === 'year' ? 'chip active' : 'chip'}
              onClick={() => setHistoryMode('year')}
            >
              {t('patients.byYear')}
            </button>
          </div>
        </div>

        {data.entries.length ? (
          <div className="archive-stack">
            {historyMode === 'day' ? (
              dayGroups.map((group, index) => (
                <details key={group.key} className="archive-group archive-day" open={index === 0}>
                  <summary>
                    <span>{group.label}</span>
                    <strong>{group.entries.length}</strong>
                  </summary>
                  <div className="archive-body">
                    {group.entries.map((entry) => renderEntryRow(entry, navigate, handleExport, handleDelete, t))}
                  </div>
                </details>
              ))
            ) : null}

            {historyMode === 'month' ? (
              monthGroups.map((month, monthIndex) => (
                <details key={month.key} className="archive-group archive-month" open={monthIndex === 0}>
                  <summary>
                    <span>{month.label}</span>
                    <strong>{month.days.reduce((sum, day) => sum + day.entries.length, 0)}</strong>
                  </summary>
                  <div className="archive-body nested-archive-body">
                    {month.days.map((day, dayIndex) => (
                      <details key={day.key} className="archive-group archive-day nested-group" open={dayIndex === 0}>
                        <summary>
                          <span>{day.label}</span>
                          <strong>{day.entries.length}</strong>
                        </summary>
                        <div className="archive-body">
                          {day.entries.map((entry) => renderEntryRow(entry, navigate, handleExport, handleDelete, t))}
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))
            ) : null}

            {historyMode === 'year' ? (
              yearGroups.map((year, yearIndex) => (
                <details key={year.key} className="archive-group archive-year" open={yearIndex === 0}>
                  <summary>
                    <span>{year.label}</span>
                    <strong>{year.months.reduce((sum, month) => sum + month.days.reduce((daySum, day) => daySum + day.entries.length, 0), 0)}</strong>
                  </summary>
                  <div className="archive-body nested-archive-body">
                    {year.months.map((month, monthIndex) => (
                      <details key={month.key} className="archive-group archive-month nested-group" open={monthIndex === 0}>
                        <summary>
                          <span>{month.label}</span>
                          <strong>{month.days.reduce((sum, day) => sum + day.entries.length, 0)}</strong>
                        </summary>
                        <div className="archive-body nested-archive-body">
                          {month.days.map((day, dayIndex) => (
                            <details key={day.key} className="archive-group archive-day nested-group" open={dayIndex === 0}>
                              <summary>
                                <span>{day.label}</span>
                                <strong>{day.entries.length}</strong>
                              </summary>
                              <div className="archive-body">
                                {day.entries.map((entry) => renderEntryRow(entry, navigate, handleExport, handleDelete, t))}
                              </div>
                            </details>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))
            ) : null}
          </div>
        ) : (
          <p className="muted">{t('patients.noEntries')}</p>
        )}
      </section>
    </section>
  );
}

function renderEntryRow(
  entry: Entry,
  navigate: ReturnType<typeof useNavigate>,
  handleExport: (entry: Entry) => void,
  handleDelete: (entryId: number) => void,
  t: (key: string) => string,
) {
  return (
    <div key={entry.id} className="entry-row-card">
      <div className="row-main">
        <strong>{entry.entryTime} | {entry.createdByName}</strong>
        <p className="muted">{t('entry.summary')}: {countFilledFields(entry.assessment)} {t('entry.filledFields')}</p>
      </div>
      <div className="row-actions">
        <button type="button" className="ghost-button" onClick={() => navigate(`/entries/${entry.id}`)}>
          {t('common.view')}
        </button>
        <button type="button" className="ghost-button" onClick={() => handleExport(entry)}>
          {t('common.export')}
        </button>
        <button type="button" className="ghost-button" onClick={() => navigate(`/entries/${entry.id}/edit`)}>
          {t('common.edit')}
        </button>
        <button type="button" className="ghost-button danger" onClick={() => handleDelete(entry.id)}>
          {t('common.delete')}
        </button>
      </div>
    </div>
  );
}

function buildDayGroups(entries: Entry[], language: string) {
  const dayMap = new Map<string, Entry[]>();

  for (const entry of entries) {
    const bucket = dayMap.get(entry.entryDate) ?? [];
    bucket.push(entry);
    dayMap.set(entry.entryDate, bucket);
  }

  return Array.from(dayMap.entries()).map(([date, dayEntries]) => ({
    key: date,
    label: formatDayLabel(date, language),
    entries: dayEntries,
  }));
}

function buildMonthGroups(entries: Entry[], language: string) {
  const monthMap = new Map<string, Entry[]>();

  for (const entry of entries) {
    const monthKey = entry.entryDate.slice(0, 7);
    const bucket = monthMap.get(monthKey) ?? [];
    bucket.push(entry);
    monthMap.set(monthKey, bucket);
  }

  return Array.from(monthMap.entries()).map(([monthKey, monthEntries]) => ({
    key: monthKey,
    label: formatMonthLabel(monthKey, language),
    days: buildDayGroups(monthEntries, language),
  }));
}

function buildYearGroups(entries: Entry[], language: string) {
  const yearMap = new Map<string, Entry[]>();

  for (const entry of entries) {
    const yearKey = entry.entryDate.slice(0, 4);
    const bucket = yearMap.get(yearKey) ?? [];
    bucket.push(entry);
    yearMap.set(yearKey, bucket);
  }

  return Array.from(yearMap.entries()).map(([yearKey, yearEntries]) => ({
    key: yearKey,
    label: yearKey,
    months: buildMonthGroups(yearEntries, language),
  }));
}

function formatDayLabel(date: string, language: string) {
  return new Intl.DateTimeFormat(resolveLocale(language), {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

function formatMonthLabel(monthKey: string, language: string) {
  return new Intl.DateTimeFormat(resolveLocale(language), {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${monthKey}-01T12:00:00`));
}

function resolveLocale(language: string) {
  if (language === 'ar') {
    return 'ar-DZ';
  }

  if (language === 'en') {
    return 'en-GB';
  }

  return 'fr-FR';
}

function countFilledFields(assessment: Record<string, Record<string, string | string[]>>) {
  return Object.values(assessment).reduce((sum, section) => {
    return sum + Object.values(section).filter((value) => (Array.isArray(value) ? value.length > 0 : value !== '')).length;
  }, 0);
}
