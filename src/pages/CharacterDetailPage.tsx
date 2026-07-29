import { useEffect, useMemo, useState } from "react";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { Modal } from "../components/Modal";
import { TarotEmblem } from "../components/TarotEmblem";
import { LoadoutGearViewer, type GearSlot } from "../features/LoadoutGearViewer";
import {
  flattenSkills,
  LoadoutSkillViewer,
  setSkillInLoadout,
  skillFitsSlot,
  skillIdentity,
  skillRecords,
  type SkillSlot,
} from "../features/LoadoutSkillViewer";
import { RankSkillTree } from "../features/RankSkillTree";
import { TraitViewer } from "../features/TraitViewer";
import { routeHref } from "../lib/router";
import { attributeSymbols, gearSymbols, rarityOrder } from "../lib/symbols";
import { displayValue, normalized, starText } from "../lib/text";
import { readStorage, writeStorage } from "../lib/storage";
import type {
  CharacterDetail,
  GearCatalogData,
  GearItem,
  LoadoutStatValue,
  Skill,
  TarotCatalogData,
  TarotItem,
} from "../types";
import "../styles/character.css";
import "../styles/effect-text.css";

interface Props {
  character: CharacterDetail;
  allCharacters: Record<string, CharacterDetail>;
  gearCatalog: GearCatalogData;
  tarotCatalog: TarotCatalogData;
}

type ModalState =
  | { kind: "level" }
  | { kind: "bond" }
  | { kind: "trait" }
  | { kind: "rank" }
  | { kind: "faction"; name: string }
  | { kind: "gear-loadout"; slot: GearSlot }
  | { kind: "skill-loadout"; slot: SkillSlot }
  | null;

interface SavedGearSlot {
  id?: string;
  name?: string;
  level?: number;
  stars?: number;
  engravingStats?: LoadoutStatValue[];
  statSlots?: LoadoutStatValue[];
}

interface SavedGear {
  weapon?: SavedGearSlot;
  trinket?: SavedGearSlot;
  tarot?: SavedGearSlot;
}

interface SavedSkills {
  basicAttack?: string;
  reaction?: string;
  classSkills?: string[];
  unique?: string;
}

