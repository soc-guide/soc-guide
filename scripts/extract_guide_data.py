from __future__ import annotations

import argparse
import json
import re
import unicodedata
import zipfile
from datetime import date
from pathlib import Path
import xml.etree.ElementTree as ET

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"m": MAIN_NS, "r": REL_NS}
EMOJI_PATTERN = re.compile(r"<a?:[^:>]+:(\d+)>")
BRACKET_TERM_PATTERN = re.compile(r"\[([^\[\]]+)\]")


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")


def normalize_name(value: object) -> str:
    text = str(value or "").strip().replace("’", "'").replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", text).casefold()


def clean_wrapping_quotes(value: object) -> str:
    text = str(value or "").strip()
    if len(text) >= 2 and text[0] == text[-1] and text[0] in {'"', "'"}:
        return text[1:-1].strip()
    return text


def emoji_url(raw_value: object) -> str:
    match = EMOJI_PATTERN.search(str(raw_value or ""))
    return "" if not match else f"https://cdn.discordapp.com/emojis/{match.group(1)}.png?size=128&quality=lossless"


def number_or_none(value: object) -> int | float | None:
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        return value
    try:
        number = float(str(value))
        return int(number) if number.is_integer() else number
    except (TypeError, ValueError):
        return None


def bool_or_none(value: object) -> bool | None:
    if isinstance(value, bool):
        return value
    if value in (None, ""):
        return None
    text = str(value).strip().casefold()
    if text in {"true", "yes", "1"}:
        return True
    if text in {"false", "no", "0"}:
        return False
    return None


def split_multi_value(value: object) -> list[str]:
    text = str(value or "").strip()
    if not text:
        return []
    output: list[str] = []
    seen: set[str] = set()
    for part in re.split(r"[,\n]", text):
        item = part.strip()
        key = normalize_name(item)
        if item and key not in seen:
            output.append(item)
            seen.add(key)
    return output


def cell_column(reference: str) -> int:
    match = re.match(r"([A-Z]+)", reference)
    if not match:
        raise ValueError(f"Invalid cell reference: {reference}")
    value = 0
    for character in match.group(1):
        value = value * 26 + ord(character) - 64
    return value - 1


class XlsxReader:
    def __init__(self, path: Path):
        self.archive = zipfile.ZipFile(path)
        self.shared_strings = self._read_shared_strings()
        self.sheet_paths = self._read_sheet_paths()

    def close(self) -> None:
        self.archive.close()

    def _read_shared_strings(self) -> list[str]:
        if "xl/sharedStrings.xml" not in self.archive.namelist():
            return []
        root = ET.fromstring(self.archive.read("xl/sharedStrings.xml"))
        return [
            "".join(node.text or "" for node in item.iter(f"{{{MAIN_NS}}}t"))
            for item in root.findall(f"{{{MAIN_NS}}}si")
        ]

    def _read_sheet_paths(self) -> dict[str, str]:
        workbook = ET.fromstring(self.archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(self.archive.read("xl/_rels/workbook.xml.rels"))
        relation_map = {node.attrib["Id"]: node.attrib["Target"] for node in relationships}
        result: dict[str, str] = {}
        sheets = workbook.find(f"{{{MAIN_NS}}}sheets")
        if sheets is None:
            return result
        for sheet in sheets:
            relation_id = sheet.attrib[f"{{{REL_NS}}}id"]
            target = relation_map[relation_id]
            if not target.startswith("xl/"):
                target = f"xl/{target}"
            result[sheet.attrib["name"]] = target
        return result

    def read_sheet(self, name: str) -> list[list[object]]:
        path = self.sheet_paths.get(name)
        if not path:
            return []
        root = ET.fromstring(self.archive.read(path))
        sheet_data = root.find(f"{{{MAIN_NS}}}sheetData")
        if sheet_data is None:
            return []
        output: list[list[object]] = []
        for row_element in sheet_data.findall(f"{{{MAIN_NS}}}row"):
            values: dict[int, object] = {}
            for cell in row_element.findall(f"{{{MAIN_NS}}}c"):
                index = cell_column(cell.attrib["r"])
                cell_type = cell.attrib.get("t")
                value_element = cell.find(f"{{{MAIN_NS}}}v")
                inline = cell.find(f"{{{MAIN_NS}}}is")
                value: object = None
                if cell_type == "s" and value_element is not None:
                    value = self.shared_strings[int(value_element.text or "0")]
                elif cell_type == "inlineStr" and inline is not None:
                    value = "".join(node.text or "" for node in inline.iter(f"{{{MAIN_NS}}}t"))
                elif cell_type == "b" and value_element is not None:
                    value = value_element.text == "1"
                elif cell_type == "str" and value_element is not None:
                    value = value_element.text or ""
                elif value_element is not None:
                    raw = value_element.text or ""
                    try:
                        numeric = float(raw)
                        value = int(numeric) if numeric.is_integer() else numeric
                    except ValueError:
                        value = raw
                values[index] = value
            if values:
                output.append([values.get(index) for index in range(max(values) + 1)])
            else:
                output.append([])
        return output


def value(row: list[object], index: int, default: object = None) -> object:
    return row[index] if index < len(row) else default


def icon_mappings(rows: list[list[object]]) -> tuple[dict[str, str], dict[str, str]]:
    roles: dict[str, str] = {}
    factions: dict[str, str] = {}
    for row in rows[1:]:
        role = str(value(row, 0, "") or "").strip()
        faction = str(value(row, 3, "") or "").strip()
        if role:
            roles[role] = emoji_url(value(row, 1, ""))
        if faction:
            factions[faction] = emoji_url(value(row, 4, ""))
    return roles, factions


def detail_info_map(rows: list[list[object]]) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}
    for row in rows[1:]:
        name = str(value(row, 0, "") or "").strip()
        detail = str(value(row, 1, "") or "").strip()
        if not name or not detail:
            continue
        result.setdefault(normalize_name(name), {"name": name, "detail": detail})
    return result


