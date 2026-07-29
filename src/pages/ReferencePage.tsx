import { useState } from "react";
import { Navigation } from "../components/Navigation";
import "../styles/reference.css";

type ReferenceSection = "faq" | "lore";

const FAQ_ITEMS = [
  {
    question: "What is this guide?",
    answer: "An unofficial Sword of Convallaria reference for browsing characters, skills, traits, equipment, Tarot Whispers, and planned loadouts in one place.",
  },
  {
    question: "How do I change a character loadout?",
    answer: "Open a character, select a Gear or Equipped Skills icon, then use the change control inside the detail window. Equipment level, gear stars, engraving slots, and Tarot stat slots are configured in the same window.",
  },
  {
    question: "Where are my selected items and skills saved?",
    answer: "Selections are stored in your current browser using local storage. They are guide-only loadouts and do not change anything in the game account.",
  },
  {
    question: "Why are some attributes or stat options empty?",
    answer: "The interface can display fields before their spreadsheet tables are complete. Missing values remain visibly unavailable instead of being guessed.",
  },
  {
    question: "How do the colored effect terms work?",
    answer: "Hover, focus, or click a colored bracketed term to read its shared definition. Clicking pins the tooltip until you click elsewhere or press Escape.",
  },
  {
    question: "How is signature equipment shown?",
    answer: "When a character record contains a matching signature item, that item is marked in the gear slot, detail window, and item picker, and is sorted near the top of compatible choices.",
  },
  {
    question: "Will the Lore section contain spoilers?",
    answer: "The timeline is prepared to group entries by era or chapter and support spoiler-aware sections once verified lore data is added.",
  },
] as const;

export function ReferencePage() {
  const [section, setSection] = useState<ReferenceSection>("faq");

  return (
    <main className="reference-screen">
      <div className="reference-background" aria-hidden="true" />
      <header className="reference-title-band">
        <div>
          <p>Guide reference</p>
          <h1>FAQ &amp; Lore</h1>
        </div>
      </header>

      <Navigation current={section} />

      <section className="reference-intro panel-paper">
        <div>
          <span className="reference-kicker">Guide archive</span>
          <h2>Answers now, chronology later</h2>
          <p>
            Use the FAQ for guide behavior and data notes. The Lore area provides the timeline structure that can be populated after the chronology is verified.
          </p>
        </div>
        <div className="reference-section-switch" role="tablist" aria-label="FAQ and lore sections">
          <button
            type="button"
            role="tab"
            aria-selected={section === "faq"}
            className={section === "faq" ? "active" : ""}
            onClick={() => setSection("faq")}
          >
            <span aria-hidden="true">?</span>
            FAQ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === "lore"}
            className={section === "lore" ? "active" : ""}
            onClick={() => setSection("lore")}
          >
            <span aria-hidden="true">⌛</span>
            Lore Timeline
          </button>
        </div>
      </section>

      {section === "faq" ? <FaqSection /> : <LoreSection />}
    </main>
  );
}

function FaqSection() {
  return (
    <section className="faq-section" role="tabpanel" aria-label="Frequently asked questions">
      <header className="reference-section-heading">
        <div>
          <span>Quick reference</span>
          <h2>Frequently Asked Questions</h2>
        </div>
        <p>{FAQ_ITEMS.length} guide notes</p>
      </header>
      <div className="faq-list">
        {FAQ_ITEMS.map((item, index) => (
          <details className="faq-item" key={item.question} open={index === 0}>
            <summary>
              <span className="faq-index">{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.question}</strong>
              <span className="faq-toggle" aria-hidden="true">+</span>
            </summary>
            <div className="faq-answer"><p>{item.answer}</p></div>
          </details>
        ))}
      </div>
    </section>
  );
}

function LoreSection() {
  return (
    <section className="lore-section" role="tabpanel" aria-label="Lore timeline">
      <header className="reference-section-heading">
        <div>
          <span>Chronology workspace</span>
          <h2>Lore Timeline</h2>
        </div>
        <p>Timeline data pending</p>
      </header>

      <div className="lore-layout">
        <div className="timeline-panel panel-paper">
          <div className="timeline-axis" aria-hidden="true" />
          <article className="timeline-empty-entry">
            <span className="timeline-marker" aria-hidden="true">✦</span>
            <div className="timeline-entry-copy">
              <span className="timeline-era">Timeline foundation</span>
              <h3>Chronology is ready for verified entries</h3>
              <p>
                No game-lore events are being invented here. Entries can be added after the source chronology is prepared and checked.
              </p>
            </div>
          </article>
        </div>

        <aside className="timeline-plan panel-paper">
          <span className="reference-kicker">Planned entry details</span>
          <h3>Each timeline event can contain</h3>
          <dl>
            <div><dt>When</dt><dd>Era, chapter, relative order, or confirmed date</dd></div>
            <div><dt>What</dt><dd>Event title and concise chronology summary</dd></div>
            <div><dt>Who</dt><dd>Related characters, factions, and locations</dd></div>
            <div><dt>Source</dt><dd>Story chapter, event, archive, or spreadsheet reference</dd></div>
            <div><dt>Spoilers</dt><dd>Collapsible chapter or era grouping when needed</dd></div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
