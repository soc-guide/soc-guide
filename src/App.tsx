import { useEffect, useState } from "react";
import { EffectTooltipProvider } from "./components/EffectText";
import { ErrorState, Loading } from "./components/Loading";
import { loadGuideData } from "./lib/data";
import { parseRoute } from "./lib/router";
import { CharacterDetailPage } from "./pages/CharacterDetailPage";
import { CharacterListPage } from "./pages/CharacterListPage";
import { FaqPage } from "./pages/FaqPage";
import { GearPage } from "./pages/GearPage";
import { LorePage } from "./pages/LorePage";
import { TarotPage } from "./pages/TarotPage";
import type { GuideData, Route } from "./types";
import "./styles/react.css";

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [data, setData] = useState<GuideData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!window.location.hash) window.location.hash = "#/characters";
    const onHash = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    loadGuideData().then(setData).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Guide data could not be loaded.");
    });
  }, []);

  useEffect(() => {
    const pageTitle = route.page === "character"
      ? "Character"
      : route.page === "faq"
        ? "FAQ"
        : route.page === "lore"
          ? "Lore Timeline"
          : route.page[0]?.toUpperCase() + route.page.slice(1);
    document.title = `${pageTitle} — Sword of Convallaria Guide`;
    window.scrollTo({ top: 0 });
  }, [route]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <Loading />;

  let page;
  if (route.page === "characters") page = <CharacterListPage data={data.list} route={route} />;
  else if (route.page === "gear") page = <GearPage data={data.gear} />;
  else if (route.page === "tarot") page = <TarotPage data={data.tarot} />;
  else if (route.page === "faq") page = <FaqPage />;
  else if (route.page === "lore") page = <LorePage data={data.list} />;
  else {
    const character = data.details.characters[route.slug];
    page = character ? (
      <CharacterDetailPage character={character} allCharacters={data.details.characters} gearCatalog={data.gear} tarotCatalog={data.tarot} />
    ) : <ErrorState message={`Character “${route.slug}” was not found.`} />;
  }

  const referenceClass = route.page === "faq" || route.page === "lore" ? " page-reference" : "";

  return (
    <EffectTooltipProvider>
      <div className={`guide-app page-${route.page}${referenceClass}`}>{page}</div>
    </EffectTooltipProvider>
  );
}
