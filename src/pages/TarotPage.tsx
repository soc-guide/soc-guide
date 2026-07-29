import { useMemo, useState } from "react";
import { EffectText } from "../components/EffectText";
import { Modal } from "../components/Modal";
import { MultiSelect } from "../components/MultiSelect";
import { Navigation } from "../components/Navigation";
import { TarotEmblem } from "../components/TarotEmblem";
import { purposeSymbols, slotSymbols, usageSymbols } from "../lib/symbols";
import type { TarotCatalogData, TarotItem } from "../types";
import "../styles/catalog.css";
import "../styles/effect-text.css";

export function TarotPage({ data }: { data: TarotCatalogData }) {
  const [name, setName] = useState("");
  const [usage, setUsage] = useState<Set<string>>(new Set());
  const [purposes, setPurposes] = useState<Set<string>>(new Set());
  const [slots, setSlots] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<TarotItem | null>(null);

  const visible = useMemo(() => {
    const query = name.trim().toLocaleLowerCase();
    const hasAny = (values: string[] | undefined, wanted: Set<string>) => !wanted.size || (values ?? []).some((value) => wanted.has(value));
    return [...data.items].filter((item) => (
      (!query || (item.name ?? "").toLocaleLowerCase().includes(query))
      && hasAny(item.usage, usage)
      && hasAny(item.purposes, purposes)
      && hasAny(item.slot4Types, slots)
    )).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [data.items, name, usage, purposes, slots]);

  return (
    <main className="catalog-screen">
      <div className="catalog-background" aria-hidden="true" />
      <header className="catalog-title-band"><h1>Tarot</h1></header>
      <Navigation current="tarot" />
      <section className="catalog-filter-bar" aria-label="Tarot filters">
        <label className="filter-field search-field"><span>Name</span><input type="search" autoComplete="off" placeholder="Search Tarot Whisper" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <MultiSelect label="Usage" fallbackLabel="All usage" options={data.usage.map((value) => ({ value, symbol: usageSymbols[value] ?? "◇" }))} selected={usage} onChange={setUsage} />
        <MultiSelect label="Purpose" fallbackLabel="All purposes" options={data.purposes.map((value) => ({ value, symbol: purposeSymbols[value] ?? "✦" }))} selected={purposes} onChange={setPurposes} />
        <MultiSelect label="4th slot" fallbackLabel="All 4th-slot types" options={data.slot4Types.map((value) => ({ value, symbol: slotSymbols[value] ?? "◆" }))} selected={slots} onChange={setSlots} />
      </section>
      <div className="catalog-status"><span className="catalog-count">{visible.length} of {data.items.length} Tarot Whispers</span></div>
      <section className="item-grid" aria-live="polite" aria-label="Tarot Whispers">
        {visible.map((item) => (
          <button className="item-card tarot-card" type="button" data-rarity="Legendary" key={item.id ?? item.slug ?? item.name} onClick={() => setSelected(item)}>
            <span className="item-icon-stage"><TarotEmblem item={item} /></span>
            <h2 className="item-name">{item.name}</h2>
            <span className="item-meta">
              {[...(item.purposes ?? []).map((value) => ({ value, symbol: purposeSymbols[value] ?? "✦" })), ...(item.usage ?? []).map((value) => ({ value, symbol: usageSymbols[value] ?? "◇" }))].slice(0, 3).map(({ value, symbol }) => <span className="meta-symbol" title={value} key={`${value}-${symbol}`}>{symbol}</span>)}
            </span>
          </button>
        ))}
      </section>
      {!visible.length && <p className="empty-state">No Tarot Whispers match the selected filters.</p>}
      <Modal open={Boolean(selected)} title={selected?.name ?? "Tarot"} kicker="Tarot Whisper" onClose={() => setSelected(null)} catalog>
        {selected && <TarotDetails item={selected} />}
      </Modal>
    </main>
  );
}

function TarotDetails({ item }: { item: TarotItem }) {
  const definitions = item.detailInfo ?? [];
  return (
    <div className="detail-layout">
      <aside className="detail-visual"><div className="detail-icon-wrap"><TarotEmblem item={item} compact /></div><span className="detail-rarity">{item.iconCode ?? "Tarot"}</span></aside>
      <div className="detail-content">
        <div className="detail-symbol-row">
          {(item.usage ?? []).map((value) => <span className="detail-chip" key={`u-${value}`}>{usageSymbols[value] ?? "◇"} {value}</span>)}
          {(item.purposes ?? []).map((value) => <span className="detail-chip" key={`p-${value}`}>{purposeSymbols[value] ?? "✦"} {value}</span>)}
          {(item.slot4Types ?? []).map((value) => <span className="detail-chip" key={`s-${value}`}>{slotSymbols[value] ?? "◆"} {value}</span>)}
        </div>
        <section className="detail-section"><h3>Tarot Whisper effect</h3><EffectText as="p" className="interactive-effect-copy" text={item.effect || "Data has not been added yet."} definitions={definitions} /></section>
        <section className="detail-section"><h3>4th-slot effect</h3><EffectText as="p" className="interactive-effect-copy" text={item.slot4Effect || "Data has not been added yet."} definitions={definitions} /></section>
        {item.recommendedFor && <section className="detail-section"><h3>Recommended for</h3><p className="pre-line">{item.recommendedFor}</p></section>}
      </div>
    </div>
  );
}
