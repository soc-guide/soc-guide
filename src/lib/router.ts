import type { Route } from "../types";

export function parseRoute(hash = window.location.hash): Route {
  const clean = hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  const [path, query = ""] = clean.split("?", 2);
  const params = new URLSearchParams(query);

  if (!path || path === "characters") {
    const faction = params.get("faction")?.trim() || undefined;
    const name = params.get("name")?.trim() || undefined;
    return { page: "characters", faction, name };
  }
  if (path === "gear") return { page: "gear" };
  if (path === "tarot") return { page: "tarot" };
  if (path === "faq" || path === "reference" || path === "faq-lore") return { page: "faq" };
  if (path === "lore" || path === "timeline") return { page: "lore" };
  if (path.startsWith("character/")) {
    return { page: "character", slug: decodeURIComponent(path.slice("character/".length)) };
  }
  return { page: "characters" };
}

export function routeHref(route: Route): string {
  if (route.page === "characters") {
    const params = new URLSearchParams();
    if (route.faction) params.set("faction", route.faction);
    if (route.name) params.set("name", route.name);
    const query = params.toString();
    return `#/characters${query ? `?${query}` : ""}`;
  }
  if (route.page === "character") return `#/character/${encodeURIComponent(route.slug)}`;
  return `#/${route.page}`;
}