def skill_detail_terms(record: dict[str, object], detail_info: dict[str, dict[str, str]]) -> tuple[list[str], list[dict[str, str]]]:
    candidates: list[str] = []

    skill_type = str(record.get("type") or "").strip()
    if skill_type:
        candidates.append(skill_type)

    sub_detail = str(record.get("subDetail") or "").strip()
    if sub_detail:
        candidates.extend(part.strip() for part in sub_detail.split(",") if part.strip())

    description = str(record.get("description") or "")
    candidates.extend(term.strip() for term in BRACKET_TERM_PATTERN.findall(description) if term.strip())

    tags: list[str] = []
    definitions: list[dict[str, str]] = []
    seen_tags: set[str] = set()
    seen_definitions: set[str] = set()
    for candidate in candidates:
        key = normalize_name(candidate)
        if not key:
            continue
        if key not in seen_tags:
            tags.append(candidate)
            seen_tags.add(key)
        definition = detail_info.get(key)
        if definition and key not in seen_definitions:
            definitions.append(definition)
            seen_definitions.add(key)

    return tags, definitions


def content_detail_terms(
    texts: list[object],
    explicit_tags: list[object],
    detail_info: dict[str, dict[str, str]],
) -> tuple[list[str], list[dict[str, str]]]:
    candidates: list[str] = []
    for raw in explicit_tags:
        candidates.extend(split_multi_value(raw))
    for raw in texts:
        candidates.extend(term.strip() for term in BRACKET_TERM_PATTERN.findall(str(raw or "")) if term.strip())

    tags: list[str] = []
    definitions: list[dict[str, str]] = []
    seen_tags: set[str] = set()
    seen_definitions: set[str] = set()
    for candidate in candidates:
        key = normalize_name(candidate)
        if not key:
            continue
        if key not in seen_tags:
            tags.append(candidate)
            seen_tags.add(key)
        definition = detail_info.get(key)
        if definition and key not in seen_definitions:
            definitions.append(definition)
            seen_definitions.add(key)
    return tags, definitions


