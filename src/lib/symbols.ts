export const weaponSymbols: Record<string, string> = {
  Sword: "⚔",
  Staff: "✦",
  Axe: "◈",
  Bow: "➶",
  Spear: "↟",
};

export const rarityOrder: Record<string, number> = {
  Legendary: 0,
  Epic: 1,
  Rare: 2,
  Common: 3,
  Normal: 3,
  Unknown: 9,
};

export const raritySymbols: Record<string, string> = {
  Legendary: "◆◆◆",
  Epic: "◆◆",
  Rare: "◆",
  Common: "◇",
  Normal: "◇",
  Unknown: "◇",
};

export const categorySymbols: Record<string, string> = {
  WEAPON: "⚔",
  TRINKET: "◇",
};

export const gearSymbols = {
  weapon: "⚔",
  trinket: "◇",
  tarot: "✦",
} as const;

export const attributeSymbols: Record<string, string> = {
  PATK: "⚔",
  MATK: "✦",
  PDEF: "⬡",
  MDEF: "◈",
  HP: "♥",
  SPD: "➤",
};

export const skillSlotSymbols = {
  basicAttack: "×",
  reaction: "↺",
  classSkills: "✦",
  unique: "◆",
} as const;

export const purposeSymbols: Record<string, string> = {
  "Damage Dealer": "⚔",
  Support: "✦",
  Tank: "⬡",
  Cheese: "♜",
  Other: "◈",
};

export const usageSymbols: Record<string, string> = {
  PVP: "⚔",
  "General - PVE": "♙",
  Situational: "◇",
};

export const slotSymbols: Record<string, string> = {
  "Special Effect": "✦",
  Stats: "◆",
};

export const romanByCode: Record<string, string> = {
  "The-Fool": "0",
  "The-Magician": "I",
  "The-High-Priestess": "II",
  "The-Empress": "III",
  "The-Emperor": "IV",
  "The-Hierophant": "V",
  "The-Lovers": "VI",
  "The-Chariot": "VII",
  Strength: "VIII",
  "The-Hermit": "IX",
  "Wheel-of-Fortune": "X",
  Justice: "XI",
  "The-Hanged-Man": "XII",
  Death: "XIII",
  Temperance: "XIV",
  "The-Devil": "XV",
  "The-Tower": "XVI",
  "The-Star": "XVII",
  "The-Moon": "XVIII",
  "The-Sun": "XIX",
  Judgement: "XX",
  "The-World": "XXI",
};
