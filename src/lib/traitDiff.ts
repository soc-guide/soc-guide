export interface TraitChange {
  before: string;
  after: string;
}

export interface TraitDisplaySegment {
  text: string;
  changed: boolean;
}

interface IndexedToken {
  value: string;
  start: number;
  end: number;
}

const TOKEN_PATTERN = /\[[^\[\]]+\]|\d+(?:\.\d+)?%?|[A-Za-z0-9]+(?:[’'\-][A-Za-z0-9]+)*|[^\s]/g;

function tokenize(text: string): string[] {
  return text.match(TOKEN_PATTERN) ?? [];
}

function indexedTokens(text: string): IndexedToken[] {
  const result: IndexedToken[] = [];
  const pattern = new RegExp(TOKEN_PATTERN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    result.push({ value: match[0], start: match.index, end: pattern.lastIndex });
  }
  return result;
}

function join(tokens: string[]): string {
  return tokens.join(" ")
    .replace(/\s+([,.;:!?%])/g, "$1")
    .replace(/([([{])\s+/g, "$1")
    .replace(/\s+([)\]}])/g, "$1")
    .replace(/\s+([’'])\s+/g, "$1")
    .trim();
}

function buildTable(previous: string[], current: string[]): Uint16Array[] {
  const table = Array.from({ length: previous.length + 1 }, () => new Uint16Array(current.length + 1));
  for (let i = previous.length - 1; i >= 0; i -= 1) {
    for (let j = current.length - 1; j >= 0; j -= 1) {
      table[i]![j] = previous[i] === current[j]
        ? (table[i + 1]?.[j + 1] ?? 0) + 1
        : Math.max(table[i + 1]?.[j] ?? 0, table[i]?.[j + 1] ?? 0);
    }
  }
  return table;
}

export function traitChanges(previousText: string, currentText: string): TraitChange[] {
  const previous = tokenize(previousText);
  const current = tokenize(currentText);
  const table = buildTable(previous, current);
  const changes: TraitChange[] = [];
  let before: string[] = [];
  let after: string[] = [];
  const flush = () => {
    const left = join(before);
    const right = join(after);
    if (`${left}${right}`.replace(/[^A-Za-z0-9%\[\]]/g, "")) changes.push({ before: left, after: right });
    before = [];
    after = [];
  };
  let i = 0;
  let j = 0;
  while (i < previous.length || j < current.length) {
    if (i < previous.length && j < current.length && previous[i] === current[j]) {
      flush();
      i += 1;
      j += 1;
    } else if (i < previous.length && (j >= current.length || (table[i + 1]?.[j] ?? 0) >= (table[i]?.[j + 1] ?? 0))) {
      before.push(previous[i]!);
      i += 1;
    } else if (j < current.length) {
      after.push(current[j]!);
      j += 1;
    }
  }
  flush();
  return changes;
}

/**
 * Returns the current trait wording as exact text segments. Text that differs
 * from the previous star level is marked `changed`, allowing the UI to show a
 * single readable description instead of a duplicated comparison panel.
 */
export function traitDisplaySegments(previousText: string, currentText: string): TraitDisplaySegment[] {
  if (!previousText) return [{ text: currentText, changed: false }];

  const previousTokens = indexedTokens(previousText);
  const currentTokens = indexedTokens(currentText);
  if (!currentTokens.length) return [{ text: currentText, changed: false }];

  const previousValues = previousTokens.map((token) => token.value);
  const currentValues = currentTokens.map((token) => token.value);
  const table = buildTable(previousValues, currentValues);
  const matchedCurrent = new Set<number>();

  let i = 0;
  let j = 0;
  while (i < previousValues.length && j < currentValues.length) {
    if (previousValues[i] === currentValues[j]) {
      matchedCurrent.add(j);
      i += 1;
      j += 1;
    } else if ((table[i + 1]?.[j] ?? 0) >= (table[i]?.[j + 1] ?? 0)) {
      i += 1;
    } else {
      j += 1;
    }
  }

  const pieces: TraitDisplaySegment[] = [];
  const push = (text: string, changed: boolean) => {
    if (!text) return;
    const last = pieces.at(-1);
    if (last?.changed === changed) last.text += text;
    else pieces.push({ text, changed });
  };

  if (currentTokens[0]!.start > 0) push(currentText.slice(0, currentTokens[0]!.start), false);
  currentTokens.forEach((token, index) => {
    const previousEnd = index > 0 ? currentTokens[index - 1]!.end : token.start;
    const start = index > 0 ? previousEnd : token.start;
    push(currentText.slice(start, token.end), !matchedCurrent.has(index));
  });

  const lastEnd = currentTokens.at(-1)!.end;
  if (lastEnd < currentText.length) push(currentText.slice(lastEnd), false);
  return pieces;
}
