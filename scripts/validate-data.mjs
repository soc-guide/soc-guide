import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "public/data");
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

async function read(name) {
  const text = await readFile(resolve(root, name), "utf8");
  return JSON.parse(text);
}

const [list, details, gear, tarot] = await Promise.all([
  read("character-list.json"),
  read("character-details.json"),
  read("gear-list.json"),
  read("tarot-list.json"),
]);

assert(Array.isArray(list.characters), "character-list.json: characters must be an array");
assert(details.characters && typeof details.characters === "object", "character-details.json: characters must be an object");
assert(Array.isArray(gear.items), "gear-list.json: items must be an array");
assert(Array.isArray(tarot.items), "tarot-list.json: items must be an array");

const ids = new Set();
const slugs = new Set();
const requiredStats = ["PATK", "MATK", "PDEF", "MDEF", "HP", "SPD"];

for (const [index, character] of (list.characters ?? []).entries()) {
  const where = `character-list.json characters[${index}]`;
  assert(typeof character.id === "string" && character.id.length > 0, `${where}: missing id`);
  assert(typeof character.slug === "string" && character.slug.length > 0, `${where}: missing slug`);
  assert(typeof character.name === "string" && character.name.length > 0, `${where}: missing name`);
  assert(!ids.has(character.id), `${where}: duplicate id ${character.id}`);
  assert(!slugs.has(character.slug), `${where}: duplicate slug ${character.slug}`);
  ids.add(character.id);
  slugs.add(character.slug);
  assert(Boolean(details.characters?.[character.slug]), `${where}: no matching detail record`);
}

for (const [slug, character] of Object.entries(details.characters ?? {})) {
  const where = `character-details.json characters.${slug}`;
  assert(character.slug === slug, `${where}: slug field must match its object key`);
  assert(typeof character.name === "string" && character.name.length > 0, `${where}: missing name`);

  const currentLevel = character.level?.current;
  const maxLevel = character.level?.max;
  if (currentLevel != null) assert(currentLevel >= 1 && currentLevel <= 60, `${where}: current level must be 1-60`);
  if (maxLevel != null) assert(maxLevel >= 1 && maxLevel <= 60, `${where}: max level must be 1-60`);

  const currentRank = character.rank?.current;
  const maxRank = character.rank?.max;
  if (currentRank != null) assert(currentRank >= 1 && currentRank <= 13, `${where}: current rank must be 1-13`);
  if (maxRank != null) assert(maxRank >= 1 && maxRank <= 13, `${where}: max rank must be 1-13`);

  const stars = character.trait?.stars;
  if (stars != null) assert(stars >= 1 && stars <= 5, `${where}: trait stars must be 1-5`);
  for (const level of character.trait?.levels ?? []) {
    assert(level.stars >= 1 && level.stars <= 5, `${where}: trait level stars must be 1-5`);
  }

  for (const stat of requiredStats) {
    const value = character.attributes?.[stat];
    assert(value == null || typeof value === "number", `${where}: ${stat} must be numeric or null`);
  }

  const classSkills = character.equippedSkills?.classSkills;
  assert(Array.isArray(classSkills), `${where}: equipped classSkills must be an array`);
  if (Array.isArray(classSkills)) {
    assert(classSkills.length === 3, `${where}: equipped classSkills must have exactly 3 slots`);
  }
}

for (const slug of Object.keys(details.characters ?? {})) {
  assert(slugs.has(slug), `character-details.json: ${slug} is missing from character-list.json`);
}

if (errors.length) {
  console.error(`Data validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Validated ${list.characters.length} characters, ${gear.items.length} gear items, and ${tarot.items.length} tarot items.`,
);
