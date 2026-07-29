import { useMemo, useState } from "react";
import { EffectText } from "../components/EffectText";
import { traitDisplaySegments } from "../lib/traitDiff";
import type { Trait } from "../types";

export function TraitViewer({ trait }: { trait: Trait }) {
  const levels = [...(trait.levels ?? [])]
    .filter((level) => level.description)
    .sort((a, b) => a.stars - b.stars);
  const initial = levels.find((level) => level.stars === trait.stars)?.stars ?? levels.at(-1)?.stars ?? 1;
  const [selectedStars, setSelectedStars] = useState(initial);
  const selectedIndex = Math.max(0, levels.findIndex((level) => level.stars === selectedStars));
  const selected = levels[selectedIndex];
  const previous = selectedIndex > 0 ? levels[selectedIndex - 1] : null;
  const definitions = trait.detailInfo ?? [];
  const segments = useMemo(
    () => selected ? traitDisplaySegments(previous?.description ?? "", selected.description) : [],
    [selected, previous],
  );
  const hasChanges = segments.some((segment) => segment.changed);

  if (!trait.available || !levels.length || !selected) {
    return <p className="empty-detail">Trait data has not been added to the spreadsheet yet.</p>;
  }

  return (
    <section className="trait-compact-shell">
      <div className="trait-compact-toolbar trait-selector-only-toolbar">
        <div className="trait-compact-selector-group">
          <span className="trait-compact-selector-label">Select star level</span>
          <div className="trait-star-selector trait-star-selector-horizontal" role="tablist" aria-label="Trait star level">
            {levels.map((level) => (
              <button
                key={level.stars}
                type="button"
                role="tab"
                aria-selected={selectedStars === level.stars}
                className={`trait-star-option trait-star-option-horizontal ${selectedStars === level.stars ? "selected" : ""}`}
                onClick={() => setSelectedStars(level.stars)}
              >
                {level.stars}★
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="trait-modal-content trait-modal-content-compact" role="tabpanel">
        <article className="trait-reader-card trait-reader-card-single">
          <header className="trait-reader-main-header">
            <strong>{selected.stars}★ Effect</strong>
            <span>{previous ? `Changes from ${previous.stars}★ are highlighted` : "Base trait effect"}</span>
          </header>

          <div className="trait-single-effect-scroll">
            <div className="trait-highlighted-copy" aria-label={`${selected.stars} star trait effect`}>
              {segments.map((segment, index) => segment.changed ? (
                <mark className="trait-inline-change" key={`${index}-${segment.text}`} title={`Changed at ${selected.stars}★`}>
                  <EffectText text={segment.text} definitions={definitions} />
                </mark>
              ) : (
                <EffectText key={`${index}-${segment.text}`} text={segment.text} definitions={definitions} />
              ))}
            </div>
            {previous && !hasChanges && (
              <p className="trait-no-change-note">No wording change is recorded between {previous.stars}★ and {selected.stars}★.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
