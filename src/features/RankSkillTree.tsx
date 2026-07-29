import { useMemo, useState } from "react";
import { EffectText } from "../components/EffectText";
import { ImageWithFallback } from "../components/ImageWithFallback";
import type { RankRow, Skill } from "../types";

interface SkillSelection {
  skill: Skill;
  rank: number;
  branch: "left" | "right" | "center";
}

const skillRanks = new Set([1, 3, 5, 7, 9, 11]);

export function RankSkillTree({ rows }: { rows: RankRow[] }) {
  const indexed = useMemo(() => new Map(rows.map((row) => [row.rank, row.skills ?? []])), [rows]);
  const [selected, setSelected] = useState<SkillSelection | null>(null);

  return (
    <section className="rank-modal-layout">
      <div className="modal-rank-tree" aria-label="Rank 1 to Rank 13 skill tree">
        {Array.from({ length: 13 }, (_, index) => 13 - index).map((rank) => {
          const skills = indexed.get(rank) ?? [];
          if (rank === 13) {
            return (
              <div className="rank-tree-row rank-tree-row-unique" key={rank}>
                <div className="rank-tree-unique-wrap">
                  <RankNode rank={rank} skill={skills[0]} branch="center" selected={selected} onSelect={setSelected} />
                  <RankBadge rank={rank} />
                </div>
              </div>
            );
          }
          if (skillRanks.has(rank)) {
            return (
              <div className="rank-tree-row rank-tree-row-branch" key={rank}>
                <RankNode rank={rank} skill={skills[0]} branch="left" selected={selected} onSelect={setSelected} />
                <RankBadge rank={rank} />
                <RankNode rank={rank} skill={skills[1]} branch="right" selected={selected} onSelect={setSelected} />
              </div>
            );
          }
          return <div className="rank-tree-row rank-tree-row-step" key={rank}><RankBadge rank={rank} /></div>;
        })}
      </div>
      <RankInspector selection={selected} />
    </section>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return <span className="rank-tree-badge"><span>RK {rank}</span></span>;
}

function RankNode({ rank, skill, branch, selected, onSelect }: {
  rank: number;
  skill?: Skill;
  branch: SkillSelection["branch"];
  selected: SkillSelection | null;
  onSelect: (value: SkillSelection) => void;
}) {
  const active = Boolean(skill && selected && selected.skill.name === skill.name && selected.rank === rank && selected.branch === branch);
  const className = [
    "rank-tree-skill",
    `rank-tree-skill-${branch}`,
    !skill ? "missing" : "",
    active ? "selected" : "",
  ].filter(Boolean).join(" ");

  if (!skill) return <span className={className} aria-label={`RK ${rank} skill data unavailable`}>?</span>;
  return (
    <button type="button" className={className} title={`${skill.name ?? "Skill"} — open details`} onClick={() => onSelect({ skill, rank, branch })}>
      <ImageWithFallback src={skill.icon} alt="" label={skill.name ?? "Skill"} />
    </button>
  );
}

function categoryLabel(skill: Skill): string {
  const category = String(skill.category ?? "").toLocaleLowerCase();
  const type = String(skill.type ?? "").toLocaleLowerCase();
  if (category.includes("basic") || type.includes("basic attack")) return "Basic Attack";
  if (category.includes("reaction") || type === "reaction") return "Reaction";
  if (category.includes("passive") || type.includes("passive")) return "Passive Skill";
  if (category.includes("unique") || type.includes("unique")) return "Unique Skill";
  return "Class Skill";
}

function RankInspector({ selection }: { selection: SkillSelection | null }) {
  if (!selection) {
    return (
      <aside className="rank-skill-inspector is-empty" aria-live="polite">
        <span className="rank-inspector-placeholder-icon" aria-hidden="true">✦</span>
        <h3>Select a skill node</h3>
        <p>Click a populated skill icon in the tree to preview its details here.</p>
      </aside>
    );
  }

  const { skill, rank, branch } = selection;
  const definitions = skill.detailInfo ?? [];
  const properties = [...new Set([skill.type, skill.isInstant ? "Instant" : null, ...(skill.tags ?? [])].filter(Boolean) as string[])];
  return (
    <aside className="rank-skill-inspector" aria-live="polite">
      <article className="rank-skill-preview-card">
        <header className="rank-skill-preview-top">
          <span className="rank-skill-category-tab">{categoryLabel(skill)}</span>
          <div className="rank-skill-resources">
            {skill.nrgCost !== null && skill.nrgCost !== undefined && skill.nrgCost !== "" && <ResourceBadge kind="nrg" value={skill.nrgCost} />}
            {skill.cooldown !== null && skill.cooldown !== undefined && skill.cooldown !== "" && <ResourceBadge kind="cooldown" value={skill.cooldown} />}
          </div>
        </header>
        <div className="rank-skill-icon-stage">
          <span className="rank-inspector-image-wrap"><ImageWithFallback className="rank-inspector-image" src={skill.icon} alt={`${skill.name ?? "Skill"} icon`} label={skill.name ?? "Skill"} /></span>
        </div>
        <div className="rank-skill-name-band"><h3>{skill.name ?? "Skill Details"}</h3></div>
        <div className="rank-skill-scroll-content">
          <div className="rank-skill-description-panel">
            {properties.length > 0 && <p className="effect-property-line rank-skill-properties"><strong>Properties:</strong> {properties.map((property, index) => <span key={`${property}-${index}`}>{index ? " · " : ""}<EffectText text={`[${property}]`} definitions={definitions} /></span>)}</p>}
            <EffectText as="p" className="rank-inspector-description interactive-effect-copy" text={skill.description || "Description unavailable."} definitions={definitions} />
          </div>
        </div>
        <footer className="rank-skill-preview-footer">
          <div className="rank-skill-context">
            <span className="rank-skill-context-item">RK {rank}</span>
            {branch !== "center" && <span className="rank-skill-context-item">{branch === "left" ? "Left Branch" : "Right Branch"}</span>}
          </div>
        </footer>
      </article>
    </aside>
  );
}

function ResourceBadge({ kind, value }: { kind: "nrg" | "cooldown"; value: string | number }) {
  return <span className={`rank-resource-badge rank-resource-${kind}`} title={kind === "nrg" ? `${value} NRG cost` : `${value} turn cooldown`}><strong>{value}</strong><span className="rank-resource-symbol" aria-hidden="true">{kind === "nrg" ? "◆" : "⌛"}</span></span>;
}
