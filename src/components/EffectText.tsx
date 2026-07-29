import {
  createContext,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { Definition } from "../types";
import { normalized } from "../lib/text";

const builtIns: Definition[] = [
  { name: "Basic Attack", detail: "A character's standard attack. It normally does not consume NRG." },
  { name: "Class Skill", detail: "A skill equipped in one of the character's class-skill slots." },
  { name: "Reaction", detail: "A skill that triggers in response to a specified action or condition." },
  { name: "Passive", detail: "An effect that remains active or triggers automatically without being cast." },
  { name: "Aura", detail: "A continuous effect that applies within the stated area while its source is active." },
  { name: "Instant", detail: "After casting an Instant skill, the character can continue acting with any remaining movement." },
  { name: "Healing", detail: "Restores HP. The amount and target rules are defined by the skill or effect." },
  { name: "Heal", detail: "Restores HP. The amount and target rules are defined by the skill or effect." },
  { name: "Buff", detail: "A beneficial status effect applied to a unit." },
  { name: "Debuff", detail: "A harmful status effect applied to a unit." },
  { name: "Physical DMG", detail: "Damage calculated as physical damage and generally resisted by P.DEF." },
  { name: "Magical DMG", detail: "Damage calculated as magical damage and generally resisted by M.DEF." },
  { name: "Piercing DMG", detail: "Direct damage that ignores the target's P.DEF and M.DEF." },
];

interface TooltipState {
  name: string;
  detail: string;
  x: number;
  y: number;
  pinned: boolean;
}

interface TooltipContextValue {
  tooltip: TooltipState | null;
  show: (definition: Definition, event: PointerEvent<HTMLElement> | MouseEvent<HTMLElement>, pinned?: boolean) => void;
  move: (event: PointerEvent<HTMLElement>) => void;
  hide: (force?: boolean) => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function EffectTooltipProvider({ children }: { children: ReactNode }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const show = (definition: Definition, event: PointerEvent<HTMLElement> | MouseEvent<HTMLElement>, pinned = false) => {
    setTooltip({ name: definition.name, detail: definition.detail, x: event.clientX, y: event.clientY, pinned });
  };
  const move = (event: PointerEvent<HTMLElement>) => {
    setTooltip((current) => current && !current.pinned ? { ...current, x: event.clientX, y: event.clientY } : current);
  };
  const hide = (force = false) => setTooltip((current) => current?.pinned && !force ? current : null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTooltip(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <TooltipContext.Provider value={{ tooltip, show, move, hide }}>
      <div
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest(".effect-term-interactive") || target.closest(".effect-term-tooltip")) return;
          hide(true);
        }}
      >
        {children}
      </div>
      {tooltip && <EffectTooltip tooltip={tooltip} />}
    </TooltipContext.Provider>
  );
}

function EffectTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (typeof document === "undefined") return null;
  // A modal <dialog> lives in the browser's top layer. Portaling the tooltip
  // into that open dialog keeps it above the modal instead of behind it.
  const host = document.querySelector<HTMLElement>("dialog[open] .modal-tooltip-layer") ?? document.body;
  return createPortal(<EffectTooltipSurface tooltip={tooltip} host={host} />, host);
}

