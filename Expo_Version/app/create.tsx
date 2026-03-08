import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { IdeaAttachments } from '@/components/idea-attachments';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useIdeas } from '@/context/IdeasContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { IdeaStatus } from '@/types/idea';

const STATUS_OPTIONS: { value: IdeaStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'researching', label: 'Researching' },
  { value: 'building', label: 'Building' },
  { value: 'launched', label: 'Launched' },
  { value: 'abandoned', label: 'Abandoned' },
];

export default function CreateIdeaScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addIdea, addImage, addLink, getAllCategories } = useIdeas();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [status, setStatus] = useState<IdeaStatus>('idea');
  const [problem, setProblem] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [features, setFeatures] = useState('');
  const [monetization, setMonetization] = useState('');
  const [challenges, setChallenges] = useState('');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [pendingLinks, setPendingLinks] = useState<{ url: string; label?: string }[]>([]);

  const categories = getAllCategories();

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Required', 'Please enter an idea title.');
      return;
    }
    const cat = category.trim() || 'Other';
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const idea = addIdea({
      title: trimmedTitle,
      description: description.trim(),
      category: cat,
      tags,
      status,
      isFavorite: false,
      problem: problem.trim() || undefined,
      targetUsers: targetUsers.trim() || undefined,
      features: features.trim() || undefined,
      monetization: monetization.trim() || undefined,
      challenges: challenges.trim() || undefined,
    });

    const { saveImageToIdea } = await import('@/lib/images');
    for (let i = 0; i < pendingImages.length; i++) {
      const uri = pendingImages[i];
      const filename = `img_${Date.now()}_${i}.jpg`;
      const destUri = await saveImageToIdea(idea.id, uri, filename);
      addImage(idea.id, destUri);
    }
    for (const link of pendingLinks) {
      addLink(idea.id, link.url, link.label);
    }

    router.replace(`/idea/${idea.id}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={handleSave} style={styles.saveBtn}>
              <ThemedText style={{ color: colors.tint, fontWeight: '600' }}>
                Save
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Title</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
            placeholder="e.g. AI Study Planner"
            placeholderTextColor={colors.icon}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <ThemedText type="subtitle" style={styles.label}>Description</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: colors.text, borderColor: colors.icon },
            ]}
            placeholder="Describe your idea..."
            placeholderTextColor={colors.icon}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <ThemedText type="subtitle" style={styles.label}>Category</ThemedText>
          <View style={styles.chipRow}>
            {categories.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  styles.chip,
                  { borderColor: colors.icon },
                  category === c && { backgroundColor: colors.tint },
                ]}>
                <ThemedText style={category === c && { color: '#fff' }}>
                  {c}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="subtitle" style={styles.label}>Tags (comma-separated)</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
            placeholder="AI, Education, Productivity"
            placeholderTextColor={colors.icon}
            value={tagsStr}
            onChangeText={setTagsStr}
          />

          <ThemedText type="subtitle" style={styles.label}>Status</ThemedText>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setStatus(opt.value)}
                style={[
                  styles.chip,
                  { borderColor: colors.icon },
                  status === opt.value && { backgroundColor: colors.tint },
                ]}>
                <ThemedText style={status === opt.value && { color: '#fff' }}>
                  {opt.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <IdeaAttachments
            ideaId={null}
            images={[]}
            links={[]}
            pendingImages={pendingImages}
            pendingLinks={pendingLinks}
            onAddPendingImage={(uri) => setPendingImages((p) => [...p, uri])}
            onRemovePendingImage={(uri) => setPendingImages((p) => p.filter((u) => u !== uri))}
            onAddPendingLink={(url, label) => setPendingLinks((p) => [...p, { url, label }])}
            onRemovePendingLink={(idx) => setPendingLinks((p) => p.filter((_, i) => i !== idx))}
            editable={true}
          />

          <ThemedText type="subtitle" style={styles.sectionTitle}>Expansion (optional)</ThemedText>
          <ThemedText style={styles.label}>Problem it solves</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.icon }]}
            placeholder="What problem does this idea solve?"
            placeholderTextColor={colors.icon}
            value={problem}
            onChangeText={setProblem}
            multiline
          />
          <ThemedText style={styles.label}>Target users</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.icon }]}
            placeholder="Who is this for?"
            placeholderTextColor={colors.icon}
            value={targetUsers}
            onChangeText={setTargetUsers}
            multiline
          />
          <ThemedText style={styles.label}>Possible features</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.icon }]}
            placeholder="List possible features..."
            placeholderTextColor={colors.icon}
            value={features}
            onChangeText={setFeatures}
            multiline
          />
          <ThemedText style={styles.label}>Monetization</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.icon }]}
            placeholder="How could this make money?"
            placeholderTextColor={colors.icon}
            value={monetization}
            onChangeText={setMonetization}
            multiline
          />
          <ThemedText style={styles.label}>Challenges</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.icon }]}
            placeholder="What challenges might you face?"
            placeholderTextColor={colors.icon}
            value={challenges}
            onChangeText={setChallenges}
            multiline
          />
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  label: {
    marginTop: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionTitle: {
    marginTop: 24,
  },
});