def skill_records(rows: list[list[object]], detail_info: dict[str, dict[str, str]]) -> dict[str, list[dict[str, object]]]:
    records: dict[str, list[dict[str, object]]] = {}
    for row in rows[1:]:
        name = str(value(row, 0, "") or "").strip()
        if not name:
            continue
        record = {
            "name": name,
            "category": str(value(row, 1, "") or "").strip(),
            "type": str(value(row, 2, "") or "").strip(),
            "iconCode": str(value(row, 3, "") or "").strip(),
            "icon": str(value(row, 4, "") or "").strip(),
            "description": str(value(row, 5, "") or "").strip(),
            "subDetail": str(value(row, 6, "") or "").strip(),
            "nrgCost": number_or_none(value(row, 7)),
            "cooldown": number_or_none(value(row, 8)),
            # This flag means the skill belongs to a particular character; it is not the UI category.
            "isUnique": str(value(row, 9, "") or "").strip().casefold() == "yes",
            "target": str(value(row, 10, "") or "").strip(),
        }
        tags, definitions = skill_detail_terms(record, detail_info)
        record["tags"] = tags
        record["detailInfo"] = definitions
        record["isInstant"] = any(normalize_name(tag) == "instant" for tag in tags)
        records.setdefault(normalize_name(name), []).append(record)
    return records


def resolve_skill(name: object, character_name: str, records: dict[str, list[dict[str, object]]]) -> dict[str, object] | None:
    skill_name = str(name or "").strip()
    if not skill_name:
        return None
    matches = records.get(normalize_name(skill_name), [])
    selected: dict[str, object] | None = None
    character_key = normalize_name(character_name)
    for record in matches:
        target = normalize_name(record.get("target"))
        if target and (character_key in target or target in character_key):
            selected = record
            break
    if selected is None and matches:
        selected = matches[0]
    if selected is None:
        return {"name": skill_name, "icon": "", "description": ""}
    return {key: item for key, item in selected.items() if key != "target"}


def trait_map(
    rows: list[list[object]],
    detail_info: dict[str, dict[str, str]],
) -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    for row in rows[2:]:
        character_name = str(value(row, 0, "") or "").strip()
        if not character_name:
            continue
        trait_name = str(value(row, 1, "") or "").strip()
        icon = str(value(row, 2, "") or "").strip()
        levels: list[dict[str, object]] = []
        for stars in range(1, 6):
            description = str(value(row, 3 + (stars - 1) * 2, "") or "").strip()
            additional = str(value(row, 4 + (stars - 1) * 2, "") or "").strip()
            if description or additional:
                levels.append({"stars": stars, "description": description, "additional": additional})
        available = bool(trait_name or icon or levels)
        summary = ""
        if levels:
            summary = str(levels[-1].get("description") or "")
        trait_texts = [item.get("description", "") for item in levels]
        trait_texts.extend(item.get("additional", "") for item in levels)
        _, definitions = content_detail_terms(trait_texts, [], detail_info)
        result[normalize_name(character_name)] = {
            "available": available,
            "name": trait_name or "Trait data unavailable",
            "icon": icon,
            "stars": 5 if available else None,
            "maxStars": 5,
            "summary": summary,
            "levels": levels,
            "detailInfo": definitions,
        }
    return result


def character_skill_map(rows: list[list[object]], skills: dict[str, list[dict[str, object]]]) -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    rank_columns = {1: (3, 4), 3: (5, 6), 5: (7, 8), 7: (9, 10), 9: (11, 12), 11: (13, 14)}
    for row in rows[2:]:
        character_name = str(value(row, 0, "") or "").strip()
        if not character_name:
            continue
        tree: list[dict[str, object]] = []
        for rank, columns in rank_columns.items():
            choices = [resolve_skill(value(row, column), character_name, skills) for column in columns]
            choices = [choice for choice in choices if choice]
            if choices:
                tree.append({"rank": rank, "skills": choices})
        rank_13_names = [value(row, 15), value(row, 16)]
        rank_13_skills = [resolve_skill(item, character_name, skills) for item in rank_13_names]
        rank_13_skills = [item for item in rank_13_skills if item]
        if rank_13_skills:
            tree.append({"rank": 13, "skills": rank_13_skills})
        result[normalize_name(character_name)] = {
            "basicAttack": resolve_skill(value(row, 1), character_name, skills),
            "baseSkill": resolve_skill(value(row, 2), character_name, skills),
            "skillTree": tree,
            "unique": rank_13_skills[-1] if rank_13_skills else None,
        }
    return result


