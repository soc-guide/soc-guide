export type LoreRelationType = "faction" | "character" | "location" | "organization" | "person" | "resource";

export interface LoreRelation {
  type: LoreRelationType;
  name: string;
  slug?: string;
  note?: string;
}

export interface LoreDetailStep {
  label: string;
  title: string;
  detail: string;
}

export interface LoreEvent {
  id: string;
  sortYear: number;
  startYear?: number;
  endYear?: number;
  dateLabel: string;
  title: string;
  subtitle?: string;
  paragraphs: string[];
  detailLine?: LoreDetailStep[];
  relations: LoreRelation[];
  accent: "blue" | "rose" | "green" | "violet" | "gold";
  track?: 0 | 1 | 2 | 3;
  overviewLabel?: string;
  milestoneOnly?: boolean;
}

export interface WorldMapRegion {
  name: string;
  displayName: string;
  type: "faction" | "location" | "organization";
  factionFilter?: string;
  note: string;
}

export const worldMapRegions: WorldMapRegion[] = [
  {
    name: "The Union",
    displayName: "Union of Knight States",
    type: "faction",
    factionFilter: "The Union",
    note: "The western federation governed through the Council of Knights.",
  },
  {
    name: "Iria",
    displayName: "Kingdom of Iria",
    type: "faction",
    factionFilter: "Iria",
    note: "The kingdom containing the Town of Convallaria and its surrounding lands.",
  },
  {
    name: "Papal States",
    displayName: "Papal States of Rodinia",
    type: "faction",
    factionFilter: "Papal States",
    note: "The central religious power whose capital is Radiant City.",
  },
  {
    name: "Elaman",
    displayName: "Elaman Empire",
    type: "faction",
    factionFilter: "Elaman",
    note: "The vast eastern empire stretching across desert routes and oasis settlements.",
  },
  {
    name: "Town of Convallaria",
    displayName: "Town of Convallaria",
    type: "location",
    note: "A major Irian settlement and the namesake home of the Sword of Convallaria.",
  },
  {
    name: "Radiant City",
    displayName: "Radiant City",
    type: "location",
    note: "Capital of the Papal States and the site beneath which Luxite was first discovered.",
  },
  {
    name: "Council of Knights",
    displayName: "Council of Knights",
    type: "organization",
    note: "The governing council shown within the Union of Knight States.",
  },
];

