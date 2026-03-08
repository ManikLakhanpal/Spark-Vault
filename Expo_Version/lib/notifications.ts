import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleIdeaReminder(
  ideaId: string,
  ideaTitle: string,
  daysSinceActivity: number
): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Haven't worked on your idea",
      body: `You haven't worked on "${ideaTitle}" in ${daysSinceActivity} days.`,
      data: { ideaId },
    },
    trigger: null,
  });
  return id;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleRemindersForStaleIdeas(
  ideas: { id: string; title: string; lastActivityAt?: string }[],
  reminderDays: number
): Promise<Map<string, string>> {
  const granted = await requestNotificationPermissions();
  if (!granted) return new Map();

  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const scheduled = new Map<string, string>();

  for (const idea of ideas) {
    const last = idea.lastActivityAt ? new Date(idea.lastActivityAt).getTime() : now;
    const daysSince = Math.floor((now - last) / msPerDay);
    if (daysSince >= reminderDays) {
      const id = await scheduleIdeaReminder(idea.id, idea.title, daysSince);
      if (id) scheduled.set(idea.id, id);
    }
  }
  return scheduled;
}
