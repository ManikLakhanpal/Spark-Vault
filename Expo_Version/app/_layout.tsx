import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';

import { IdeasProvider, useIdeas } from '@/context/IdeasContext';
import { cancelAllNotifications, scheduleRemindersForStaleIdeas } from '@/lib/notifications';
import { useColorScheme } from '@/hooks/use-color-scheme';

function ReminderScheduler() {
  const { ideas, settings } = useIdeas();

  const runReminders = useCallback(async () => {
    if (!settings.remindersEnabled) {
      await cancelAllNotifications();
      return;
    }
    const stale = ideas
      .filter((i) => i.lastActivityAt || i.createdAt)
      .map((i) => ({
        id: i.id,
        title: i.title,
        lastActivityAt: i.lastActivityAt ?? i.createdAt,
      }));
    await scheduleRemindersForStaleIdeas(stale, settings.reminderDays);
  }, [ideas, settings.remindersEnabled, settings.reminderDays]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') runReminders();
    });
    runReminders();
    return () => sub.remove();
  }, [runReminders]);

  return null;
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <IdeasProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ReminderScheduler />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="create"
            options={{ title: 'New Idea', presentation: 'modal' }}
          />
          <Stack.Screen name="idea" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </IdeasProvider>
  );
}
