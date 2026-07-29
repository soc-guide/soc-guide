import { useEffect, useMemo, useState } from "react";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { MultiSelect } from "../components/MultiSelect";
import { Navigation } from "../components/Navigation";
import { routeHref } from "../lib/router";
import { weaponSymbols } from "../lib/symbols";
import type { CharacterListData, Route } from "../types";
import "../styles/list.css";

export function CharacterListPage({ data, route }: { data: CharacterListData; route?: Extract<Route, { page: "characters" }> }) {
  const [name, setName] = useState(route?.name ?? "");
  const [roles, setRoles] = useState<Set<string>>(new Set());
  const [factions, setFactions] = useState<Set<string>>(() => new Set(route?.faction ? [route.faction] : []));
  const [weapons, setWeapons] = useState<Set<string>>(new Set());

  useEffect(() => {
    setName(route?.name ?? "");
    setFactions(new Set(route?.faction ? [route.faction] : []));
  }, [route?.faction, route?.name]);

  const weaponOptions = useMemo(() => [...new Set(data.characters.map((item) => item.weaponType).filter(Boolean) as string[])]
    .sort()
    .map((value) => ({ value, symbol: weaponSymbols[value] ?? "◇" })), [data.characters]);

  const visible = useMemo(() => {
    const query = name.trim().toLocaleLowerCase();
    return data.characters.filter((character) => (
      (!query || character.name.toLocaleLowerCase().includes(query))
      && (!roles.size || roles.has(character.role))
      && (!factions.size || character.factions.some((faction) => factions.has(faction.name)))
      && (!weapons.size || (character.weaponType ? weapons.has(character.weaponType) : false))
    ));
  }, [data.characters, name, roles, factions, weapons]);

  return (
    <main className="list-screen">
      <div className="list-background" aria-hidden="true" />
      <header className="list-header"><h1>Character List</h1></header>
      <Navigation current="characters" />
      <section className="filter-bar" aria-label="Character filters">
        <label className="filter-field search-field">
          <span>Name</span>
          <input type="search" autoComplete="off" placeholder="Search character name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <MultiSelect
          label="Role"
          fallbackLabel="All roles"
          options={[...data.roles].sort((a, b) => a.name.localeCompare(b.name)).map((item) => ({ value: item.name, icon: item.icon }))}
          selected={roles}
          onChange={setRoles}
        />
        <MultiSelect
          label="Faction"
          fallbackLabel="All factions"
          options={[...data.factions].sort((a, b) => a.name.localeCompare(b.name)).map((item) => ({ value: item.name, icon: item.icon }))}
          selected={factions}
          onChange={setFactions}
        />
        <MultiSelect label="Weapon type" fallbackLabel="All weapon types" options={weaponOptions} selected={weapons} onChange={setWeapons} />
      </section>
      <section className="character-grid" aria-live="polite" aria-label="Characters">
        {visible.map((character) => (
          <a className="character-card" href={routeHref({ page: "character", slug: character.slug })} key={character.slug} aria-label={`Open ${character.name} character guide`}>
            <div className="card-symbols">
              <span className="role-symbol symbol-frame" title={character.role} aria-label={character.role}>
                <ImageWithFallback src={character.roleIcon} alt="" label={character.role} />
              </span>
              <span className="faction-symbols">
                {character.factions.slice(0, 3).map((faction) => (
                  <span className="faction-symbol" title={faction.name} aria-label={faction.name} key={faction.name}>
                    <ImageWithFallback src={faction.icon} alt="" label={faction.name} fallbackClassName="faction-fallback" />
                  </span>
                ))}
              </span>
            </div>
            <div className="pixel-stage">
              {character.pixelArt ? <ImageWithFallback className="pixel-art" src={character.pixelArt} alt={`${character.name} pixel art`} label={character.name} /> : <span className="pixel-art is-missing" />}
            </div>
            <h2 className="character-name">{character.name}</h2>
          </a>
        ))}
      </section>
      {!visible.length && <p className="empty-state">No characters match the selected filters.</p>}
    </main>
  );
}
