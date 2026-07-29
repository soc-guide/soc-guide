# Data model

SOC Guide currently publishes four generated JSON snapshots.

## Character list

`public/data/character-list.json` contains filter metadata and lightweight
character cards. Important fields include `id`, `slug`, `name`, `rarity`,
`role`, `factions`, `weaponType`, release metadata, and pixel art.

## Character details

`public/data/character-details.json` is keyed by character slug. A record may
contain:

- level up to 60 and rank up to 13
- one or more factions
- trait levels from 1 to 5 stars
- PATK, MATK, PDEF, MDEF, HP, and SPD
- bond progress
- main, awakened, and pixel artwork
- weapon, trinket, and tarot selections
- basic attack, reaction, three class-skill slots, and a rank-13/unique slot
- the rank skill tree, effect definitions, sources, and future extensions

Some records intentionally contain unavailable placeholders when the source
workbook has not supplied a value. UI code must render those states safely.

## Gear and tarot catalogs

`gear-list.json` and `tarot-list.json` contain catalog metadata, item effects,
star-level effects, tags, definitions, and configurable loadout stat slots.

## Validation policy

`npm run validate:data` checks top-level structure, unique character IDs/slugs,
list/detail consistency, level/rank/star bounds, required attributes, equipped
skill slot shape, and catalog item arrays. It is intentionally tolerant of
known incomplete records but rejects structural corruption.
