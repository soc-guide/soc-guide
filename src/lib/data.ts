import type { GuideData } from "../types";

let guideDataPromise: Promise<GuideData> | null = null;

async function loadJson<T>(file: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}data/${file}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${file}.`);
  return response.json() as Promise<T>;
}

export function loadGuideData(): Promise<GuideData> {
  if (!guideDataPromise) {
    guideDataPromise = Promise.all([
      loadJson<GuideData["list"]>("character-list.json"),
      loadJson<GuideData["details"]>("character-details.json"),
      loadJson<GuideData["gear"]>("gear-list.json"),
      loadJson<GuideData["tarot"]>("tarot-list.json"),
    ]).then(([list, details, gear, tarot]) => ({ list, details, gear, tarot }));
  }
  return guideDataPromise;
}
