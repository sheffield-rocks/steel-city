import sitesJson from "../config/sites.json";
import keywordsJson from "../config/keywords.json";

type HtmlSite = {
  id: string;
  name: string;
  type: "html";
  url: string;
  intervalMinutes: number;
  itemSelector: string;
  titleSelector: string;
  urlSelector: string;
  dateSelector?: string;
};

type RssSite = {
  id: string;
  name: string;
  type: "rss";
  url: string;
  intervalMinutes: number;
};

type Config = {
  databasePath: string;
  pollIntervalMinutes: number;
  pollJitterMs: number;
  keywords: string[];
  sites: Array<HtmlSite | RssSite>;
};

export function loadConfig(): Config {
  const envDb = process.env.EVENTS_DB_PATH;
  const envPollInterval = process.env.EVENTS_POLL_INTERVAL_MINUTES;
  const envKeywords = process.env.EVENTS_KEYWORDS;

  return {
    databasePath: envDb ?? "./data/events.sqlite",
    pollIntervalMinutes: envPollInterval
      ? Number.parseInt(envPollInterval, 10)
      : 10,
    pollJitterMs: 500,
    keywords: envKeywords
      ? envKeywords.split(",").map((k) => k.trim()).filter(Boolean)
      : keywordsJson,
    sites: sitesJson,
  };
}

export type { HtmlSite, RssSite, Config };