export function CharacterDetailPage({ character, allCharacters, gearCatalog, tarotCatalog }: Props) {
  const [modal, setModal] = useState<ModalState>(null);
  const [artKey, setArtKey] = useState<"awakened" | "main">(
    character.art.awakened ? "awakened" : "main",
  );
  const skillCatalog = useMemo(() => flattenSkills(character), [character]);
  const [gear, setGear] = useState(() => restoreGear(character, gearCatalog, tarotCatalog));
  const [skills, setSkills] = useState(() => restoreSkills(character, skillCatalog));

  useEffect(() => {
    setArtKey(character.art.awakened ? "awakened" : "main");
    setGear(restoreGear(character, gearCatalog, tarotCatalog));
    setSkills(restoreSkills(character, flattenSkills(character)));
    setModal(null);
  }, [character, gearCatalog, tarotCatalog]);

  useEffect(() => {
    const saved: SavedGear = {};
    (Object.keys(gear) as GearSlot[]).forEach((slot) => {
      const item = gear[slot];
      if (!item?.name) return;
      saved[slot] = {
        id: item.id,
        name: item.name,
        level: item.level,
        stars: item.stars,
        engravingStats: slot !== "tarot" ? (item as GearItem).engravingStats : undefined,
        statSlots: slot === "tarot" ? (item as TarotItem).statSlots : undefined,
      };
    });
    writeStorage(`soc-guide:gear:${character.slug}`, saved);
  }, [gear, character.slug]);

  useEffect(() => {
    writeStorage<SavedSkills>(`soc-guide:skills:${character.slug}`, {
      basicAttack: skillIdentity(skills.basicAttack),
      reaction: skillIdentity(skills.reaction),
      classSkills: (skills.classSkills ?? []).map(skillIdentity).filter(Boolean),
      unique: skillIdentity(skills.unique),
    });
  }, [skills, character.slug]);

  const displayedArt = character.art[artKey] || character.art.awakened || character.art.main;
  const signatureName = character.signatureGearName?.trim();

  const replaceGear = (slot: GearSlot, item: GearItem | TarotItem) => {
    setGear((current) => ({ ...current, [slot]: item } as CharacterDetail["gear"]));
  };

  const patchGear = (slot: GearSlot, patch: Partial<GearItem & TarotItem>) => {
    setGear((current) => ({
      ...current,
      [slot]: { ...(current[slot] ?? {}), ...patch },
    } as CharacterDetail["gear"]));
  };

  return (
    <main className="character-screen" aria-live="polite">
      <header className="guide-header">
        <div className="header-title-group">
          <a className="back-button" href={routeHref({ page: "characters" })} aria-label="Back to Character List">
            <span aria-hidden="true">←</span><span>Character List</span>
          </a>
          <p className="eyebrow">Unofficial character guide</p>
          <div className="character-title-line">
            <span className="header-role-emblem" title={character.role} aria-label={character.role}>
              <ImageWithFallback className="header-role-icon" src={character.roleIcon} alt="" label={character.role} loading="eager" />
            </span>
            <h1>{character.name}</h1>
          </div>
        </div>
        <div className="header-status-group">
          <div className="skin-switcher panel-soft" aria-label="Character skin">
            <span className="skin-switcher-label">Skin</span>
            <div className="skin-switcher-options">
              {(["awakened", "main"] as const).map((key) => character.art[key] && (
                <button
                  className={artKey === key ? "active" : ""}
                  type="button"
                  key={key}
                  onClick={() => setArtKey(key)}
                  aria-pressed={artKey === key}
                >
                  {key === "awakened" ? "Awakened" : "Main"}
                </button>
              ))}
            </div>
          </div>
          <button
            className="bond-heart-control"
            type="button"
            title="Open bond details"
            aria-label="Open bond details. Bond level 5."
            onClick={() => setModal({ kind: "bond" })}
          >
            <span className="bond-heart-label">Bond</span>
            <span className="bond-heart-badge" aria-hidden="true">
              <svg viewBox="0 0 100 90" focusable="false">
                <path d="M50 86C42 76 8 54 8 29C8 13 19 3 34 3C43 3 49 8 50 15C53 8 59 3 68 3C83 3 94 13 94 29C94 54 58 77 50 86Z" />
              </svg>
              <strong>5</strong>
            </span>
          </button>
        </div>
      </header>

      <section className="left-column" aria-label="Character information">
        <section className="progress-panel" aria-label="Character progression">
          <div className="progress-main-grid">
            <ProgressCard label="Level" value={`${displayValue(character.level.current, "60")}/${displayValue(character.level.max, "60")}`} onClick={() => setModal({ kind: "level" })} />
            <ProgressCard label="Rank" value="RK 13/13" onClick={() => setModal({ kind: "rank" })} />
          </div>
        </section>

        <section className="identity-symbols faction-strip panel-soft" aria-label="Factions">
          <div className="faction-symbol-list">
            {character.factions.map((faction) => (
              <button type="button" className="faction-emblem faction-trigger" key={faction.name} title={faction.name} onClick={() => setModal({ kind: "faction", name: faction.name })}>
                <ImageWithFallback className="faction-icon" src={faction.icon} alt={`${faction.name} faction`} label={faction.name} />
              </button>
            ))}
          </div>
        </section>

        <section className="section-block trait-block" aria-label="Trait">
          <button className="trait-summary-card detail-trigger" type="button" aria-label="Open trait details" onClick={() => setModal({ kind: "trait" })}>
            <span className="trait-icon-wrap">
              <ImageWithFallback className="trait-icon" src={character.trait.icon} alt={`${character.trait.name ?? "Trait"} icon`} label={character.trait.name ?? "Trait"} />
            </span>
            <span className="trait-summary-copy">
              <span className="section-mini-label">Trait</span>
              <strong>{character.trait.name ?? "Trait"}</strong>
              <span className="stars" aria-hidden="true">{starText(character.trait.stars, character.trait.maxStars ?? 5)}</span>
            </span>
          </button>
        </section>

        <section className="section-block attributes-block" aria-label="Attributes">
          <div className="section-mini-heading">Attributes</div>
          <div className="attributes-grid">
            {Object.entries(attributeSymbols).map(([key, symbol]) => (
              <div className="attribute-card" key={key} title={key}>
                <span className="attribute-icon" aria-hidden="true">{symbol}</span>
                <span className="sr-only">{key}</span>
                <strong className="attribute-value">{displayValue(character.attributes[key])}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="art-stage" aria-label={`${artKey} character art`}>
        {displayedArt
          ? <ImageWithFallback className="main-art" src={displayedArt} alt={`${character.name} ${artKey} artwork`} label={character.name} loading="eager" />
          : <span className="main-art art-unavailable" />}
        <div className="art-glow" aria-hidden="true" />
      </section>

      <aside className="right-column" aria-label="Character loadout and pixel art">
        <div className="right-loadout-dock">
          <section className="pixel-preview-card panel-soft" aria-label={`${character.name} pixel art`}>
            <span className="pixel-preview-label">Pixel</span>
            <span className="pixel-preview-stage">
              <ImageWithFallback className="pixel-preview-image" src={character.art.pixel} alt={`${character.name} pixel art`} label={character.name} />
            </span>
          </section>

          <div className="loadout-strip-stack">
            <section className="gear-block section-block loadout-strip panel-soft">
              <div className="section-title-row">
                <h2>Gear</h2>
                <button className="text-action" type="button" onClick={() => setModal({ kind: "gear-loadout", slot: "weapon" })}>View</button>
              </div>
              <div className="gear-quick-grid">
                {(Object.keys(gear) as GearSlot[]).map((slot) => (
                  <GearQuickCard
                    key={`${slot}:${gear[slot]?.id ?? gear[slot]?.name ?? "empty"}:${gear[slot]?.icon ?? ""}`}
                    slot={slot}
                    item={gear[slot]}
                    signature={Boolean(signatureName && normalized(gear[slot]?.name) === normalized(signatureName))}
                    onClick={() => setModal({ kind: "gear-loadout", slot })}
                  />
                ))}
              </div>
            </section>

            <section className="skills-dock section-block loadout-strip panel-soft" aria-label="Equipped skills">
              <div className="dock-heading">
                <h2>Equipped Skills</h2>
                <button className="text-action" type="button" onClick={() => setModal({ kind: "skill-loadout", slot: "basicAttack" })}>View</button>
              </div>
              <div className="skills-row">
                {skillRecords(skills).map((record) => (
                  <button
                    className={`skill-card detail-trigger ${record.skill?.available === false ? "data-unavailable" : ""}`}
                    type="button"
                    key={`${record.slot}:${skillIdentity(record.skill)}:${record.skill?.icon ?? ""}`}
                    title={`${record.label}: ${record.skill?.name ?? "unavailable"}`}
                    onClick={() => setModal({ kind: "skill-loadout", slot: record.slot })}
                  >
                    <span className="skill-image-wrap">
                      <ImageWithFallback className="skill-icon" src={record.skill?.icon} alt={`${record.skill?.name ?? record.label} icon`} label={record.label} />
                    </span>
                    <span className="skill-type-symbol" aria-hidden="true">{record.symbol}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </aside>

      <footer className="site-note">Unofficial fan-made guide. Game names, artwork, UI elements, and related assets belong to their respective rights holders.</footer>

      <CharacterModal
        state={modal}
        close={() => setModal(null)}
        character={character}
        allCharacters={allCharacters}
        gear={gear}
        skills={skills}
        gearCatalog={gearCatalog}
        tarotCatalog={tarotCatalog}
        replaceGear={replaceGear}
        patchGear={patchGear}
        setSkill={(slot, skill) => setSkills((current) => setSkillInLoadout(current, slot, skill))}
      />
    </main>
  );
}

function ProgressCard({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <div className="progress-card">
      <span className="progress-copy"><span className="progress-label">{label}</span><strong>{value}</strong></span>
      <button className="progress-plus" type="button" onClick={onClick}>+</button>
    </div>
  );
}

function GearQuickCard({ slot, item, signature, onClick }: { slot: GearSlot; item?: GearItem | TarotItem; signature: boolean; onClick: () => void }) {
  const available = item?.available !== false && Boolean(item?.name);
  return (
    <button
      className={`gear-quick-card ${signature ? "signature-equipped" : ""} ${!available ? "data-unavailable" : ""}`}
      type="button"
      onClick={onClick}
      title={`${slot}: ${available ? item?.name : "Not selected"}`}
    >
      <span className="gear-quick-image">
        {slot === "tarot" && item
          ? <TarotEmblem item={item as TarotItem} compact />
          : <ImageWithFallback src={item?.icon} alt="" label={slot} />}
      </span>
      <span className="gear-quick-symbol" aria-hidden="true">{gearSymbols[slot]}</span>
      {signature && <span className="gear-quick-signature" aria-label="Signature gear">✦</span>}
      <span className="sr-only">{available ? item?.name : `Choose ${slot}`}</span>
    </button>
  );
}

function CharacterModal({
  state,
  close,
  character,
  allCharacters,
  gear,
  skills,
  gearCatalog,
  tarotCatalog,
  replaceGear,
  patchGear,
  setSkill,
}: {
  state: ModalState;
  close: () => void;
  character: CharacterDetail;
  allCharacters: Record<string, CharacterDetail>;
  gear: CharacterDetail["gear"];
  skills: CharacterDetail["equippedSkills"];
  gearCatalog: GearCatalogData;
  tarotCatalog: TarotCatalogData;
  replaceGear: (slot: GearSlot, item: GearItem | TarotItem) => void;
  patchGear: (slot: GearSlot, patch: Partial<GearItem & TarotItem>) => void;
  setSkill: (slot: SkillSlot, skill: Skill) => void;
}) {
  if (!state) return null;

  if (state.kind === "level") {
    return <Modal open title="Level 60/60" kicker="Character progression" onClose={close}><ProgressDetails symbol="✦" current={60} maximum={60} note="The guide displays the character at maximum level." /></Modal>;
  }
  if (state.kind === "bond") {
    return <Modal open title="Bond 5" kicker="Guide bond level" onClose={close}><ProgressDetails symbol="♥" current={5} maximum={5} note="Character guides display the complete Bond 5 state by default." /></Modal>;
  }
  if (state.kind === "trait") {
    return (
      <Modal
        open
        title={(
          <span className="trait-modal-heading">
            <span className="trait-modal-heading-icon">
              <ImageWithFallback className="trait-modal-icon" src={character.trait.icon} alt={`${character.trait.name ?? "Trait"} icon`} label={character.trait.name ?? "Trait"} />
            </span>
            <span>{character.trait.name ?? "Trait"}</span>
          </span>
        )}
        kicker="Trait · Star progression"
        onClose={close}
        wide
        variant="trait-modal"
      >
        <TraitViewer trait={character.trait} />
      </Modal>
    );
  }
  if (state.kind === "rank") {
    return <Modal open title="Rank Skill Tree" kicker={`${character.name} · RK 1–13`} onClose={close} wide variant="rank-tree-modal"><RankSkillTree rows={character.rank.skillTree ?? []} /></Modal>;
  }
  if (state.kind === "faction") {
    return <Modal open title={state.name} kicker="Faction category" onClose={close} wide><FactionGrid faction={state.name} current={character} all={allCharacters} /></Modal>;
  }
  if (state.kind === "gear-loadout") {
    return (
      <Modal open title="Equipped Gear" kicker={`${character.name} · Loadout`} onClose={close} wide variant="loadout-workspace-modal">
        <LoadoutGearViewer
          character={character}
          gear={gear}
          initialSlot={state.slot}
          gearCatalog={gearCatalog}
          tarotCatalog={tarotCatalog}
          onChangeItem={replaceGear}
          onPatchItem={patchGear}
        />
      </Modal>
    );
  }
  return (
    <Modal open title="Equipped Skills" kicker={`${character.name} · Loadout`} onClose={close} wide variant="loadout-workspace-modal">
      <LoadoutSkillViewer character={character} loadout={skills} initialSlot={state.slot} onSelect={setSkill} />
    </Modal>
  );
}

function ProgressDetails({ symbol, current, maximum, note }: { symbol: string; current?: number | null; maximum?: number | null; note: string }) {
  return <section className="modal-hero progression-modal-hero"><span className="progression-modal-symbol" aria-hidden="true">{symbol}</span><div><h3>{displayValue(current)}/{displayValue(maximum)}</h3><p>{note}</p></div></section>;
}

function FactionGrid({ faction, current, all }: { faction: string; current: CharacterDetail; all: Record<string, CharacterDetail> }) {
  const units = Object.values(all)
    .filter((item) => item.factions.some((entry) => entry.name === faction))
    .sort((a, b) => {
      const rarity = (rarityOrder[a.rarity] ?? 9) - (rarityOrder[b.rarity] ?? 9);
      if (rarity) return rarity;
      const dateA = a.releaseDate ? Date.parse(a.releaseDate) : 0;
      const dateB = b.releaseDate ? Date.parse(b.releaseDate) : 0;
      return dateB - dateA || (b.releaseOrder ?? 0) - (a.releaseOrder ?? 0) || a.name.localeCompare(b.name);
    });
  const icon = current.factions.find((entry) => entry.name === faction)?.icon;

  return (
    <>
      <section className="faction-category-card">
        <span className="faction-category-icon"><ImageWithFallback className="faction-category-image" src={icon} alt="" label={faction} /></span>
        <strong className="faction-category-name">{faction}</strong>
      </section>
      <h3 className="faction-member-heading">Characters within the same category</h3>
      <div className="faction-member-grid">
        {units.map((unit) => (
          <a
            className={`faction-member-card ${unit.slug === current.slug ? "current-member" : ""}`}
            data-rarity={unit.rarity.toLocaleLowerCase()}
            href={routeHref({ page: "character", slug: unit.slug })}
            key={unit.slug}
          >
            <span className="faction-member-art"><ImageWithFallback src={unit.art.pixel} alt={`${unit.name} pixel art`} label={unit.name} /></span>
            <span className="faction-member-role" title={unit.role}><ImageWithFallback className="faction-member-role-image" src={unit.roleIcon} alt="" label={unit.role} /></span>
            <strong className="faction-member-name">{unit.name}</strong>
          </a>
        ))}
      </div>
    </>
  );
}

function restoreGear(character: CharacterDetail, gearCatalog: GearCatalogData, tarotCatalog: TarotCatalogData): CharacterDetail["gear"] {
  const saved = readStorage<SavedGear>(`soc-guide:gear:${character.slug}`, {});
  const result = hydrateCharacterGear(character, gearCatalog, tarotCatalog);

  (Object.keys(saved) as GearSlot[]).forEach((slot) => {
    const value = saved[slot];
    if (!value) return;
    const pool: Array<GearItem | TarotItem> = slot === "tarot" ? tarotCatalog.items : gearCatalog.items;
    const catalogItem = pool.find((entry) => itemIdentity(entry) === normalized(value.id || value.name));
    if (!catalogItem) return;
    result[slot] = {
      ...catalogItem,
      available: true,
      level: value.level ?? (slot === "tarot" ? 60 : (catalogItem as GearItem).maxLevel ?? 60),
      stars: slot === "tarot" ? catalogItem.stars : value.stars ?? 5,
      engravingStats: slot === "tarot" ? undefined : value.engravingStats,
      statSlots: slot === "tarot" ? value.statSlots : undefined,
    } as never;
  });

  return result;
}

function hydrateCharacterGear(character: CharacterDetail, gearCatalog: GearCatalogData, tarotCatalog: TarotCatalogData): CharacterDetail["gear"] {
  const result: CharacterDetail["gear"] = {};
  (['weapon', 'trinket', 'tarot'] as GearSlot[]).forEach((slot) => {
    const source = character.gear[slot];
    const pool: Array<GearItem | TarotItem> = slot === "tarot" ? tarotCatalog.items : gearCatalog.items;
    const catalogItem = pool.find((entry) => normalized(entry.name) === normalized(source?.name));
    const merged = { ...(catalogItem ?? {}), ...(source ?? {}) } as GearItem & TarotItem;
    if (source?.name) {
      merged.level = source.level ?? (slot === "tarot" ? 60 : (catalogItem as GearItem | undefined)?.maxLevel ?? 60);
      if (slot !== "tarot") merged.stars = source.stars ?? 5;
      result[slot] = merged as never;
    }
  });
  return result;
}

function restoreSkills(character: CharacterDetail, catalog: Skill[]): CharacterDetail["equippedSkills"] {
  const saved = readStorage<SavedSkills>(`soc-guide:skills:${character.slug}`, {});
  const byName = new Map(catalog.map((skill) => [skillIdentity(skill), skill]));
  const result = { ...character.equippedSkills, classSkills: [...(character.equippedSkills.classSkills ?? [])] };

  const basic = byName.get(saved.basicAttack ?? "");
  if (basic && skillFitsSlot(basic, "basicAttack")) result.basicAttack = basic;
  const reaction = byName.get(saved.reaction ?? "");
  if (reaction && skillFitsSlot(reaction, "reaction")) result.reaction = reaction;
  const unique = byName.get(saved.unique ?? "");
  if (unique && skillFitsSlot(unique, "unique")) result.unique = unique;
  if (saved.classSkills?.length) result.classSkills = saved.classSkills.map((name) => byName.get(name) ?? null).slice(0, 3);
  while ((result.classSkills?.length ?? 0) < 3) result.classSkills?.push(null);
  return result;
}

function itemIdentity(item?: GearItem | TarotItem): string {
  return normalized(item?.id || item?.name);
}