def equipment_map(rows: list[list[object]]) -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    for row in rows[2:]:
        raw_name = str(value(row, 0, "") or "").strip()
        if not raw_name:
            continue
        name = clean_wrapping_quotes(raw_name)
        image_value = str(value(row, 1, "") or "").strip()
        icon_is_url = image_value.startswith("http://") or image_value.startswith("https://")
        icon_code = "" if icon_is_url else image_value
        descriptions = [str(value(row, index, "") or "").strip() for index in (6, 8, 10, 12, 14)]
        effect = next((item for item in reversed(descriptions) if item), "")
        record = {
            "name": name,
            "icon": image_value if icon_is_url else (f"https://raw.githubusercontent.com/camelot-x/unit-equipment-images/main/{icon_code}.png" if icon_code else ""),
            "rarity": str(value(row, 2, "") or "").strip(),
            "equipmentType": str(value(row, 3, "") or "").strip(),
            "isSignature": bool_or_none(value(row, 4)),
            "lore": str(value(row, 5, "") or "").strip(),
            "effect": effect,
            "stars": 5 if effect else None,
            "level": 60,
        }
        result[normalize_name(raw_name)] = record
        result.setdefault(normalize_name(name), record)
    return result


def tarot_map(rows: list[list[object]]) -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    for row in rows[1:]:
        raw_name = str(value(row, 0, "") or "").strip()
        if not raw_name:
            continue
        name = clean_wrapping_quotes(raw_name)
        effect = str(value(row, 3, "") or "").strip()
        special = str(value(row, 4, "") or "").strip()
        result[normalize_name(name)] = {
            "name": name,
            "icon": "",
            "imageCode": str(value(row, 1, "") or "").strip(),
            "usage": str(value(row, 2, "") or "").strip(),
            "effect": effect,
            "slot4Effect": special,
            "slot4Type": str(value(row, 5, "") or "").strip(),
            "purpose": str(value(row, 6, "") or "").strip(),
            "recommendedFor": str(value(row, 7, "") or "").strip(),
            "stars": 5,
            "level": 60,
        }
    return result


def equipment_stat_map(rows: list[list[object]]) -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    for row in rows[1:]:
        equipment_id = str(value(row, 0, "") or "").strip()
        name = str(value(row, 1, "") or "").strip()
        if not equipment_id and not name:
            continue
        record = {
            "PATK": number_or_none(value(row, 9)),
            "MATK": number_or_none(value(row, 10)),
            "PDEF": number_or_none(value(row, 11)),
            "MDEF": number_or_none(value(row, 12)),
            "HP": number_or_none(value(row, 13)),
        }
        if equipment_id:
            result[normalize_name(equipment_id)] = record
        if name:
            result[normalize_name(name)] = record
    return result


def equipment_catalog(
    rows: list[list[object]],
    detail_info: dict[str, dict[str, str]],
    stat_rows: list[list[object]],
) -> dict[str, object]:
    stat_map = equipment_stat_map(stat_rows)
    items: list[dict[str, object]] = []
    for row in rows[2:]:
        raw_name = str(value(row, 0, "") or "").strip()
        if not raw_name:
            continue
        name = clean_wrapping_quotes(raw_name)
        icon_code = str(value(row, 1, "") or "").strip()
        rarity = str(value(row, 2, "") or "").strip() or "Unknown"
        raw_type = str(value(row, 3, "") or "").strip()
        category = "TRINKET" if normalize_name(raw_type) == "trinket" else "WEAPON"
        levels: list[dict[str, object]] = []
        all_texts: list[object] = []
        all_additional: list[object] = []
        for stars in range(1, 6):
            effect = str(value(row, 6 + ((stars - 1) * 2), "") or "").strip()
            additional = str(value(row, 7 + ((stars - 1) * 2), "") or "").strip()
            tags, definitions = content_detail_terms([effect], [additional], detail_info)
            levels.append({
                "stars": stars,
                "effect": effect,
                "additional": additional,
                "tags": tags,
                "detailInfo": definitions,
            })
            all_texts.append(effect)
            all_additional.append(additional)

        tags, definitions = content_detail_terms(all_texts, all_additional, detail_info)
        stats = stat_map.get(normalize_name(icon_code)) or stat_map.get(normalize_name(name)) or {}
        items.append({
            "id": icon_code or slugify(name),
            "slug": slugify(name),
            "name": name,
            "iconCode": icon_code,
            "icon": f"https://raw.githubusercontent.com/camelot-x/unit-equipment-images/main/{icon_code}.png" if icon_code else "",
            "rarity": rarity,
            "category": category,
            "weaponType": raw_type if category == "WEAPON" else "",
            "isSignature": bool_or_none(value(row, 4)) is True,
            "lore": str(value(row, 5, "") or "").strip(),
            "maxLevel": 60,
            "maxStats": stats,
            "levels": levels,
            "tags": tags,
            "detailInfo": definitions,
        })

    return {
        "source": {
            "spreadsheetId": "1xizGBhuAb6ZvsoZ49dfSFcCf3EjOX1JramFsXAZLbsU",
            "sheet": "Copy of Weapon & Trinket",
            "snapshotDate": date.today().isoformat(),
        },
        "rarities": sorted({str(item["rarity"]) for item in items if item.get("rarity")}),
        "categories": ["WEAPON", "TRINKET"],
        "weaponTypes": sorted({str(item["weaponType"]) for item in items if item.get("weaponType")}),
        "items": items,
    }


