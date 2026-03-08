import { Stack } from 'expo-router';

export default function IdeaLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Edit Idea' }} />
    </Stack>
  );
}