function EffectTooltipSurface({ tooltip, host }: { tooltip: TooltipState; host: HTMLElement }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ left: tooltip.x + 14, top: tooltip.y + 14, ready: false });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const gap = 14;
    const edge = 10;
    const tooltipRect = element.getBoundingClientRect();
    const dialog = host.closest<HTMLDialogElement>("dialog[open]");
    const hostRect = dialog
      ? dialog.getBoundingClientRect()
      : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    const modalInset = dialog ? 8 : 0;

    const minLeft = Math.max(edge, hostRect.left + modalInset);
    const maxRight = Math.min(window.innerWidth - edge, hostRect.right - modalInset);
    const minTop = Math.max(edge, hostRect.top + modalInset);
    const maxBottom = Math.min(window.innerHeight - edge, hostRect.bottom - modalInset);

    let left = tooltip.x + gap;
    if (left + tooltipRect.width > maxRight) left = tooltip.x - tooltipRect.width - gap;
    left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxRight - tooltipRect.width));

    const below = tooltip.y + gap;
    const above = tooltip.y - tooltipRect.height - gap;
    let top = below;
    if (below + tooltipRect.height > maxBottom && above >= minTop) top = above;
    top = Math.min(Math.max(top, minTop), Math.max(minTop, maxBottom - tooltipRect.height));

    setPosition({ left, top, ready: true });
  }, [host, tooltip.detail, tooltip.name, tooltip.x, tooltip.y]);

  return (
    <div
      ref={ref}
      className={`effect-term-tooltip ${tooltip.pinned ? "is-pinned" : ""}`}
      role="tooltip"
      style={{ left: position.left, top: position.top, visibility: position.ready ? "visible" : "hidden" }}
    >
      <strong className="effect-term-tooltip-title">{tooltip.name}</strong>
      <p className="effect-term-tooltip-body">{tooltip.detail}</p>
    </div>
  );
}

interface EffectTextProps {
  text?: string;
  definitions?: Definition[];
  className?: string;
  as?: "span" | "p" | "div";
}

export function EffectText({ text = "", definitions = [], className = "", as: Tag = "span" }: EffectTextProps) {
  const context = useContext(TooltipContext);
  const map = useMemo(() => {
    const result = new Map<string, Definition>();
    [...builtIns, ...definitions].forEach((item) => {
      if (item?.name && item?.detail) result.set(normalized(item.name), item);
    });
    return result;
  }, [definitions]);

  const chunks: ReactNode[] = [];
  const pattern = /\[([^\[\]]+)\]/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) chunks.push(text.slice(cursor, match.index));
    const term = match[1]?.trim() ?? "";
    const definition = map.get(normalized(term));
    const active = Boolean(definition && context?.tooltip?.name === definition.name);
    chunks.push(definition && context ? (
      <button
        type="button"
        key={`${match.index}-${term}`}
        className={`effect-term effect-term-interactive ${classify(term, definition)}`}
        onPointerEnter={(event) => context.show(definition, event)}
        onPointerMove={context.move}
        onPointerLeave={() => context.hide(false)}
        onClick={(event) => {
          event.stopPropagation();
          context.show(definition, event, true);
        }}
        aria-expanded={active}
        aria-label={`${term}: ${definition.detail}`}
      >
        [{term}]
      </button>
    ) : (
      <span key={`${match.index}-${term}`} className={`effect-term ${classify(term, definition)}`}>[{term}]</span>
    ));
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length) chunks.push(text.slice(cursor));
  return <Tag className={className}>{chunks}</Tag>;
}

function classify(term: string, definition?: Definition): string {
  const value = normalized(term);
  const detail = normalized(definition?.detail ?? "");
  const detailLead = detail.slice(0, 120);

  // Green: recovery and definitions explicitly identified as beneficial buffs.
  if (/heal|healing|recover|regeneration|life steal|restoration/.test(value)
      || /^(?:\[?buff\]?|beneficial status|positive effect)/.test(detailLead)) {
    return "effect-term-positive";
  }

  // Orange/red: harmful statuses and definitions explicitly identified as debuffs.
  if (/debuff|vulnerable|disarm|sleep|poison|burn|infection|stun|silence|frostbite|nightmare/.test(value)
      || /^(?:\[?debuff\]?|harmful status)/.test(detailLead)) {
    return "effect-term-negative";
  }

  // Blue: game-system terms, actions, skill categories, damage types, and tiles.
  if (/basic attack|class skill|reaction|passive|aura|instant|physical dmg|magical dmg|piercing dmg|movement|nrg|cooldown|summoned unit|casting/.test(value)
      || /^(?:\[?(?:tile|skill|damage type)\]?)/.test(detailLead)) {
    return "effect-term-system";
  }

  // Gold: named skills, marks, unique statuses, objects, and other defined terms.
  return "effect-term-defined";
}
