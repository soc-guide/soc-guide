export interface NamedIcon {
  name: string;
  icon?: string;
}

export interface Definition {
  name: string;
  detail: string;
}

export interface CharacterListItem {
  id: string;
  slug: string;
  name: string;
  rarity: string;
  releaseOrder?: number | null;
  releaseDate?: string | null;
  role: string;
  roleIcon?: string;
  factions: NamedIcon[];
  weaponType?: string;
  pixelArt?: string;
  detailAvailable?: boolean;
}

export interface CharacterListData {
  source?: unknown;
  roles: NamedIcon[];
  factions: NamedIcon[];
  characters: CharacterListItem[];
}

export interface Skill {
  name?: string;
  category?: string;
  type?: string;
  iconCode?: string;
  icon?: string;
  description?: string;
  subDetail?: string;
  nrgCost?: number | string | null;
  cooldown?: number | string | null;
  range?: number | string | null;
  heightRange?: string | null;
  targetType?: string | null;
  isUnique?: boolean;
  isInstant?: boolean;
  tags?: string[];
  detailInfo?: Definition[];
  available?: boolean;
  unlockRank?: number | null;
  branch?: string | null;
  reason?: string;
}

export interface RankRow {
  rank: number;
  skills: Skill[];
}

export interface TraitLevel {
  stars: number;
  description: string;
  additional?: string;
}

export interface Trait {
  available?: boolean;
  name?: string;
  icon?: string;
  stars?: number | null;
  maxStars?: number;
  summary?: string;
  levels?: TraitLevel[];
  detailInfo?: Definition[];
}

export interface LoadoutStatValue {
  optionId?: string;
  label?: string;
  value?: string | number | null;
}

export interface LoadoutStatOption {
  id: string;
  label: string;
  values?: Array<string | number>;
}

export interface GearLevel {
  stars: number;
  effect?: string;
  additional?: string;
  tags?: string[];
  detailInfo?: Definition[];
}

export interface GearItem {
  id?: string;
  slug?: string;
  name?: string;
  iconCode?: string;
  icon?: string;
  rarity?: string;
  category?: string;
  weaponType?: string;
  isSignature?: boolean;
  lore?: string;
  maxLevel?: number;
  maxStats?: Record<string, number | null>;
  levels?: GearLevel[];
  tags?: string[];
  detailInfo?: Definition[];
  available?: boolean;
  level?: number;
  stars?: number;
  engravingStats?: LoadoutStatValue[];
  reason?: string;
}

export interface TarotItem {
  id?: string;
  slug?: string;
  name?: string;
  iconCode?: string;
  icon?: string;
  usage?: string[];
  effect?: string;
  slot4Effect?: string;
  slot4Types?: string[];
  purposes?: string[];
  recommendedFor?: string;
  tags?: string[];
  detailInfo?: Definition[];
  available?: boolean;
  level?: number;
  stars?: number;
  statSlots?: LoadoutStatValue[];
  reason?: string;
}

export type LoadoutItem = GearItem | TarotItem;

export interface CharacterDetail extends CharacterListItem {
  signatureGearName?: string;
  level: { current?: number | null; max?: number | null };
  rank: {
    current?: number | null;
    max?: number | null;
    rank13Available?: boolean;
    skillTree?: RankRow[];
  };
  trait: Trait;
  attributes: Record<string, number | null>;
  bond: { current?: number | null; max?: number | null };
  art: { main?: string; awakened?: string; pixel?: string };
  gear: {
    weapon?: GearItem;
    trinket?: GearItem;
    tarot?: TarotItem;
  };
  equippedSkills: {
    basicAttack?: Skill;
    reaction?: Skill;
    classSkills?: Array<Skill | null>;
    unique?: Skill;
  };
  builds?: unknown[];
  selectedBuild?: string;
  extensions?: Array<{ title?: string; body?: string }>;
  source?: unknown;
}

export interface CharacterDetailsData {
  source?: unknown;
  characters: Record<string, CharacterDetail>;
}

export interface GearCatalogData {
  source?: unknown;
  engravingOptions?: LoadoutStatOption[];
  rarities: string[];
  categories: string[];
  weaponTypes: string[];
  items: GearItem[];
}

export interface TarotCatalogData {
  source?: unknown;
  statOptions?: LoadoutStatOption[];
  usage: string[];
  purposes: string[];
  slot4Types: string[];
  items: TarotItem[];
}

export interface GuideData {
  list: CharacterListData;
  details: CharacterDetailsData;
  gear: GearCatalogData;
  tarot: TarotCatalogData;
}

export type Route =
  | { page: "characters"; faction?: string; name?: string }
  | { page: "character"; slug: string }
  | { page: "gear" }
  | { page: "tarot" }
  | { page: "faq" }
  | { page: "lore" };
