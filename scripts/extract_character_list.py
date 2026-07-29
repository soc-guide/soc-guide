from __future__ import annotations

import argparse
import json
import re
import unicodedata
import zipfile
from datetime import date
from pathlib import Path
import xml.etree.ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
EMOJI_PATTERN = re.compile(r"<a?:[^:>]+:(\d+)>")


def column_number(cell_reference: str) -> int:
    match = re.match(r"([A-Z]+)", cell_reference)
    if not match:
        raise ValueError(f"Invalid cell reference: {cell_reference}")
    value = 0
    for character in match.group(1):
        value = value * 26 + ord(character) - 64
    return value


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")


def emoji_url(raw_value: str) -> str:
    match = EMOJI_PATTERN.search(raw_value or "")
    if not match:
        return ""
    return f"https://cdn.discordapp.com/emojis/{match.group(1)}.png?size=128&quality=lossless"


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return ["".join(node.text or "" for node in item.iterfind(".//m:t", NS)) for item in root.findall("m:si", NS)]


def read_sheet(archive: zipfile.ZipFile, path: str, shared_strings: list[str]) -> list[dict[int, object]]:
    root = ET.fromstring(archive.read(path))
    rows: list[dict[int, object]] = []

    for row_element in root.findall(".//m:sheetData/m:row", NS):
        row: dict[int, object] = {}
        for cell in row_element.findall("m:c", NS):
            column = column_number(cell.attrib["r"])
            cell_type = cell.attrib.get("t")
            value_element = cell.find("m:v", NS)

            if cell_type == "inlineStr":
                inline = cell.find("m:is", NS)
                value: object = "" if inline is None else "".join(
                    node.text or "" for node in inline.iterfind(".//m:t", NS)
                )
            elif value_element is None:
                value = ""
            elif cell_type == "s":
                value = shared_strings[int(value_element.text or "0")]
            elif cell_type == "b":
                value = value_element.text == "1"
            else:
                value = value_element.text or ""
            row[column] = value
        rows.append(row)
    return rows


def icon_mappings(rows: list[dict[int, object]]) -> tuple[dict[str, str], dict[str, str]]:
    roles: dict[str, str] = {}
    factions: dict[str, str] = {}
    for row in rows[1:]:
        role = str(row.get(1, "")).strip()
        role_icon = emoji_url(str(row.get(2, "")))
        faction = str(row.get(4, "")).strip()
        faction_icon = emoji_url(str(row.get(5, "")))
        if role:
            roles[role] = role_icon
        if faction:
            factions[faction] = faction_icon
    return roles, factions


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create data/character-list.json from an exported SOC Google Sheets workbook."
    )
    parser.add_argument("xlsx", type=Path, help="Path to the exported .xlsx workbook")
    parser.add_argument("--output", type=Path, default=Path("data/character-list.json"))
    args = parser.parse_args()

    with zipfile.ZipFile(args.xlsx) as archive:
        shared_strings = read_shared_strings(archive)
        character_rows = read_sheet(archive, "xl/worksheets/sheet1.xml", shared_strings)
        class_faction_rows = read_sheet(archive, "xl/worksheets/sheet11.xml", shared_strings)

    role_icons, faction_icons = icon_mappings(class_faction_rows)
    detail_directory = args.output.parent / "characters"
    characters: list[dict[str, object]] = []

    for row in character_rows[1:]:
        name = str(row.get(1, "")).strip()
        rarity = str(row.get(2, "")).strip()
        pixel_art = str(row.get(3, "")).strip()
        role = str(row.get(4, "")).strip()
        faction_text = str(row.get(5, "")).strip()

        # The list card requires all three visible elements: name, role symbol, and pixel art.
        if not name or not role or not pixel_art:
            continue

        slug = slugify(name)
        factions = [value.strip() for value in faction_text.split(",") if value.strip()]
        character_id = str(row.get(8, "")).strip() or slug
        weapon_type = str(row.get(13, "")).strip() or str(row.get(28, "")).strip()

        characters.append(
            {
                "id": character_id,
                "slug": slug,
                "name": name,
                "rarity": rarity,
                "role": role,
                "roleIcon": role_icons.get(role, ""),
                "factions": [
                    {"name": faction, "icon": faction_icons.get(faction, "")} for faction in factions
                ],
                "weaponType": weapon_type,
                "pixelArt": pixel_art,
                "detailAvailable": True,
            }
        )

    payload = {
        "source": {
            "spreadsheetId": "1xizGBhuAb6ZvsoZ49dfSFcCf3EjOX1JramFsXAZLbsU",
            "sheet": "Character List",
            "snapshotDate": date.today().isoformat(),
        },
        "roles": [{"name": name, "icon": icon} for name, icon in role_icons.items()],
        "factions": [{"name": name, "icon": icon} for name, icon in faction_icons.items()],
        "characters": characters,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(characters)} character-list records to {args.output}")


if __name__ == "__main__":
    main()
