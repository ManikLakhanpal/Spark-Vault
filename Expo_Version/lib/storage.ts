import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Idea, AppSettings } from '@/types/idea';

const IDEAS_KEY = 'sparkvault_ideas';
const SETTINGS_KEY = 'sparkvault_settings';

export async function loadIdeas(): Promise<Idea[]> {
  try {
    const data = await AsyncStorage.getItem(IDEAS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveIdeas(ideas: Idea[]): Promise<void> {
  await AsyncStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
}

const DEFAULT_SETTINGS: AppSettings = {
  remindersEnabled: true,
  reminderDays: 7,
  customCategories: [],
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
