import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useIdeas } from '@/context/IdeasContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PREDEFINED_CATEGORIES } from '@/types/idea';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    settings,
    updateSettings,
    addCustomCategory,
    removeCustomCategory,
  } = useIdeas();

  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (PREDEFINED_CATEGORIES.includes(trimmed as (typeof PREDEFINED_CATEGORIES)[number])) {
      Alert.alert('Cannot add', 'This category already exists.');
      return;
    }
    if (settings.customCategories.includes(trimmed)) {
      Alert.alert('Already exists', 'This custom category already exists.');
      return;
    }
    addCustomCategory(trimmed);
    setNewCategory('');
  };

  const handleRemoveCategory = (name: string) => {
    Alert.alert(
      'Remove category',
      `Remove "${name}"? Ideas using this category will keep it until you edit them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeCustomCategory(name) },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText>Customize SparkVault</ThemedText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText type="subtitle">Reminders</ThemedText>
          <View style={styles.row}>
            <ThemedText>Enable reminders</ThemedText>
            <Switch
              value={settings.remindersEnabled}
              onValueChange={(v) => updateSettings({ remindersEnabled: v })}
              trackColor={{ false: colors.icon + '40', true: colors.tint + '80' }}
              thumbColor={settings.remindersEnabled ? colors.tint : colors.icon}
            />
          </View>
          <View style={styles.row}>
            <ThemedText>Remind after (days)</ThemedText>
            <View style={styles.daysRow}>
              {[3, 5, 7, 14, 30].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => updateSettings({ reminderDays: d })}
                  style={[
                    styles.dayChip,
                    { borderColor: colors.icon },
                    settings.reminderDays === d && { backgroundColor: colors.tint },
                  ]}>
                  <ThemedText style={settings.reminderDays === d && { color: '#fff' }}>
                    {d}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Custom categories</ThemedText>
          <ThemedText style={styles.hint}>
            Add your own categories in addition to: {PREDEFINED_CATEGORIES.join(', ')}
          </ThemedText>
          <View style={styles.addCategoryRow}>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              placeholder="New category name"
              placeholderTextColor={colors.icon}
              value={newCategory}
              onChangeText={setNewCategory}
              onSubmitEditing={handleAddCategory}
            />
            <Pressable
              onPress={handleAddCategory}
              style={[styles.addBtn, { backgroundColor: colors.tint }]}>
              <ThemedText style={{ color: '#fff' }}>Add</ThemedText>
            </Pressable>
          </View>
          {settings.customCategories.length > 0 && (
            <View style={styles.categoryList}>
              {settings.customCategories.map((c) => (
                <View key={c} style={[styles.categoryRow, { borderColor: colors.icon }]}>
                  <ThemedText>{c}</ThemedText>
                  <Pressable onPress={() => handleRemoveCategory(c)}>
                    <IconSymbol name="trash.fill" size={20} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  hint: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
  },
  addCategoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  categoryList: {
    marginTop: 16,
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
});