def tarot_catalog(
    rows: list[list[object]],
    detail_info: dict[str, dict[str, str]],
) -> dict[str, object]:
    items: list[dict[str, object]] = []
    for index, row in enumerate(rows[1:], start=1):
        name = str(value(row, 0, "") or "").strip()
        if not name:
            continue
        image_value = str(value(row, 1, "") or "").strip()
        icon_is_url = image_value.startswith("http://") or image_value.startswith("https://")
        icon_code = "" if icon_is_url else image_value
        effect = str(value(row, 3, "") or "").strip()
        slot4_effect = str(value(row, 4, "") or "").strip()
        tags, definitions = content_detail_terms([effect, slot4_effect], [], detail_info)
        usage = split_multi_value(value(row, 2))
        slot4_types = split_multi_value(value(row, 5))
        purposes = split_multi_value(value(row, 6))
        items.append({
            "id": f"TAROT-{index:03d}",
            "slug": slugify(name),
            "name": name,
            "iconCode": icon_code,
            "icon": image_value if icon_is_url else "",
            "usage": usage,
            "effect": effect,
            "slot4Effect": slot4_effect,
            "slot4Types": slot4_types,
            "purposes": purposes,
            "recommendedFor": str(value(row, 7, "") or "").strip(),
            "tags": tags,
            "detailInfo": definitions,
        })

    return {
        "source": {
            "spreadsheetId": "1xizGBhuAb6ZvsoZ49dfSFcCf3EjOX1JramFsXAZLbsU",
            "sheet": "Tarot",
            "snapshotDate": date.today().isoformat(),
        },
        "usage": sorted({tag for item in items for tag in item.get("usage", [])}),
        "purposes": sorted({tag for item in items for tag in item.get("purposes", [])}),
        "slot4Types": sorted({tag for item in items for tag in item.get("slot4Types", [])}),
        "items": items,
    }


def build_map(
    rows: list[list[object]],
    skills: dict[str, list[dict[str, object]]],
    equipment: dict[str, dict[str, object]],
    tarots: dict[str, dict[str, object]],
) -> dict[str, list[dict[str, object]]]:
    result: dict[str, list[dict[str, object]]] = {}
    for row in rows[2:]:
        character_name = str(value(row, 0, "") or "").strip()
        build_name = str(value(row, 1, "") or "").strip()
        if not character_name or not build_name:
            continue
        class_skills = [resolve_skill(value(row, index), character_name, skills) for index in (5, 6, 7)]
        build = {
            "name": build_name,
            "description": str(value(row, 2, "") or "").strip(),
            "equippedSkills": {
                "basicAttack": resolve_skill(value(row, 3), character_name, skills),
                "reaction": resolve_skill(value(row, 4), character_name, skills),
                "classSkills": class_skills,
                "unique": None,
            },
            "gear": {
                "weapon": equipment.get(normalize_name(value(row, 8))),
                "trinket": equipment.get(normalize_name(value(row, 9))),
                "tarot": tarots.get(normalize_name(value(row, 10))),
            },
        }
        result.setdefault(normalize_name(character_name), []).append(build)
    return result


