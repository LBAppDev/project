import type { ObservationSectionDisplay } from '../lib/observationDisplay';

interface ObservationSectionCardProps {
  section: ObservationSectionDisplay;
}

export function ObservationSectionCard({ section }: ObservationSectionCardProps) {
  return (
    <section className="panel-card observation-card">
      <div className="panel-head observation-card-head">
        <div>
          <h3>{section.title}</h3>
          <p className="muted">{section.description}</p>
        </div>
      </div>
      <div className="observation-grid">
        {section.fields.map((field) => (
          <article key={field.key} className="observation-item">
            <span className="observation-label">{field.label}</span>
            <strong>{field.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
