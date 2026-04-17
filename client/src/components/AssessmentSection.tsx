import { useLanguage } from '../context/LanguageContext';
import { localizeText, type AssessmentValue, type FieldSchema, type Language, type SectionSchema } from '../data/assessmentSchema';

interface AssessmentSectionProps {
  section: SectionSchema;
  values: Record<string, AssessmentValue>;
  language: Language;
  onChange: (fieldKey: string, value: AssessmentValue) => void;
}

export function AssessmentSection({ section, values, language, onChange }: AssessmentSectionProps) {
  const { t } = useLanguage();

  return (
    <details className="section-card" open>
      <summary>
        <div>
          <h3>{localizeText(section.title, language)}</h3>
          <p>{localizeText(section.description, language)}</p>
        </div>
      </summary>
      <div className="section-grid">
        {section.fields.map((field) => {
          if (field.dependsOn && values[field.dependsOn] !== field.dependsValue) {
            return null;
          }

          return (
            <label key={field.key} className={field.type === 'textarea' || field.type === 'multi' ? 'field full' : 'field'}>
              <span>
                {localizeText(field.label, language)}
                {field.unit ? <strong className="unit-tag">{field.unit}</strong> : null}
              </span>
              <FieldControl
                field={field}
                value={values[field.key]}
                language={language}
                onChange={(value) => onChange(field.key, value)}
                yesLabel={t('common.yes')}
                noLabel={t('common.no')}
              />
            </label>
          );
        })}
      </div>
    </details>
  );
}

interface FieldControlProps {
  field: FieldSchema;
  value: AssessmentValue;
  language: Language;
  onChange: (value: AssessmentValue) => void;
  yesLabel: string;
  noLabel: string;
}

function FieldControl({ field, value, language, onChange, yesLabel, noLabel }: FieldControlProps) {
  if (field.type === 'textarea') {
    return <textarea rows={4} value={String(value)} onChange={(event) => onChange(event.target.value)} />;
  }

  if (field.type === 'text' || field.type === 'number') {
    return <input type={field.type} value={String(value)} onChange={(event) => onChange(event.target.value)} />;
  }

  if (field.type === 'yesno') {
    return (
      <div className="choice-row">
        {[
          { value: 'yes', label: yesLabel },
          { value: 'no', label: noLabel },
        ].map((option) => (
          <label key={option.value} className={value === option.value ? 'choice-pill active' : 'choice-pill'}>
            <input
              type="radio"
              name={field.key}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (field.type === 'single') {
    return (
      <select value={String(value)} onChange={(event) => onChange(event.target.value)}>
        <option value="">--</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {localizeText(option.label, language)}
          </option>
        ))}
      </select>
    );
  }

  const selected = Array.isArray(value) ? value : [];
  return (
    <div className="checkbox-grid">
      {field.options?.map((option) => {
        const isChecked = selected.includes(option.value);
        return (
          <label key={option.value} className={isChecked ? 'check-chip active' : 'check-chip'}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() =>
                onChange(isChecked ? selected.filter((item) => item !== option.value) : [...selected, option.value])
              }
            />
            <span>{localizeText(option.label, language)}</span>
          </label>
        );
      })}
    </div>
  );
}