export const loreEvents: LoreEvent[] = [
  {
    id: "ancient-iria",
    sortYear: -1,
    dateLabel: "Ancient era",
    title: "The Council of Sages",
    subtitle: "A legend of Ancient Iria",
    paragraphs: [
      "Ancient Iria is remembered as a flourishing civilisation once ruled by the Council of Sages. The surviving chronology does not assign an exact RC date to this era.",
    ],
    relations: [
      { type: "faction", name: "Iria" },
      { type: "organization", name: "Council of Sages" },
    ],
    accent: "blue",
    milestoneOnly: true,
  },
  {
    id: "light-of-sanctuary",
    sortYear: 0,
    startYear: 0,
    endYear: 300,
    dateLabel: "RC 0–RC 300",
    title: "Light of Sanctuary",
    subtitle: "The Papal States are founded",
    paragraphs: [
      "The Son of the Radiant founded the Light of Sanctuary and left the Radiance as his legacy.",
      "Across the following centuries, his followers built Radiant City and established the Papal States of Rodinia.",
    ],
    detailLine: [
      {
        label: "RC 0",
        title: "The Light of Sanctuary begins",
        detail: "The Son of the Radiant gathers the faith that later becomes the foundation of Papal authority.",
      },
      {
        label: "RC 0–300",
        title: "Radiant City and the Papal States",
        detail: "The new faith expands around Radiant City until the Papal States emerge as a continental power.",
      },
      {
        label: "RC 300–700",
        title: "Origin of the Knights",
        detail: "The Papal States organise the Knights of Sanctuary. Initially loyal directly to the Hierophant, knights are later granted counties to govern and become the predecessors of the Knight Orders.",
      },
    ],
    relations: [
      { type: "faction", name: "Papal States" },
      { type: "location", name: "Radiant City" },
      { type: "organization", name: "Light of Sanctuary" },
      { type: "organization", name: "Knights of Sanctuary" },
      { type: "person", name: "Son of the Radiant" },
      { type: "person", name: "Hierophant" },
    ],
    accent: "blue",
    track: 0,
    overviewLabel: "Papal States founded",
  },
  {
    id: "papal-knight-orders",
    sortYear: 500,
    startYear: 500,
    dateLabel: "Around RC 500",
    title: "Papal Knight Orders appear",
    paragraphs: [
      "By the middle of the first millennium, knightly domains had become established across Papal territory. These local forces developed into the Knight Orders that would later rule the western territories.",
    ],
    relations: [
      { type: "faction", name: "Papal States" },
      { type: "organization", name: "Papal Knight Orders" },
      { type: "organization", name: "Knight Orders" },
    ],
    accent: "gold",
    track: 1,
    overviewLabel: "Knight Orders appear",
    milestoneOnly: true,
  },
  {
    id: "elaman-rises",
    sortYear: 600,
    startYear: 600,
    endYear: 650,
    dateLabel: "RC 600–RC 650",
    title: "Elaman Empire rises",
    subtitle: "Ancient Iria falls",
    paragraphs: [
      "Under its legendary ruler, the Great Hashah, the Elaman Empire rapidly rose to power.",
      "Its territory extended from coast to coast across Rodinia, conquering Ancient Iria in the west and the distant Land of Bliss in the east.",
    ],
    relations: [
      { type: "faction", name: "Elaman" },
      { type: "faction", name: "Iria" },
      { type: "person", name: "Great Hashah" },
      { type: "location", name: "Rodinia" },
      { type: "location", name: "Land of Bliss" },
    ],
    accent: "rose",
    track: 1,
    overviewLabel: "Elaman rises",
  },
  {
    id: "first-radiant-war",
    sortYear: 700,
    startYear: 700,
    endYear: 730,
    dateLabel: "RC 700–RC 730",
    title: "First Radiant War",
    subtitle: "The Knight Territories are settled",
    paragraphs: [
      "After consolidating the lands around them, the Papal States accumulated enough military power to launch a westward campaign.",
      "At the Hierophant's command, the Knights of Sanctuary conquered the western coast and settled the captured territories. Papal influence expanded dramatically, beginning the age remembered as the Radiant Glory.",
    ],
    detailLine: [
      {
        label: "Before RC 700",
        title: "Papal consolidation",
        detail: "The Papal States strengthen their rule over surrounding regions and assemble a large knightly force.",
      },
      {
        label: "RC 700",
        title: "The Hierophant declares war",
        detail: "The First Radiant War begins with the Knights of Sanctuary advancing westward.",
      },
      {
        label: "RC 700–730",
        title: "Conquest and settlement",
        detail: "The Knights seize the western coast, establish territories of their own, and govern them with growing autonomy.",
      },
      {
        label: "After the conquest",
        title: "The Radiant Glory",
        detail: "The Papal States reach the greatest territorial extent of their history, and the victorious Knight Orders enter a celebrated age of power.",
      },
    ],
    relations: [
      { type: "faction", name: "Papal States" },
      { type: "organization", name: "Knights of Sanctuary" },
      { type: "organization", name: "Knight Territories" },
      { type: "person", name: "Hierophant" },
    ],
    accent: "green",
    track: 2,
    overviewLabel: "First Radiant War",
  },
  {
    id: "menian-federation",
    sortYear: 730,
    startYear: 730,
    endYear: 820,
    dateLabel: "RC 730–RC 820",
    title: "Birth of the Menian Federation",
    paragraphs: [
      "Some weaker Knight Orders failed to secure territory after the First Radiant War. They abandoned their knighthood and sailed from the western coast, eventually reaching Menia.",
      "Decades later, those settlers had become powerful on the new continent. A Knight Council expedition triggered conflict, and the Menians united to resist it before the two sides finally reached an agreement.",
    ],
    detailLine: [
      {
        label: "After RC 730",
        title: "Orders sail west",
        detail: "Landless orders renounce their vows and leave Rodinia in search of territory beyond the western sea.",
      },
      {
        label: "Following decades",
        title: "Menian power grows",
        detail: "The former orders establish influential communities on Menia and become a political force in their own right.",
      },
      {
        label: "By RC 820",
        title: "Conflict and alliance",
        detail: "A Knight Council expedition causes war, but the conflict ends in an agreement that makes Menia an ally of the Knights.",
      },
    ],
    relations: [
      { type: "location", name: "Menia" },
      { type: "organization", name: "Menian Federation" },
      { type: "organization", name: "Knight Orders" },
      { type: "organization", name: "Knight Council" },
    ],
    accent: "blue",
    track: 0,
    overviewLabel: "Menian Federation",
  },
  {
    id: "knight-council",
    sortYear: 750,
    startYear: 730,
    endYear: 800,
    dateLabel: "RC 730–RC 800",
    title: "Knight Territories and the Knight Council",
    subtitle: "From territorial rule to a shared council",
    paragraphs: [
      "The victorious Knight Orders claimed the lands they had conquered. The most powerful leaders were crowned Knight Kings, while weaker orders without territory departed for the west.",
      "Competition over land then produced decades of internal conflict. After several orders were destroyed and one of the four Knight Kings died, the surviving powers held a summit and created the Knight Council to mediate future disputes.",
    ],
    detailLine: [
      {
        label: "RC 730–750",
        title: "The Knight Territories are founded",
        detail: "Each order claims its conquered lands. Powerful knights become Knight Kings and begin ruling semi-independent domains.",
      },
      {
        label: "RC 750–800",
        title: "Internal strife",
        detail: "The orders fight over territory for decades. Some historical interpretations suggest Papal interference helped intensify the conflict as the orders became increasingly powerful.",
      },
      {
        label: "Late in the conflict",
        title: "Losses force a summit",
        detail: "Several orders collapse, many knights die, and the death of one Knight King convinces the remaining rulers to seek a settlement.",
      },
      {
        label: "By RC 800",
        title: "The Knight Council is established",
        detail: "The three surviving Knight Kings declare peace and create a council responsible for resolving disputes between the orders.",
      },
    ],
    relations: [
      { type: "organization", name: "Knight Territories" },
      { type: "organization", name: "Knight Orders" },
      { type: "organization", name: "Knight Council" },
      { type: "person", name: "Four Knight Kings" },
      { type: "faction", name: "Papal States" },
    ],
    accent: "violet",
    track: 2,
    overviewLabel: "Knight Council",
  },
  {
    id: "papal-decline",
    sortYear: 820,
    startYear: 800,
    endYear: 960,
    dateLabel: "RC 800–RC 960",
    title: "Stirrings of independence",
    subtitle: "Papal influence declines in the Knight Territories",
    paragraphs: [
      "As the Knight Territories grew stronger, dissatisfaction with Papal rule spread and calls for independence became increasingly open.",
      "The Papal States answered with repeated campaigns intended to weaken the Knight Orders, but those campaigns deepened the political divide and prepared the ground for a future break.",
    ],
    detailLine: [
      {
        label: "After RC 800",
        title: "The territories outgrow Papal control",
        detail: "The Knight Orders gain wealth, military strength, and political confidence under their own rulers.",
      },
      {
        label: "Across the era",
        title: "Independence movements spread",
        detail: "Dissatisfaction with Papal authority grows louder throughout the western states.",
      },
      {
        label: "Before RC 960",
        title: "Papal campaigns weaken the bond",
        detail: "Attempts to suppress the Knight Territories damage their forces but also convince more knights that continued submission is impossible.",
      },
    ],
    relations: [
      { type: "faction", name: "Papal States" },
      { type: "organization", name: "Knight Territories" },
      { type: "organization", name: "Knight Orders" },
    ],
    accent: "gold",
    track: 3,
    overviewLabel: "Papal decline",
  },
  {
    id: "second-radiant-war",
    sortYear: 960,
    startYear: 960,
    endYear: 970,
    dateLabel: "RC 960–RC 970",
    title: "Second Radiant War",
    paragraphs: [
      "Facing pressure at home, the Hierophant attempted to restore the glory of the Papal States by launching the Second Radiant War against Elaman and Luccia.",
      "The Knight Orders honoured their oaths and entered the campaign, but suffered severe losses. The Luccian tribes united as the Luccian Empire, the front reached a bloody stalemate, and Menian intervention eventually secured a Papal victory.",
      "The war left the Knights with a clear conclusion: they could no longer depend on the Papal States. Independence movements hardened, and internal conflict began within the Knight Territories.",
    ],
    detailLine: [
      {
        label: "RC 960",
        title: "The Hierophant seeks a restored empire",
        detail: "The Papal States launch a new continental war to recover their former prestige and territory.",
      },
      {
        label: "During the war",
        title: "The Knight Orders fulfil their oaths",
        detail: "The western orders join the campaign but pay heavily in lives and military strength.",
      },
      {
        label: "Late campaign",
        title: "Stalemate and Menian intervention",
        detail: "Elaman and the newly united Luccian Empire resist the Papal advance until Menian forces tip the balance.",
      },
      {
        label: "After RC 970",
        title: "The independence crisis begins",
        detail: "The surviving Knights reassess their relationship with the Papal States, while civil conflict spreads through the territories.",
      },
    ],
    relations: [
      { type: "faction", name: "Papal States" },
      { type: "faction", name: "Elaman" },
      { type: "organization", name: "Knight Orders" },
      { type: "location", name: "Luccia" },
      { type: "organization", name: "Luccian Empire" },
      { type: "location", name: "Menia" },
      { type: "person", name: "Hierophant" },
    ],
    accent: "rose",
    track: 0,
    overviewLabel: "Second Radiant War",
  },
  {
    id: "birth-of-union",
    sortYear: 970,
    startYear: 970,
    endYear: 980,
    dateLabel: "RC 970–RC 980",
    title: "Birth of the Union",
    paragraphs: [
      "The Knight Council attempted to suppress dissident voices after the war, but the pressure instead pushed the states toward a common declaration of independence.",
      "The Knight Council unified military and diplomatic policy while each state retained internal autonomy. The arrangement allowed the Knights to act as one front without erasing their distinct military traditions.",
      "The Union of Knight States formally entered the world stage.",
    ],
    detailLine: [
      {
        label: "Early RC 970s",
        title: "Dissent is suppressed",
        detail: "Heavy-handed measures by the Knight Council fail to end the independence movement and instead convince the states to coordinate.",
      },
      {
        label: "RC 970–980",
        title: "A shared political structure",
        detail: "The Council receives final authority over diplomacy and joint military operations, while the member states preserve their own governments.",
      },
      {
        label: "By RC 980",
        title: "The Union enters the world stage",
        detail: "The Knight States present a unified front abroad while retaining distinct orders, traditions, and armed forces at home.",
      },
    ],
    relations: [
      { type: "faction", name: "The Union" },
      { type: "faction", name: "Papal States" },
      { type: "organization", name: "Knight Council" },
      { type: "organization", name: "Union of Knight States" },
    ],
    accent: "green",
    track: 1,
    overviewLabel: "Union formed",
  },
  {
    id: "state-of-iria",
    sortYear: 970.1,
    startYear: 970,
    endYear: 985,
    dateLabel: "RC 970–RC 985",
    title: "Birth of the State of Iria",
    paragraphs: [
      "After Elaman's defeat in the Second Radiant War, it ceded many territories to the Papal States, including Iria and Vlder. The Vlder homeland was further divided between Iria and Elaman, sowing the seeds of future instability.",
      "Iria became a vassal state with the Light of Sanctuary as its state religion. Its Papal-backed regime exploited the country and oppressed its people to satisfy its overlords.",
    ],
    detailLine: [
      {
        label: "After RC 970",
        title: "Elaman cedes western territories",
        detail: "Iria and Vlder pass into the Papal sphere after Elaman's defeat.",
      },
      {
        label: "Following settlement",
        title: "Iria becomes a vassal state",
        detail: "A new state is formed under Papal influence, with the Light of Sanctuary established as its state religion.",
      },
      {
        label: "Before RC 985",
        title: "Papal-backed rule hardens",
        detail: "The puppet government extracts wealth and suppresses the population, creating the conditions for Faris's rebellion.",
      },
    ],
    relations: [
      { type: "faction", name: "Iria" },
      { type: "faction", name: "Papal States" },
      { type: "faction", name: "Elaman" },
      { type: "faction", name: "Vlder" },
      { type: "organization", name: "Light of Sanctuary" },
    ],
    accent: "violet",
    track: 2,
    overviewLabel: "State of Iria",
  },
  {
    id: "luxite-discovery",
    sortYear: 980,
    startYear: 980,
    dateLabel: "RC 980",
    title: "Discovery of Luxite",
    paragraphs: [
      "After an earthquake, crystal veins were discovered deep beneath Radiant City.",
      "The Hierophant recognised Luxite as the key to restoring Papal power and seized control of all mining rights and research. The resulting monopoly returned the Papal States to the centre of world affairs.",
    ],
    detailLine: [
      {
        label: "Earthquake",
        title: "Crystal veins are exposed",
        detail: "Luxite is discovered beneath Radiant City after geological damage reveals deposits below the capital.",
      },
      {
        label: "Immediate response",
        title: "The Hierophant claims the resource",
        detail: "Mining, research, and distribution are placed under direct Papal control.",
      },
      {
        label: "Global consequence",
        title: "A new Papal monopoly",
        detail: "Control of Luxite restores the political and economic influence the Papal States had lost during the previous centuries.",
      },
    ],
    relations: [
      { type: "faction", name: "Papal States" },
      { type: "resource", name: "Luxite" },
      { type: "location", name: "Radiant City" },
      { type: "person", name: "Hierophant" },
    ],
    accent: "blue",
    track: 0,
    overviewLabel: "Luxite discovered",
  },
  {
    id: "luxite-in-iria",
    sortYear: 983,
    startYear: 983,
    dateLabel: "RC 983",
    title: "Luxite is discovered in Iria",
    subtitle: "Papal control tightens",
    paragraphs: [
      "Luxite deposits were found in Iria. The Papal States moved to monopolise the new mines and their research, treating control of the resource as essential to maintaining its recovered power.",
    ],
    relations: [
      { type: "faction", name: "Iria" },
      { type: "faction", name: "Papal States" },
      { type: "resource", name: "Luxite" },
    ],
    accent: "gold",
    track: 1,
    overviewLabel: "Luxite in Iria",
    milestoneOnly: true,
  },
  {
    id: "treaty-of-iria",
    sortYear: 985,
    startYear: 985,
    dateLabel: "RC 985",
    title: "Treaty of Iria",
    subtitle: "Birth of the Kingdom of Iria",
    paragraphs: [
      "General Faris launched a rebellion and overthrew Iria's regime with assistance from the Union.",
      "The Papal States, the Union, Elaman, Luccia, and Iria signed the Treaty of Iria, securing Irian independence. Lightgloam City was abandoned and the capital moved to Mornrays Castle.",
      "Iria began exporting Luxite and broke the Papal States' monopoly.",
    ],
    detailLine: [
      {
        label: "Rebellion",
        title: "Faris overthrows the vassal regime",
        detail: "Union support enables the Irian rebellion to defeat the Papal-backed government.",
      },
      {
        label: "RC 985",
        title: "The Treaty of Iria is signed",
        detail: "The regional powers recognise Iria as an independent kingdom and establish a new political settlement.",
      },
      {
        label: "After the treaty",
        title: "Capital and Luxite policy change",
        detail: "The capital moves to Mornrays Castle, and Irian Luxite exports end the Papal monopoly.",
      },
    ],
    relations: [
      { type: "faction", name: "Iria" },
      { type: "faction", name: "The Union" },
      { type: "faction", name: "Papal States" },
      { type: "faction", name: "Elaman" },
      { type: "person", name: "General Faris" },
      { type: "location", name: "Luccia" },
      { type: "location", name: "Lightgloam City" },
      { type: "location", name: "Mornrays Castle" },
      { type: "resource", name: "Luxite" },
    ],
    accent: "rose",
    track: 2,
    overviewLabel: "Iria independent",
  },
  {
    id: "faris-assassination",
    sortYear: 990,
    startYear: 990,
    dateLabel: "RC 990",
    title: "Assassination attempt on Faris",
    paragraphs: [
      "An attempt was made on Faris's life in RC 990. This attack became one of the first major signs of the instability that would define the final decade before the Waverun Incident.",
    ],
    relations: [
      { type: "faction", name: "Iria" },
      { type: "person", name: "Faris" },
    ],
    accent: "violet",
    track: 0,
    overviewLabel: "Attempt on Faris",
    milestoneOnly: true,
  },
  {
    id: "night-crimson",
    sortYear: 992,
    startYear: 992,
    dateLabel: "RC 992",
    title: "Night Crimson",
    paragraphs: [
      "A riot against the nobles broke out in Waverun City and was later remembered as Night Crimson.",
      "First Prince Dantalion formed the Hanged Men. With their help, the remaining nobles were relocated to Mornrays Castle.",
    ],
    detailLine: [
      {
        label: "Waverun City",
        title: "Anti-noble unrest erupts",
        detail: "The riot later known as Night Crimson overturns the local political order and leaves many nobles dead.",
      },
      {
        label: "Royal response",
        title: "Dantalion forms the Hanged Men",
        detail: "The organisation is created to restore control and move the surviving nobility to Mornrays Castle.",
      },
    ],
    relations: [
      { type: "faction", name: "Iria" },
      { type: "faction", name: "Night Crimson" },
      { type: "character", name: "Dantalion", slug: "dantalion" },
      { type: "organization", name: "Hanged Men" },
      { type: "location", name: "Waverun City" },
      { type: "location", name: "Mornrays Castle" },
    ],
    accent: "rose",
    track: 1,
    overviewLabel: "Night Crimson",
  },
  {
    id: "sword-of-convallaria-formed",
    sortYear: 993,
    startYear: 993,
    dateLabel: "RC 993",
    title: "Sword of Convallaria is formed",
    paragraphs: [
      "The Sword of Convallaria was formed in RC 993, establishing the organisation that would later stand at the centre of events in Iria.",
    ],
    relations: [
      { type: "faction", name: "Sword of Convallaria" },
      { type: "organization", name: "Sword of Convallaria" },
      { type: "location", name: "Town of Convallaria" },
    ],
    accent: "blue",
    track: 2,
    overviewLabel: "Sword formed",
    milestoneOnly: true,
  },
  {
    id: "dantalion-regent",
    sortYear: 995,
    startYear: 995,
    dateLabel: "RC 995",
    title: "Dantalion becomes regent of Iria",
    paragraphs: [
      "The death of Princess Consort Sylvia dealt a devastating blow to Faris.",
      "Dantalion forced Faris to abdicate and began ruling Iria as its de facto ruler.",
    ],
    relations: [
      { type: "faction", name: "Iria" },
      { type: "character", name: "Dantalion", slug: "dantalion" },
      { type: "person", name: "Faris" },
      { type: "person", name: "Princess Consort Sylvia" },
    ],
    accent: "green",
    track: 0,
    overviewLabel: "Dantalion regent",
  },
  {
    id: "waverun-incident",
    sortYear: 999,
    startYear: 999,
    dateLabel: "RC 999",
    title: "Waverun Incident",
    paragraphs: [
      "On Sanctuary Day in RC 999, a riot broke out in Waverun City.",
      "The rioters sought to overthrow the royal family and clashed with the King's army while looting, setting fires, and killing civilians.",
      "Many innocent people were caught in the chaos, making the Waverun Incident the immediate crisis at the opening of the present story.",
    ],
    detailLine: [
      {
        label: "Sanctuary Day",
        title: "A riot breaks out",
        detail: "Organised unrest erupts inside Waverun City during a major religious observance.",
      },
      {
        label: "Escalation",
        title: "The royal army and rioters clash",
        detail: "The uprising turns into open violence, accompanied by looting, arson, and murder.",
      },
      {
        label: "RC 999",
        title: "The present crisis begins",
        detail: "The incident destabilises Iria and becomes the immediate historical backdrop for the Sword of Convallaria's story.",
      },
    ],
    relations: [
      { type: "faction", name: "Iria" },
      { type: "location", name: "Waverun City" },
      { type: "organization", name: "Irian royal family" },
      { type: "organization", name: "King's army" },
    ],
    accent: "violet",
    track: 1,
    overviewLabel: "Waverun Incident",
  },
];
