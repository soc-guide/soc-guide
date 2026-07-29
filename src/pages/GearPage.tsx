import { useMemo, useState } from "react";
import { EffectText } from "../components/EffectText";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { Modal } from "../components/Modal";
import { MultiSelect } from "../components/MultiSelect";
import { Navigation } from "../components/Navigation";
import { categorySymbols, rarityOrder, raritySymbols, weaponSymbols } from "../lib/symbols";
import type { GearCatalogData, GearItem } from "../types";
import "../styles/catalog.css";
import "../styles/effect-text.css";

export function GearPage({ data }: { data: GearCatalogData }) {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [weapons, setWeapons] = useState<Set<string>>(new Set());
  const [rarities, setRarities] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<GearItem | null>(null);

  const visible = useMemo(() => {
    const query = name.trim().toLocaleLowerCase();
    return [...data.items]
      .filter((item) => (
        (!query || (item.name ?? "").toLocaleLowerCase().includes(query))
        && (!categories.size || (item.category ? categories.has(item.category) : false))
        && (!weapons.size || (item.weaponType ? weapons.has(item.weaponType) : false))
        && (!rarities.size || (item.rarity ? rarities.has(item.rarity) : false))
      ))
      .sort((a, b) => (rarityOrder[a.rarity ?? "Unknown"] ?? 9) - (rarityOrder[b.rarity ?? "Unknown"] ?? 9) || (a.name ?? "").localeCompare(b.name ?? ""));
  }, [data.items, name, categories, weapons, rarities]);

  return (
    <main className="catalog-screen">
      <div className="catalog-background" aria-hidden="true" />
      <header className="catalog-title-band"><h1>Gear</h1></header>
      <Navigation current="gear" />
      <section className="catalog-filter-bar" aria-label="Gear filters">
        <label className="filter-field search-field"><span>Name</span><input type="search" autoComplete="off" placeholder="Search weapon or trinket" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <MultiSelect label="Item type" fallbackLabel="All item types" options={data.categories.map((value) => ({ value, symbol: categorySymbols[value] ?? "◇" }))} selected={categories} onChange={setCategories} />
        <MultiSelect label="Weapon type" fallbackLabel="All weapon types" options={data.weaponTypes.map((value) => ({ value, symbol: weaponSymbols[value] ?? "◇" }))} selected={weapons} onChange={setWeapons} />
        <MultiSelect label="Rarity" fallbackLabel="All rarities" options={data.rarities.map((value) => ({ value, symbol: raritySymbols[value] ?? "◇" }))} selected={rarities} onChange={setRarities} />
      </section>
      <div className="catalog-status"><span className="catalog-count">{visible.length} of {data.items.length} gear items</span></div>
      <section className="item-grid" aria-live="polite" aria-label="Weapons and trinkets">
        {visible.map((item) => <GearCard item={item} key={item.id ?? item.slug ?? item.name} onClick={() => setSelected(item)} />)}
      </section>
      {!visible.length && <p className="empty-state">No gear matches the selected filters.</p>}
      <Modal open={Boolean(selected)} title={selected?.name ?? "Gear"} kicker={selected?.category === "TRINKET" ? "Trinket" : "Weapon"} onClose={() => setSelected(null)} catalog>
        {selected && <GearDetails item={selected} />}
      </Modal>
    </main>
  );
}

function GearCard({ item, onClick }: { item: GearItem; onClick: () => void }) {
  return (
    <button className="item-card" type="button" onClick={onClick} aria-label={`Open ${item.name ?? "gear"} details`} data-rarity={item.rarity}>
      <span className="item-badges">
        <span className="symbol-badge category-badge">{categorySymbols[item.category ?? ""] ?? "◇"}</span>
        {item.isSignature && <span className="symbol-badge signature-badge">✦</span>}
      </span>
      <span className="item-icon-stage"><span className="item-icon-wrap"><ImageWithFallback src={item.icon} alt={`${item.name ?? "Gear"} icon`} label={item.name ?? "Gear"} /></span></span>
      <h2 className="item-name">{item.name}</h2>
      <span className="item-meta">
        <span className="meta-symbol" title={item.rarity}>{raritySymbols[item.rarity ?? "Unknown"] ?? "◇"}</span>
        {item.weaponType && <span className="meta-symbol" title={item.weaponType}>{weaponSymbols[item.weaponType] ?? "◇"}</span>}
      </span>
    </button>
  );
}

function GearDetails({ item }: { item: GearItem }) {
  const [stars, setStars] = useState(1);
  const level = item.levels?.find((entry) => entry.stars === stars) ?? item.levels?.[0];
  const definitions = [...(item.detailInfo ?? []), ...(level?.detailInfo ?? [])];
  const stats = Object.entries(item.maxStats ?? {}).filter(([, value]) => value !== null && value !== undefined);
  return (
    <div className="detail-layout">
      <aside className="detail-visual">
        <div className="detail-icon-wrap"><ImageWithFallback src={item.icon} alt={`${item.name ?? "Gear"} icon`} label={item.name ?? "Gear"} /></div>
        <span className="detail-rarity">{raritySymbols[item.rarity ?? "Unknown"] ?? "◇"} {item.rarity}</span>
      </aside>
      <div className="detail-content">
        <div className="detail-symbol-row">
          <span className="detail-chip">{categorySymbols[item.category ?? ""] ?? "◇"} {item.category === "TRINKET" ? "Trinket" : "Weapon"}</span>
          {item.weaponType && <span className="detail-chip">{weaponSymbols[item.weaponType] ?? "◇"} {item.weaponType}</span>}
          {item.isSignature && <span className="detail-chip">✦ Signature</span>}
        </div>
        <section className="detail-section effect-level-panel">
          <h3>Gear effect</h3>
          <div className="level-selector" aria-label="Gear star level">
            {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={stars === value ? "selected" : ""} onClick={() => setStars(value)}>{value}★</button>)}
          </div>
          <EffectText as="p" className="interactive-effect-copy pre-line" text={level?.effect || "Effect data has not been added yet."} definitions={definitions} />
        </section>
        {stats.length > 0 && <section className="detail-section"><h3>Maximum attributes</h3><div className="detail-stat-grid">{stats.map(([key, value]) => <span className="detail-chip" key={key}>{key} {value}</span>)}</div></section>}
        {item.lore && <section className="detail-section"><h3>Lore</h3><p>{item.lore}</p></section>}
      </div>
    </div>
  );
}
