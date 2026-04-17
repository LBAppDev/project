import { assessmentSchema, localizeText, type AssessmentValue, type Language } from '../data/assessmentSchema';

export interface ObservationAssessment {
  [sectionKey: string]: Record<string, AssessmentValue>;
}

export interface ObservationFieldDisplay {
  key: string;
  label: string;
  value: string;
}

export interface ObservationSectionDisplay {
  key: string;
  title: string;
  description: string;
  fields: ObservationFieldDisplay[];
}

export function getObservationSections(
  assessment: ObservationAssessment,
  language: Language,
  yesLabel: string,
  noLabel: string,
) {
  return assessmentSchema
    .map<ObservationSectionDisplay>((section) => {
      const values = assessment[section.key] ?? {};
      const fields = section.fields
        .filter((field) => isFieldVisible(field, values))
        .map((field) => ({
          key: field.key,
          label: localizeText(field.label, language),
          value: formatFieldValue(field, values[field.key], language, yesLabel, noLabel),
        }))
        .filter((field) => field.value !== '');

      return {
        key: section.key,
        title: localizeText(section.title, language),
        description: localizeText(section.description, language),
        fields,
      };
    })
    .filter((section) => section.fields.length > 0);
}

function isFieldVisible(
  field: (typeof assessmentSchema)[number]['fields'][number],
  values: Record<string, AssessmentValue>,
) {
  if (!field.dependsOn) {
    return true;
  }

  return values[field.dependsOn] === field.dependsValue;
}

function formatFieldValue(
  field: (typeof assessmentSchema)[number]['fields'][number],
  value: AssessmentValue | undefined,
  language: Language,
  yesLabel: string,
  noLabel: string,
) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '';
    }

    return value
      .map((selected) => field.options?.find((option) => option.value === selected))
      .filter(Boolean)
      .map((option) => localizeText(option!.label, language))
      .join(', ');
  }

  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (field.type === 'yesno') {
    return value === 'yes' ? yesLabel : noLabel;
  }

  if (field.type === 'single') {
    const option = field.options?.find((item) => item.value === value);
    return option ? localizeText(option.label, language) : String(value);
  }

  if (field.unit) {
    return `${String(value)} ${field.unit}`;
  }

  return String(value);
}

interface ExportLabels {
  observationTitle: string;
  patientLabel: string;
  bedLabel: string;
  admissionDateLabel: string;
  dateLabel: string;
  timeLabel: string;
  createdByLabel: string;
  updatedAtLabel: string;
  emptyLabel: string;
}

interface ExportParams {
  assessment: ObservationAssessment;
  patient: {
    firstName: string;
    lastName: string;
    bedNumber: string;
    admissionDate: string;
  };
  entry: {
    id: number;
    entryDate: string;
    entryTime: string;
    createdByName: string;
    updatedAt?: string;
  };
  language: Language;
  yesLabel: string;
  noLabel: string;
  labels: ExportLabels;
}

export function downloadObservationDocument(params: ExportParams) {
  const sections = getObservationSections(params.assessment, params.language, params.yesLabel, params.noLabel);
  const safeFileName = [
    'observation',
    params.patient.lastName,
    params.patient.firstName,
    params.entry.entryDate,
    params.entry.entryTime.replace(':', '-'),
  ]
    .join('-')
    .replace(/[^a-zA-Z0-9-_]/g, '_');

  const html = `<!doctype html>
<html lang="${params.language}" dir="${params.language === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(params.labels.observationTitle)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #2f241b; }
    h1, h2 { margin: 0 0 12px; }
    .meta { margin: 16px 0 24px; padding: 16px; border: 1px solid #d6c5ad; border-radius: 12px; background: #fffaf2; }
    .meta p { margin: 6px 0; }
    .section { margin: 0 0 18px; border: 1px solid #e2d5c1; border-radius: 12px; overflow: hidden; }
    .section-header { padding: 12px 16px; background: #f3e1c0; }
    .section-body { padding: 14px 16px; }
    .item { margin: 0 0 10px; }
    .label { font-weight: bold; display: block; margin-bottom: 2px; }
    .empty { color: #7a6855; font-style: italic; }
  </style>
</head>
<body>
  <h1>${escapeHtml(params.labels.observationTitle)}</h1>
  <div class="meta">
    <p><strong>${escapeHtml(params.labels.patientLabel)}:</strong> ${escapeHtml(`${params.patient.lastName} ${params.patient.firstName}`)}</p>
    <p><strong>${escapeHtml(params.labels.bedLabel)}:</strong> ${escapeHtml(params.patient.bedNumber)}</p>
    <p><strong>${escapeHtml(params.labels.admissionDateLabel)}:</strong> ${escapeHtml(params.patient.admissionDate)}</p>
    <p><strong>${escapeHtml(params.labels.dateLabel)}:</strong> ${escapeHtml(params.entry.entryDate)}</p>
    <p><strong>${escapeHtml(params.labels.timeLabel)}:</strong> ${escapeHtml(params.entry.entryTime)}</p>
    <p><strong>${escapeHtml(params.labels.createdByLabel)}:</strong> ${escapeHtml(params.entry.createdByName)}</p>
    <p><strong>${escapeHtml(params.labels.updatedAtLabel)}:</strong> ${escapeHtml(params.entry.updatedAt ?? '-')}</p>
  </div>
  ${sections.length > 0 ? sections
    .map(
      (section) => `
      <section class="section">
        <div class="section-header">
          <h2>${escapeHtml(section.title)}</h2>
        </div>
        <div class="section-body">
          ${section.fields
            .map(
              (field) => `
              <div class="item">
                <span class="label">${escapeHtml(field.label)}</span>
                <span>${escapeHtml(field.value)}</span>
              </div>`,
            )
            .join('')}
        </div>
      </section>`,
    )
    .join('') : `<p class="empty">${escapeHtml(params.labels.emptyLabel)}</p>`}
</body>
</html>`;

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeFileName}.doc`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
