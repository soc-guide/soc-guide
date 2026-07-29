import { useEffect, useMemo, useState } from "react";
import { EffectText } from "../components/EffectText";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { TarotEmblem } from "../components/TarotEmblem";
import { gearSymbols } from "../lib/symbols";
import { normalized } from "../lib/text";
import type {
  CharacterDetail,
  GearCatalogData,
  GearItem,
  LoadoutStatOption,
  LoadoutStatValue,
  TarotCatalogData,
  TarotItem,
} from "../types";

export type GearSlot = "weapon" | "trinket" | "tarot";

interface Props {
  character: CharacterDetail;
  gear: CharacterDetail["gear"];
  initialSlot: GearSlot;
  gearCatalog: GearCatalogData;
  tarotCatalog: TarotCatalogData;
  onChangeItem: (slot: GearSlot, item: GearItem | TarotItem) => void;
  onPatchItem: (slot: GearSlot, patch: Partial<GearItem & TarotItem>) => void;
}

const SLOT_LABELS: Record<GearSlot, string> = {
  weapon: "Weapon",
  trinket: "Trinket",
  tarot: "Tarot Whisper",
};

export function LoadoutGearViewer({
  character,
  gear,
  initialSlot,
  gearCatalog,
  tarotCatalog,
  onChangeItem,
  onPatchItem,
}: Props) {
  const [activeSlot, setActiveSlot] = useState<GearSlot>(initialSlot);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setActiveSlot(initialSlot);
    setPickerOpen(false);
    setQuery("");
  }, [initialSlot, character.slug]);

  const item = gear[activeSlot];
  const isTarot = activeSlot === "tarot";
  const available = item?.available !== false && Boolean(item?.name);
  const signatureName = normalized(character.signatureGearName);
  const isSignature = Boolean(signatureName && normalized(item?.name) === signatureName);

  const pool = useMemo<Array<GearItem | TarotItem>>(() => {
    const entries: Array<GearItem | TarotItem> = isTarot
      ? tarotCatalog.items
      : gearCatalog.items.filter((candidate) => activeSlot === "weapon"
        ? candidate.category === "WEAPON" && (!character.weaponType || candidate.weaponType === character.weaponType)
        : candidate.category === "TRINKET");

    return [...entries].sort((a, b) => (
      Number(normalized(b.name) === signatureName)
      - Number(normalized(a.name) === signatureName)
      || (a.name ?? "").localeCompare(b.name ?? "")
    ));
  }, [activeSlot, character.weaponType, gearCatalog.items, isTarot, signatureName, tarotCatalog.items]);

  const filtered = pool.filter((candidate) => !query || normalized(candidate.name).includes(normalized(query)));

  const gearItem = !isTarot ? item as GearItem | undefined : undefined;
  const tarotItem = isTarot ? item as TarotItem | undefined : undefined;
  const starLevel = gearItem?.levels?.find((level) => level.stars === (gearItem.stars ?? 5));
  const effect = isTarot ? tarotItem?.effect : starLevel?.effect;
  const fourthSlotEffect = isTarot ? tarotItem?.slot4Effect : undefined;
  const definitions = isTarot
    ? tarotItem?.detailInfo ?? []
    : [...(gearItem?.detailInfo ?? []), ...(starLevel?.detailInfo ?? [])];

  const maxLevel = Math.max(1, isTarot ? 60 : gearItem?.maxLevel ?? 60);
  const currentLevel = clampNumber(item?.level ?? maxLevel, 1, maxLevel);
  const currentStars = clampNumber(item?.stars ?? 5, 1, 5);

  return (
    <section className="loadout-workspace gear-loadout-workspace">
      <nav className="loadout-icon-rail" aria-label="Equipped gear slots">
        {(Object.keys(SLOT_LABELS) as GearSlot[]).map((slot) => {
          const slotItem = gear[slot];
          const selected = slot === activeSlot;
          const slotSignature = Boolean(signatureName && normalized(slotItem?.name) === signatureName);
          return (
            <button
              className={`loadout-rail-button ${selected ? "selected" : ""} ${slotSignature ? "signature" : ""}`}
              type="button"
              key={slot}
              aria-pressed={selected}
              title={`${SLOT_LABELS[slot]}: ${slotItem?.name ?? "Not selected"}`}
              onClick={() => {
                setActiveSlot(slot);
                setPickerOpen(false);
                setQuery("");
              }}
            >
              <span className="loadout-rail-icon">
                {slot === "tarot" && slotItem
                  ? <TarotEmblem item={slotItem as TarotItem} compact />
                  : <ImageWithFallback src={slotItem?.icon} alt="" label={SLOT_LABELS[slot]} />}
              </span>
              <span className="loadout-rail-slot-symbol" aria-hidden="true">{gearSymbols[slot]}</span>
              {slotSignature && <span className="loadout-signature-dot" aria-label="Signature gear">✦</span>}
              <span className="loadout-rail-label">{SLOT_LABELS[slot]}</span>
            </button>
          );
        })}
      </nav>

      <div className="loadout-detail-pane">
        <header className="loadout-detail-header">
          <span className="loadout-detail-icon">
            {isTarot && item
              ? <TarotEmblem item={item as TarotItem} compact />
              : <ImageWithFallback src={item?.icon} alt="" label={SLOT_LABELS[activeSlot]} />}
          </span>
          <div className="loadout-detail-heading-copy">
            <span className="loadout-detail-kicker">{SLOT_LABELS[activeSlot]}</span>
            <h3>{available ? item?.name : "Not selected"}</h3>
            <p>
              {isTarot
                ? "Legendary Tarot configuration"
                : [gearItem?.rarity, activeSlot === "weapon" ? gearItem?.weaponType : "Trinket"].filter(Boolean).join(" · ") || "Equipment"}
            </p>
          </div>
          <div className="loadout-detail-actions">
            {isSignature && <span className="signature-match-badge">Signature</span>}
            <button
              className="loadout-change-button"
              type="button"
              onClick={() => {
                setPickerOpen((current) => !current);
                setQuery("");
              }}
            >
              {pickerOpen ? "Close list" : `Change ${activeSlot}`}
            </button>
          </div>
        </header>

        {pickerOpen ? (
          <CompactGearPicker
            slot={activeSlot}
            current={item}
            query={query}
            setQuery={setQuery}
            items={filtered}
            total={pool.length}
            signatureName={signatureName}
            onSelect={(selected) => {
              const next = activeSlot === "tarot"
                ? {
                    ...selected,
                    available: true,
                    level: selected.level ?? 60,
                    statSlots: ensureStatSlots((selected as TarotItem).statSlots, 4),
                  } as TarotItem
                : {
                    ...selected,
                    available: true,
                    level: selected.level ?? (selected as GearItem).maxLevel ?? 60,
                    stars: selected.stars ?? 5,
                    engravingStats: ensureStatSlots((selected as GearItem).engravingStats, 3),
                  } as GearItem;
              onChangeItem(activeSlot, next);
              setPickerOpen(false);
              setQuery("");
            }}
          />
        ) : (
          <div className="loadout-detail-scroll">
            {!available ? (
              <p className="empty-detail">Choose an item to configure this slot.</p>
            ) : (
              <>
                <section className="loadout-config-section loadout-level-section" aria-label="Equipment level and rarity settings">
                  <div className="loadout-config-heading">
                    <strong>Level</strong>
                    <span>1–{maxLevel}</span>
                  </div>
                  <NumberStepper
                    value={currentLevel}
                    min={1}
                    max={maxLevel}
                    onChange={(value) => onPatchItem(activeSlot, { level: value })}
                  />

                  {!isTarot && (
                    <div className="loadout-star-control">
                      <span className="loadout-star-label">Gear stars</span>
                      <div className="loadout-star-options" role="radiogroup" aria-label="Gear star level">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            type="button"
                            role="radio"
                            aria-checked={currentStars === stars}
                            className={currentStars === stars ? "selected" : ""}
                            key={stars}
                            onClick={() => onPatchItem(activeSlot, { stars })}
                          >
                            {stars}★
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section className="loadout-config-section loadout-effect-section">
                  <div className="loadout-config-heading">
                    <strong>{isTarot ? "Tarot effect" : `${currentStars}★ effect`}</strong>
                    <span>Guide wording</span>
                  </div>
                  <EffectText as="p" className="loadout-effect-copy" text={effect || "Effect data has not been added yet."} definitions={definitions} />
                  {fourthSlotEffect && (
                    <div className="loadout-additional-effect">
                      <strong>Fourth-slot effect</strong>
                      <EffectText as="p" text={fourthSlotEffect} definitions={definitions} />
                    </div>
                  )}
                </section>

                {!isTarot && <BaseStats item={gearItem} />}

                {isTarot ? (
                  <StatSlotEditor
                    title="Tarot stats"
                    note="Legendary Tarot · 4 stat slots"
                    count={4}
                    values={tarotItem?.statSlots}
                    options={tarotCatalog.statOptions}
                    onChange={(statSlots) => onPatchItem(activeSlot, { statSlots })}
                  />
                ) : (
                  <StatSlotEditor
                    title="Engraving stats"
                    note="Weapon and trinket · 3 stat slots"
                    count={3}
                    values={gearItem?.engravingStats}
                    options={gearCatalog.engravingOptions}
                    onChange={(engravingStats) => onPatchItem(activeSlot, { engravingStats })}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function CompactGearPicker({
  slot,
  current,
  query,
  setQuery,
  items,
  total,
  signatureName,
  onSelect,
}: {
  slot: GearSlot;
  current?: GearItem | TarotItem;
  query: string;
  setQuery: (value: string) => void;
  items: Array<GearItem | TarotItem>;
  total: number;
  signatureName: string;
  onSelect: (item: GearItem | TarotItem) => void;
}) {
  return (
    <section className="compact-picker" aria-label={`Choose ${slot}`}>
      <div className="compact-picker-toolbar">
        <input
          type="search"
          value={query}
          placeholder={`Search ${slot}`}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
        <span>{items.length}/{total}</span>
      </div>
      <div className="compact-icon-picker-grid">
        {items.map((candidate) => {
          const selected = itemIdentity(candidate) === itemIdentity(current);
          const signature = Boolean(signatureName && normalized(candidate.name) === signatureName);
          return (
            <button
              className={`compact-icon-picker-card ${selected ? "selected" : ""} ${signature ? "signature" : ""}`}
              type="button"
              key={candidate.id ?? candidate.slug ?? candidate.name}
              title={candidate.name}
              onClick={() => onSelect(candidate)}
            >
              <span className="compact-picker-icon">
                {slot === "tarot"
                  ? <TarotEmblem item={candidate as TarotItem} compact />
                  : <ImageWithFallback src={candidate.icon} alt="" label={candidate.name ?? SLOT_LABELS[slot]} />}
              </span>
              <span className="compact-picker-name">{candidate.name}</span>
              {signature && <span className="compact-picker-badge">Signature</span>}
              {selected && <span className="compact-picker-check" aria-label="Selected">✓</span>}
            </button>
          );
        })}
      </div>
      {!items.length && <p className="empty-detail">No matching items.</p>}
    </section>
  );
}

function NumberStepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (value: number) => void }) {
  const update = (next: number) => onChange(clampNumber(next, min, max));
  return (
    <div className="number-stepper">
      <button type="button" aria-label="Decrease level" onClick={() => update(value - 1)} disabled={value <= min}>−</button>
      <label>
        <span className="sr-only">Level</span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(event) => update(Number(event.target.value) || min)}
        />
      </label>
      <button type="button" aria-label="Increase level" onClick={() => update(value + 1)} disabled={value >= max}>+</button>
    </div>
  );
}

function BaseStats({ item }: { item?: GearItem }) {
  const stats = Object.entries(item?.maxStats ?? {}).filter(([, value]) => value !== null && value !== undefined);
  if (!stats.length) return null;
  return (
    <section className="loadout-config-section loadout-base-stats">
      <div className="loadout-config-heading">
        <strong>Base stats</strong>
        <span>Lv. {item?.maxLevel ?? 60} reference</span>
      </div>
      <div className="loadout-stat-grid">
        {stats.map(([name, value]) => <div key={name}><span>{formatStatName(name)}</span><strong>{value}</strong></div>)}
      </div>
    </section>
  );
}

function StatSlotEditor({
  title,
  note,
  count,
  values,
  options = [],
  onChange,
}: {
  title: string;
  note: string;
  count: number;
  values?: LoadoutStatValue[];
  options?: LoadoutStatOption[];
  onChange: (values: LoadoutStatValue[]) => void;
}) {
  const rows = ensureStatSlots(values, count);
  const dataAvailable = options.length > 0;

  const patch = (index: number, value: LoadoutStatValue) => {
    const next = rows.map((row, rowIndex) => rowIndex === index ? value : row);
    onChange(next);
  };

  return (
    <section className="loadout-config-section loadout-stat-editor">
      <div className="loadout-config-heading">
        <strong>{title}</strong>
        <span>{note}</span>
      </div>
      <div className="loadout-stat-slot-list">
        {rows.map((row, index) => {
          const selectedOption = options.find((option) => option.id === row.optionId || normalized(option.label) === normalized(row.label));
          return (
            <div className="loadout-stat-slot" key={index}>
              <span className="loadout-stat-index">{index + 1}</span>
              <select
                value={selectedOption?.id ?? ""}
                disabled={!dataAvailable}
                aria-label={`${title} slot ${index + 1}`}
                onChange={(event) => {
                  const option = options.find((candidate) => candidate.id === event.target.value);
                  patch(index, option ? { optionId: option.id, label: option.label, value: option.values?.[0] ?? null } : {});
                }}
              >
                <option value="">{dataAvailable ? "Select stat" : "Awaiting spreadsheet data"}</option>
                {options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
              </select>
              {selectedOption?.values?.length ? (
                <select
                  value={String(row.value ?? selectedOption.values[0] ?? "")}
                  aria-label={`${selectedOption.label} value`}
                  onChange={(event) => patch(index, { ...row, value: event.target.value })}
                >
                  {selectedOption.values.map((value) => <option value={String(value)} key={String(value)}>{value}</option>)}
                </select>
              ) : (
                <span className="loadout-stat-value-placeholder">{dataAvailable ? "—" : "Not linked"}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ensureStatSlots(values: LoadoutStatValue[] | undefined, count: number): LoadoutStatValue[] {
  return Array.from({ length: count }, (_, index) => ({ ...(values?.[index] ?? {}) }));
}

function itemIdentity(item?: GearItem | TarotItem): string {
  return normalized(item?.id || item?.name);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function formatStatName(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
