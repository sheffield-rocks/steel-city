import Constants from 'expo-constants';

const DEFAULT_DATA_BASE_URL = 'https://raw.githubusercontent.com/sheffield-rocks/public-data/main/data';

const extraBaseUrl = Constants.expoConfig?.extra?.dataBaseUrl;
const envBaseUrl = process.env.EXPO_PUBLIC_DATA_BASE_URL;

export const DATA_BASE_URL = (envBaseUrl ?? extraBaseUrl ?? DEFAULT_DATA_BASE_URL).replace(/\/$/, '');

export const dataUrl = (path: string) => `${DATA_BASE_URL}/${path.replace(/^\/+/, '')}`;
