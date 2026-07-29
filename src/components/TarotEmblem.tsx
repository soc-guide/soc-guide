import { romanByCode } from "../lib/symbols";
import type { TarotItem } from "../types";
import { ImageWithFallback } from "./ImageWithFallback";

export function TarotEmblem({ item, compact = false }: { item: TarotItem; compact?: boolean }) {
  if (item.icon) {
    return <ImageWithFallback className={compact ? "tarot-image tarot-image-compact" : "tarot-image"} src={item.icon} alt={`${item.name ?? "Tarot"} Tarot image`} label={item.name ?? "Tarot"} />;
  }
  return (
    <span className={`tarot-emblem ${compact ? "tarot-emblem-compact" : ""}`} aria-hidden="true">
      <span className="tarot-roman">{romanByCode[item.iconCode ?? ""] ?? "✦"}</span>
      <span className="tarot-code">{String(item.iconCode ?? "Tarot").replaceAll("-", " ")}</span>
    </span>
  );
}
