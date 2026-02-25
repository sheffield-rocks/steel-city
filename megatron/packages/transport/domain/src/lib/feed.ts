export type FeedId = string;

export type FeedConfig = {
  id: FeedId;
  name: string;
  staticUrl: string;
  realtimeUrl?: string;
  apiKeyEnv?: string;
};

export type FeedConfigFile = {
  feeds: FeedConfig[];
};
