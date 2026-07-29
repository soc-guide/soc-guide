import { Navigation } from "../components/Navigation";
import "../styles/reference.css";

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

export function FaqPage() {
  return (
    <main className="reference-screen faq-screen">
      <div className="reference-background" aria-hidden="true" />
      <header className="reference-title-band">
        <div>
          <p>Guide help</p>
          <h1>FAQ</h1>
        </div>
      </header>

      <Navigation current="faq" />

      <section className="reference-intro panel-paper">
        <div>
          <span className="reference-kicker">New-player reference</span>
          <h2>Frequently Asked Questions</h2>
          <p>
            The current guide and loadout questions stay here. Pull advice, recommended units, account progression, and other beginner topics can be added later.
          </p>
        </div>
      </section>

      <section className="faq-section" aria-label="Frequently asked questions">
        <header className="reference-section-heading">
          <div>
            <span>Quick reference</span>
            <h2>Guide Questions</h2>
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
    </main>
  );
}