def unavailable_item(name: str) -> dict[str, object]:
    return {"name": name, "icon": "", "description": "Data has not been added to the spreadsheet yet.", "available": False}


def build_payload(reader: XlsxReader) -> tuple[dict[str, object], dict[str, object], dict[str, object], dict[str, object]]:
    character_rows = reader.read_sheet("Character List")
    class_faction_rows = reader.read_sheet("Class & Faction")
    trait_rows = reader.read_sheet("Character Trait")
    character_skill_rows = reader.read_sheet("Character Skill")
    skill_rows = reader.read_sheet("Skill List")
    detail_info_rows = reader.read_sheet("Detail Info")
    build_rows = reader.read_sheet("Character Build - DB 2")
    equipment_rows = reader.read_sheet("Copy of Weapon & Trinket")
    equipment_stat_rows = reader.read_sheet("DB_Equipment")
    tarot_rows = reader.read_sheet("Tarot")

    role_icons, faction_icons = icon_mappings(class_faction_rows)
    detail_info = detail_info_map(detail_info_rows)
    skills = skill_records(skill_rows, detail_info)
    traits = trait_map(trait_rows, detail_info)
    skill_trees = character_skill_map(character_skill_rows, skills)
    equipment = equipment_map(equipment_rows)
    tarots = tarot_map(tarot_rows)
    gear_payload = equipment_catalog(equipment_rows, detail_info, equipment_stat_rows)
    tarot_payload = tarot_catalog(tarot_rows, detail_info)
    builds = build_map(build_rows, skills, equipment, tarots)

    list_characters: list[dict[str, object]] = []
    details: dict[str, dict[str, object]] = {}

    for row in character_rows[1:]:
        name = str(value(row, 0, "") or "").strip()
        rarity = str(value(row, 1, "") or "").strip()
        pixel_art = str(value(row, 2, "") or "").strip()
        role = str(value(row, 3, "") or "").strip()
        faction_text = str(value(row, 4, "") or "").strip()

        # Keep the current list rule: cards require name, role and pixel art.
        if not name or not role or not pixel_art:
            continue

        slug = slugify(name)
        character_id = str(value(row, 7, "") or "").strip() or slug
        faction_names = [part.strip() for part in faction_text.split(",") if part.strip()]
        faction_records = [
            {"name": faction, "icon": faction_icons.get(faction, "")}
            for faction in faction_names
        ]
        weapon_type = str(value(row, 12, "") or "").strip() or str(value(row, 27, "") or "").strip()
        signature_gear_name = str(value(row, 11, "") or "").strip()

        release_order = number_or_none(value(row, 8))

        list_record = {
            "id": character_id,
            "slug": slug,
            "name": name,
            "rarity": rarity,
            "releaseOrder": release_order,
            "releaseDate": None,
            "role": role,
            "roleIcon": role_icons.get(role, ""),
            "factions": faction_records,
            "weaponType": weapon_type,
            "pixelArt": pixel_art,
            "detailAvailable": True,
        }
        list_characters.append(list_record)

        trait = traits.get(normalize_name(name), {
            "available": False,
            "name": "Trait data unavailable",
            "icon": "",
            "stars": None,
            "maxStars": 5,
            "summary": "Data has not been added to the spreadsheet yet.",
            "levels": [],
            "detailInfo": [],
        })
        skill_data = skill_trees.get(normalize_name(name), {"basicAttack": None, "baseSkill": None, "skillTree": [], "unique": None})
        character_builds = builds.get(normalize_name(name), [])
        selected_build = character_builds[0] if character_builds else None

        equipped = selected_build["equippedSkills"] if selected_build else {
            "basicAttack": skill_data.get("basicAttack"),
            "reaction": None,
            "classSkills": [None, None, None],
            "unique": skill_data.get("unique"),
        }
        equipped["basicAttack"] = equipped.get("basicAttack") or unavailable_item("Basic attack unavailable")
        equipped["reaction"] = equipped.get("reaction") or unavailable_item("Reaction unavailable")
        class_skills = list(equipped.get("classSkills") or [])[:3]
        class_skills += [None] * (3 - len(class_skills))
        equipped["classSkills"] = [item or unavailable_item(f"Class skill {index + 1} unavailable") for index, item in enumerate(class_skills)]
        equipped["unique"] = equipped.get("unique") or unavailable_item("Rank 13 skill unavailable")

        gear = selected_build["gear"] if selected_build else {"weapon": None, "trinket": None, "tarot": None}
        gear = {
            "weapon": gear.get("weapon") or unavailable_item("Weapon not selected"),
            "trinket": gear.get("trinket") or unavailable_item("Trinket not selected"),
            "tarot": gear.get("tarot") or unavailable_item("Tarot not selected"),
        }

        rank_13_available = bool_or_none(value(row, 9))
        has_tree = bool(skill_data.get("skillTree"))
        rank_current = 13 if rank_13_available is True else (11 if has_tree else None)

        details[slug] = {
            "id": character_id,
            "slug": slug,
            "name": name,
            "rarity": rarity or "Unknown",
            "releaseOrder": release_order,
            "releaseDate": None,
            "role": role,
            "roleIcon": role_icons.get(role, ""),
            "weaponType": weapon_type,
            "signatureGearName": signature_gear_name,
            "level": {"current": 60, "max": 60},
            "rank": {
                "current": rank_current,
                "max": 13,
                "rank13Available": rank_13_available,
                "skillTree": skill_data.get("skillTree") or [],
            },
            "factions": faction_records,
            "trait": trait,
            "attributes": {
                "PATK": number_or_none(value(row, 16)),
                "MATK": number_or_none(value(row, 17)),
                "PDEF": number_or_none(value(row, 18)),
                "MDEF": number_or_none(value(row, 19)),
                "HP": number_or_none(value(row, 20)),
                "SPD": number_or_none(value(row, 21)),
            },
            "bond": {"current": None, "max": 5},
            "art": {
                "main": str(value(row, 5, "") or "").strip(),
                "awakened": str(value(row, 6, "") or "").strip(),
                "pixel": pixel_art,
            },
            "gear": gear,
            "equippedSkills": equipped,
            "builds": character_builds,
            "selectedBuild": selected_build.get("name") if selected_build else "",
            "extensions": [],
            "source": {
                "spreadsheetId": "1xizGBhuAb6ZvsoZ49dfSFcCf3EjOX1JramFsXAZLbsU",
                "sheet": "Character List",
                "characterRowId": character_id,
            },
        }

    list_payload: dict[str, object] = {
        "source": {
            "spreadsheetId": "1xizGBhuAb6ZvsoZ49dfSFcCf3EjOX1JramFsXAZLbsU",
            "sheet": "Character List",
            "snapshotDate": date.today().isoformat(),
        },
        "roles": [{"name": name, "icon": icon} for name, icon in role_icons.items()],
        "factions": [{"name": name, "icon": icon} for name, icon in faction_icons.items()],
        "characters": list_characters,
    }
    detail_payload: dict[str, object] = {
        "source": list_payload["source"],
        "characters": details,
    }
    return list_payload, detail_payload, gear_payload, tarot_payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate static character-list and character-detail JSON from the SOC workbook.")
    parser.add_argument("xlsx", type=Path, help="Path to the exported .xlsx workbook")
    parser.add_argument("--data-dir", type=Path, default=Path("data"), help="Project data directory")
    args = parser.parse_args()

    reader = XlsxReader(args.xlsx)
    try:
        list_payload, detail_payload, gear_payload, tarot_payload = build_payload(reader)
    finally:
        reader.close()

    args.data_dir.mkdir(parents=True, exist_ok=True)
    list_path = args.data_dir / "character-list.json"
    detail_path = args.data_dir / "character-details.json"
    gear_path = args.data_dir / "gear-list.json"
    tarot_path = args.data_dir / "tarot-list.json"
    list_path.write_text(json.dumps(list_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    detail_path.write_text(json.dumps(detail_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    gear_path.write_text(json.dumps(gear_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tarot_path.write_text(json.dumps(tarot_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(list_payload['characters'])} character-list records to {list_path}")
    print(f"Wrote {len(detail_payload['characters'])} character-detail records to {detail_path}")
    print(f"Wrote {len(gear_payload['items'])} gear records to {gear_path}")
    print(f"Wrote {len(tarot_payload['items'])} Tarot records to {tarot_path}")


if __name__ == "__main__":
    main()
