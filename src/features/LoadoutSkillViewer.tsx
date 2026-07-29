import { useEffect, useMemo, useState } from "react";
import { EffectText } from "../components/EffectText";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { skillSlotSymbols } from "../lib/symbols";
import { normalized } from "../lib/text";
import type { CharacterDetail, Skill } from "../types";

export type SkillSlot = "basicAttack" | "reaction" | "class-0" | "class-1" | "class-2" | "unique";

interface Props {
  character: CharacterDetail;
  loadout: CharacterDetail["equippedSkills"];
  initialSlot: SkillSlot;
  onSelect: (slot: SkillSlot, skill: Skill) => void;
}

export function LoadoutSkillViewer({ character, loadout, initialSlot, onSelect }: Props) {
  const [activeSlot, setActiveSlot] = useState<SkillSlot>(initialSlot);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setActiveSlot(initialSlot);
    setPickerOpen(false);
    setQuery("");
  }, [character.slug, initialSlot]);

  const records = useMemo(() => skillRecords(loadout), [loadout]);
  const activeRecord = records.find((record) => record.slot === activeSlot) ?? records[0];
  const skill = activeRecord?.skill;
  const catalog = useMemo(() => flattenSkills(character), [character]);
  const pool = catalog.filter((candidate) => skillFitsSlot(candidate, activeSlot));
  const usedClassSkills = new Set((loadout.classSkills ?? []).map(skillIdentity));
  const filtered = pool.filter((candidate) => !query || normalized(candidate.name).includes(normalized(query)));

  return (
    <section className="loadout-workspace skill-loadout-workspace">
      <nav className="loadout-icon-rail skill-loadout-rail" aria-label="Equipped skill slots">
        {records.map((record) => {
          const selected = activeSlot === record.slot;
          const unavailable = record.skill?.available === false || !record.skill?.name;
          return (
            <button
              type="button"
              className={`loadout-rail-button ${selected ? "selected" : ""} ${unavailable ? "data-unavailable" : ""}`}
              key={record.slot}
              aria-pressed={selected}
              title={`${record.label}: ${record.skill?.name ?? "Not selected"}`}
              onClick={() => {
                setActiveSlot(record.slot);
                setPickerOpen(false);
                setQuery("");
              }}
            >
              <span className="loadout-rail-icon round">
                <ImageWithFallback src={record.skill?.icon} alt="" label={record.label} />
              </span>
              <span className="loadout-rail-slot-symbol" aria-hidden="true">{record.symbol}</span>
              <span className="loadout-rail-label">{record.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="loadout-detail-pane">
        <header className="loadout-detail-header">
          <span className="loadout-detail-icon round">
            <ImageWithFallback src={skill?.icon} alt="" label={activeRecord?.label ?? "Skill"} />
          </span>
          <div className="loadout-detail-heading-copy">
            <span className="loadout-detail-kicker">{activeRecord?.label}</span>
            <h3>{skill?.name ?? "Not selected"}</h3>
            <p>{skill ? skillMeta(skill) : "Choose a compatible skill for this slot."}</p>
          </div>
          <div className="loadout-detail-actions">
            <button
              className="loadout-change-button"
              type="button"
              onClick={() => {
                setPickerOpen((current) => !current);
                setQuery("");
              }}
            >
              {pickerOpen ? "Close list" : "Change skill"}
            </button>
          </div>
        </header>

        {pickerOpen ? (
          <CompactSkillPicker
            slot={activeSlot}
            items={filtered}
            total={pool.length}
            current={skill}
            usedClassSkills={usedClassSkills}
            query={query}
            setQuery={setQuery}
            onSelect={(selected) => {
              onSelect(activeSlot, selected);
              setPickerOpen(false);
              setQuery("");
            }}
          />
        ) : (
          <div className="loadout-detail-scroll">
            {!skill?.name || skill.available === false ? (
              <p className="empty-detail">No skill is currently selected for this slot.</p>
            ) : (
              <article className="skill-reader-panel">
                <div className="skill-reader-chips">
                  {skill.type && <span>{skill.type}</span>}
                  {skill.unlockRank ? <span>RK {skill.unlockRank}</span> : null}
                  {skill.nrgCost !== null && skill.nrgCost !== undefined ? <span>{skill.nrgCost} NRG</span> : null}
                  {skill.cooldown !== null && skill.cooldown !== undefined ? <span>{skill.cooldown} turn CD</span> : null}
                </div>
                <EffectText
                  as="p"
                  className="skill-reader-description"
                  text={skill.description || "Description unavailable."}
                  definitions={skill.detailInfo ?? []}
                />
                {skill.subDetail && (
                  <div className="skill-reader-subdetail">
                    <strong>Related effects</strong>
                    <EffectText as="p" text={skill.subDetail} definitions={skill.detailInfo ?? []} />
                  </div>
                )}
              </article>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function CompactSkillPicker({
  slot,
  items,
  total,
  current,
  usedClassSkills,
  query,
  setQuery,
  onSelect,
}: {
  slot: SkillSlot;
  items: Skill[];
  total: number;
  current?: Skill | null;
  usedClassSkills: Set<string>;
  query: string;
  setQuery: (value: string) => void;
  onSelect: (skill: Skill) => void;
}) {
  return (
    <section className="compact-picker" aria-label={`Choose ${slotLabel(slot)}`}>
      <div className="compact-picker-toolbar">
        <input
          type="search"
          value={query}
          placeholder={`Search ${slotLabel(slot).toLocaleLowerCase()}`}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
        <span>{items.length}/{total}</span>
      </div>
      <div className="compact-icon-picker-grid skill-compact-picker-grid">
        {items.map((candidate) => {
          const selected = skillIdentity(candidate) === skillIdentity(current);
          const usedElsewhere = slot.startsWith("class-") && usedClassSkills.has(skillIdentity(candidate)) && !selected;
          return (
            <button
              type="button"
              className={`compact-icon-picker-card ${selected ? "selected" : ""} ${usedElsewhere ? "used" : ""}`}
              key={`${skillIdentity(candidate)}-${candidate.unlockRank ?? "x"}`}
              title={candidate.name}
              disabled={usedElsewhere}
              onClick={() => onSelect(candidate)}
            >
              <span className="compact-picker-icon round">
                <ImageWithFallback src={candidate.icon} alt="" label={candidate.name ?? "Skill"} />
              </span>
              <span className="compact-picker-name">{candidate.name}</span>
              <span className="compact-picker-meta">{candidate.unlockRank ? `RK ${candidate.unlockRank}` : candidate.type ?? "Skill"}</span>
              {selected && <span className="compact-picker-check" aria-label="Selected">✓</span>}
              {usedElsewhere && <span className="compact-picker-badge">In use</span>}
            </button>
          );
        })}
      </div>
      {!items.length && <p className="empty-detail">No compatible skills are available for this slot.</p>}
    </section>
  );
}

export function flattenSkills(character: CharacterDetail): Skill[] {
  const values: Skill[] = [];
  (character.rank.skillTree ?? []).forEach((row) => row.skills.forEach((skill, index) => values.push({
    ...skill,
    unlockRank: row.rank,
    branch: row.rank === 13 ? "center" : index === 0 ? "left" : "right",
  })));
  return dedupeSkills(values);
}

export function skillFitsSlot(skill: Skill, slot: SkillSlot): boolean {
  const category = normalized(skill.category);
  const type = normalized(skill.type);
  if (slot === "basicAttack") return category.includes("basic") || type.includes("basic attack");
  if (slot === "reaction") return category.includes("reaction") || type === "reaction";
  if (slot === "unique") return skill.unlockRank === 13;
  return !category.includes("basic") && !category.includes("reaction") && skill.unlockRank !== 13;
}

export function slotLabel(slot: SkillSlot): string {
  if (slot === "basicAttack") return "Basic Attack";
  if (slot === "reaction") return "Reaction";
  if (slot === "unique") return "Rank 13 Skill";
  return `Class Skill ${Number(slot.slice(-1)) + 1}`;
}

export function skillAtSlot(loadout: CharacterDetail["equippedSkills"], slot: SkillSlot): Skill | undefined | null {
  if (slot.startsWith("class-")) return loadout.classSkills?.[Number(slot.slice(-1))];
  return loadout[slot as "basicAttack" | "reaction" | "unique"];
}

export function setSkillInLoadout(
  loadout: CharacterDetail["equippedSkills"],
  slot: SkillSlot,
  skill: Skill,
): CharacterDetail["equippedSkills"] {
  if (slot.startsWith("class-")) {
    const classSkills = [...(loadout.classSkills ?? [])];
    while (classSkills.length < 3) classSkills.push(null);
    classSkills[Number(slot.slice(-1))] = skill;
    return { ...loadout, classSkills };
  }
  return { ...loadout, [slot]: skill };
}

export function skillRecords(loadout: CharacterDetail["equippedSkills"]) {
  return [
    { slot: "basicAttack" as SkillSlot, label: "Basic Attack", symbol: skillSlotSymbols.basicAttack, skill: loadout.basicAttack },
    { slot: "reaction" as SkillSlot, label: "Reaction", symbol: skillSlotSymbols.reaction, skill: loadout.reaction },
    ...[0, 1, 2].map((index) => ({
      slot: `class-${index}` as SkillSlot,
      label: `Class Skill ${index + 1}`,
      symbol: skillSlotSymbols.classSkills,
      skill: loadout.classSkills?.[index],
    })),
    { slot: "unique" as SkillSlot, label: "Rank 13 Skill", symbol: skillSlotSymbols.unique, skill: loadout.unique },
  ];
}

export function skillIdentity(skill?: Skill | null): string {
  return normalized(skill?.name);
}

function dedupeSkills(skills: Skill[]): Skill[] {
  const map = new Map<string, Skill>();
  skills.forEach((skill) => {
    if (skill.name) map.set(`${skillIdentity(skill)}:${skill.type ?? ""}`, skill);
  });
  return [...map.values()];
}

function skillMeta(skill: Skill): string {
  return [skill.unlockRank ? `RK ${skill.unlockRank}` : null, skill.category, skill.type].filter(Boolean).join(" · ");
}
