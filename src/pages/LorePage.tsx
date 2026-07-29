import { useState, type CSSProperties } from "react";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { Modal } from "../components/Modal";
import { Navigation } from "../components/Navigation";
import {
  loreEvents,
  worldMapRegions,
  type LoreEvent,
  type LoreRelation,
  type WorldMapRegion,
} from "../data/lore";
import { routeHref } from "../lib/router";
import type { CharacterListData } from "../types";
import "../styles/reference.css";

const accentColor = {
  blue: "#5f91ca",
  rose: "#c45b8e",
  green: "#6b9b62",
  violet: "#625d9f",
  gold: "#b99548",
} as const;

const worldMapSrc = `${import.meta.env.BASE_URL}images/lore/world-map-current.png`;

function scrollToLoreEvent(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function TimelineStrip({
  title,
  min,
  max,
  events,
}: {
  title: string;
  min: number;
  max: number;
  events: LoreEvent[];
}) {
  const width = 1180;
  const height = 170;
  const pad = 52;
  const axisY = 104;
  const usable = width - pad * 2;
  const xFor = (year: number) => pad + ((Math.max(min, Math.min(max, year)) - min) / (max - min)) * usable;
  const visible = events.filter((event) => event.startYear !== undefined && event.startYear <= max && (event.endYear ?? event.startYear) >= min);
  const ticks = min === 0
    ? [0, 300, 500, 600, 700, 800, 900, 960]
    : [960, 970, 980, 985, 990, 995, 999];

  return (
    <section className="lore-map-strip" aria-label={title}>
      <header>
        <span>Chronology overview</span>
        <h3>{title}</h3>
      </header>
      <div className="lore-map-scroll">
        <svg className="lore-map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} timeline`}>
          <line className="lore-map-axis" x1={pad} y1={axisY} x2={width - pad} y2={axisY} />
          {ticks.map((year) => {
            const x = xFor(year);
            return (
              <g className="lore-map-tick" key={year}>
                <line x1={x} y1={axisY - 6} x2={x} y2={axisY + 13} />
                <text x={x} y={axisY + 34} textAnchor="middle">RC {year}</text>
              </g>
            );
          })}
          {visible.map((event, index) => {
            const start = xFor(event.startYear ?? event.sortYear);
            const end = xFor(event.endYear ?? event.startYear ?? event.sortYear);
            const lane = event.track ?? (index % 4) as 0 | 1 | 2 | 3;
            const apex = 32 + lane * 17;
            const color = accentColor[event.accent];
            const markerX = event.endYear && event.endYear !== event.startYear ? (start + end) / 2 : start;
            const number = loreEvents.indexOf(event) + 1;
            const path = event.endYear && event.endYear !== event.startYear
              ? `M ${start} ${axisY} Q ${(start + end) / 2} ${apex} ${end} ${axisY}`
              : `M ${start} ${axisY} L ${start} ${apex + 18}`;
            return (
              <g
                className="lore-map-event"
                key={event.id}
                role="link"
                tabIndex={0}
                aria-label={`${event.dateLabel}: ${event.title}`}
                onClick={() => scrollToLoreEvent(event.id)}
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                    keyEvent.preventDefault();
                    scrollToLoreEvent(event.id);
                  }
                }}
              >
                <path d={path} style={{ stroke: color }} />
                <circle cx={markerX} cy={event.endYear && event.endYear !== event.startYear ? apex + 13 : apex + 18} r="11" style={{ fill: color }} />
                <text className="lore-map-number" x={markerX} y={(event.endYear && event.endYear !== event.startYear ? apex + 13 : apex + 18) + 4} textAnchor="middle">{number}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="lore-map-key">
        {visible.map((event) => (
          <button type="button" onClick={() => scrollToLoreEvent(event.id)} key={event.id} style={{ "--event-accent": accentColor[event.accent] } as CSSProperties}>
            <span>{String(loreEvents.indexOf(event) + 1).padStart(2, "0")}</span>
            <div><small>{event.dateLabel}</small><strong>{event.overviewLabel ?? event.title}</strong></div>
          </button>
        ))}
      </div>
    </section>
  );
}

function RelationChip({ relation, data }: { relation: LoreRelation; data: CharacterListData }) {
  const faction = relation.type === "faction" ? data.factions.find((item) => item.name === relation.name) : undefined;
  const content = (
    <>
      {faction?.icon && <ImageWithFallback src={faction.icon} alt="" label={faction.name} />}
      <span className="lore-relation-type">{relation.type}</span>
      <strong>{relation.name}</strong>
    </>
  );

  if (relation.type === "faction") {
    return <a className={`lore-relation lore-relation-${relation.type}`} href={routeHref({ page: "characters", faction: relation.name })}>{content}</a>;
  }
  if (relation.type === "character" && relation.slug) {
    return <a className={`lore-relation lore-relation-${relation.type}`} href={routeHref({ page: "character", slug: relation.slug })}>{content}</a>;
  }
  return <span className={`lore-relation lore-relation-${relation.type}`} title={relation.note}>{content}</span>;
}

function WorldMapRegionChip({ region, data }: { region: WorldMapRegion; data: CharacterListData }) {
  const faction = region.factionFilter ? data.factions.find((item) => item.name === region.factionFilter) : undefined;
  const body = (
    <>
      <span className="world-map-region-icon">
        {faction?.icon ? <ImageWithFallback src={faction.icon} alt="" label={region.displayName} /> : region.type === "location" ? "⌖" : "◇"}
      </span>
      <span>
        <small>{region.type}</small>
        <strong>{region.displayName}</strong>
        <em>{region.note}</em>
      </span>
    </>
  );

  if (region.factionFilter) {
    return <a className="world-map-region" href={routeHref({ page: "characters", faction: region.factionFilter })}>{body}</a>;
  }
  return <div className="world-map-region">{body}</div>;
}

function EventDetailLine({ event }: { event: LoreEvent }) {
  if (!event.detailLine?.length) return null;
  return (
    <ol className="lore-detail-line" aria-label={`Detailed sequence for ${event.title}`}>
      {event.detailLine.map((step, index) => (
        <li key={`${step.label}-${step.title}`}>
          <span className="lore-detail-marker">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <small>{step.label}</small>
            <strong>{step.title}</strong>
            <p>{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LorePage({ data }: { data: CharacterListData }) {
  const [mapOpen, setMapOpen] = useState(false);
  const earlyEvents = loreEvents.filter((event) => event.startYear !== undefined && event.startYear < 960);
  const lateEvents = loreEvents.filter((event) => event.startYear !== undefined && event.startYear >= 960);

  return (
    <main className="reference-screen lore-screen">
      <div className="reference-background" aria-hidden="true" />
      <header className="reference-title-band lore-title-band">
        <div>
          <p>World background story</p>
          <h1>Lore Archive</h1>
        </div>
      </header>

      <Navigation current="lore" />

      <section className="reference-intro panel-paper lore-intro">
        <div>
          <span className="reference-kicker">Core world chronology</span>
          <h2>Rodinia, Iria, and the road to RC 999</h2>
          <p>
            This is the guide’s main historical record. Each era is arranged chronologically, with detailed event lines where several political or military developments occur inside the same period.
          </p>
        </div>
        <aside className="lore-era-seal" aria-label="Chronology range">
          <span>Current archive range</span>
          <strong>Ancient Era–RC 999</strong>
          <small>Continental powers · Knight States · Iria crisis</small>
        </aside>
      </section>

      <section className="lore-world-map panel-paper" aria-labelledby="world-map-title">
        <header>
          <div>
            <span className="reference-kicker">World atlas</span>
            <h2 id="world-map-title">Current political map</h2>
            <p>The present map connects the timeline to the major states and named locations currently visible in the game world.</p>
          </div>
          <button className="world-map-expand" type="button" onClick={() => setMapOpen(true)}>Expand map</button>
        </header>
        <button className="world-map-frame" type="button" onClick={() => setMapOpen(true)} aria-label="Open the current world map in a larger view">
          <ImageWithFallback src={worldMapSrc} alt="Current Sword of Convallaria world map showing the Union of Knight States, Kingdom of Iria, Papal States of Rodinia, and Elaman Empire" label="World map" />
          <span>Click to enlarge</span>
        </button>
        <div className="world-map-regions" aria-label="Regions and locations shown on the map">
          {worldMapRegions.map((region) => <WorldMapRegionChip region={region} data={data} key={region.name} />)}
        </div>
      </section>

      <section className="lore-overview panel-paper" aria-label="Lore chronology overview">
        <TimelineStrip title="Foundations and continental powers" min={0} max={960} events={earlyEvents} />
        <TimelineStrip title="The Iria crisis" min={960} max={999} events={lateEvents} />
      </section>

      <section className="lore-archive-layout">
        <div className="lore-event-column">
          <header className="reference-section-heading">
            <div>
              <span>Historical chronology</span>
              <h2>Timeline entries</h2>
            </div>
            <p>{loreEvents.length} connected milestones</p>
          </header>

          <div className="lore-event-list">
            {loreEvents.map((event, index) => (
              <article
                className={`lore-event-card lore-event-${event.accent}${event.milestoneOnly ? " is-milestone" : ""}`}
                id={event.id}
                key={event.id}
                style={{ "--event-accent": accentColor[event.accent] } as CSSProperties}
              >
                <div className="lore-event-date">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{event.dateLabel}</strong>
                </div>
                <div className="lore-event-body">
                  <header>
                    <div>
                      <h3>{event.title}</h3>
                      {event.subtitle && <p>{event.subtitle}</p>}
                    </div>
                    {event.milestoneOnly && <span className="lore-milestone-label">Milestone</span>}
                  </header>
                  <div className="lore-event-copy">
                    {event.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                  <EventDetailLine event={event} />
                  <div className="lore-relations" aria-label={`Related entries for ${event.title}`}>
                    {event.relations.map((relation) => <RelationChip relation={relation} data={data} key={`${relation.type}-${relation.name}`} />)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="lore-side-column">
          <section className="timeline-plan panel-paper lore-structure-guide">
            <span className="reference-kicker">Timeline structure</span>
            <h3>How to read an era</h3>
            <p>Each main card gives the full period summary. A numbered line appears only when the period contains several distinct developments.</p>
            <dl>
              <div><dt>Period</dt><dd>The date range assigned to the main historical event.</dd></div>
              <div><dt>Sequence</dt><dd>Smaller developments shown in the order they occurred inside that period.</dd></div>
              <div><dt>Links</dt><dd>Characters, factions, places, groups, and resources connected to the event.</dd></div>
            </dl>
          </section>

          <section className="timeline-plan panel-paper lore-link-guide">
            <span className="reference-kicker">Connected archive</span>
            <h3>How references work</h3>
            <dl>
              <div><dt>Faction</dt><dd>Opens the Character List with that faction already selected.</dd></div>
              <div><dt>Character</dt><dd>Opens the existing character guide when that unit is available.</dd></div>
              <div><dt>Place</dt><dd>Identifies a map location. Dedicated location pages can be connected later.</dd></div>
              <div><dt>Group</dt><dd>Identifies organisations such as the Knight Council and Hanged Men.</dd></div>
              <div><dt>Resource</dt><dd>Identifies world concepts such as Luxite and the Radiance.</dd></div>
            </dl>
          </section>
        </aside>
      </section>

      <Modal
        open={mapOpen}
        kicker="World atlas"
        title="Current Political Map"
        onClose={() => setMapOpen(false)}
        wide
        variant="lore-world-map-modal"
      >
        <div className="lore-world-map-modal-body">
          <ImageWithFallback src={worldMapSrc} alt="Expanded current Sword of Convallaria world map" label="World map" />
          <p>The map currently provides a readable geographic reference. Interactive coordinates and dedicated location entries can be layered onto this same image later without changing the Lore timeline structure.</p>
        </div>
      </Modal>
    </main>
  );
}
