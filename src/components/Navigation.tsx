import { routeHref } from "../lib/router";
import type { Route } from "../types";

interface Props {
  current: Route["page"];
}

export function Navigation({ current }: Props) {
  return (
    <nav className="page-tabs" aria-label="Guide sections">
      <a className="page-tab" href={routeHref({ page: "characters" })} aria-current={current === "characters" ? "page" : undefined}>
        <span className="page-tab-symbol" aria-hidden="true">♙</span>Characters
      </a>
      <a className="page-tab" href={routeHref({ page: "gear" })} aria-current={current === "gear" ? "page" : undefined}>
        <span className="page-tab-symbol" aria-hidden="true">⚔</span>Gear
      </a>
      <a className="page-tab" href={routeHref({ page: "tarot" })} aria-current={current === "tarot" ? "page" : undefined}>
        <span className="page-tab-symbol" aria-hidden="true">✦</span>Tarot
      </a>
      <a className="page-tab" href={routeHref({ page: "faq" })} aria-current={current === "faq" ? "page" : undefined}>
        <span className="page-tab-symbol" aria-hidden="true">?</span>FAQ
      </a>
      <a className="page-tab" href={routeHref({ page: "lore" })} aria-current={current === "lore" ? "page" : undefined}>
        <span className="page-tab-symbol" aria-hidden="true">⌛</span>Lore
      </a>
    </nav>
  );
}
