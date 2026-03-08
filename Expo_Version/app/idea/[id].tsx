import { IdeaAttachments } from '@/components/idea-attachments';
import * as WebBrowser from 'expo-web-browser';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, accentColor } from '@/constants/theme';
import { useIdeas } from '@/context/IdeasContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { IdeaStatus } from '@/types/idea';

const STATUS_LABELS: Record<IdeaStatus, string> = {
  idea: 'Idea',
  researching: 'Researching',
  building: 'Building',
  launched: 'Launched',
  abandoned: 'Abandoned',
};

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    getIdeaById,
    toggleFavorite,
    addTask,
    toggleTask,
    deleteTask,
    deleteIdea,
  } = useIdeas();

  const idea = id ? getIdeaById(id) : undefined;
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = useCallback(() => {
    if (!idea || !newTaskTitle.trim()) return;
    addTask(idea.id, newTaskTitle.trim());
    setNewTaskTitle('');
  }, [idea, newTaskTitle, addTask]);

  const handleDelete = useCallback(() => {
    if (!idea) return;
    Alert.alert('Delete Idea', `Are you sure you want to delete "${idea.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteIdea(idea.id);
        router.back();
      }},
    ]);
  }, [idea, deleteIdea, router]);

  if (!idea) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Idea not found.</ThemedText>
        <Pressable onPress={() => router.back()}>
          <ThemedText style={{ color: colors.tint }}>Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerRow}>
            <ThemedText type="title" numberOfLines={1} style={styles.headerTitle}>{idea.title}</ThemedText>
          <Pressable onPress={() => toggleFavorite(idea.id)}>
            <IconSymbol
              name="star.fill"
              size={28}
              color={idea.isFavorite ? accentColor : colors.icon}
            />
          </Pressable>
        </View>
        </View>
        <View style={styles.meta}>
          <ThemedText style={styles.category}>{idea.category}</ThemedText>
          <ThemedText style={styles.status}>{STATUS_LABELS[idea.status]}</ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {idea.description ? (
          <View style={styles.section}>
            <ThemedText type="subtitle">Description</ThemedText>
            <ThemedText style={styles.body}>{idea.description}</ThemedText>
          </View>
        ) : null}

        {idea.tags.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle">Tags</ThemedText>
            <View style={styles.tagRow}>
              {idea.tags.map((t) => (
                <View key={t} style={[styles.tag, { backgroundColor: colors.icon + '20' }]}>
                  <ThemedText>{t}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {(idea.images.length > 0 || idea.links.length > 0) && (
          <View style={styles.section}>
            <IdeaAttachments
              ideaId={idea.id}
              images={idea.images}
              links={idea.links}
              editable={false}
              onLinkPress={(url) => WebBrowser.openBrowserAsync(url)}
            />
          </View>
        )}

        {(idea.problem || idea.targetUsers || idea.features || idea.monetization || idea.challenges) && (
          <View style={styles.section}>
            <ThemedText type="subtitle">Expansion</ThemedText>
            {idea.problem && (
              <>
                <ThemedText style={styles.expLabel}>Problem it solves</ThemedText>
                <ThemedText style={styles.body}>{idea.problem}</ThemedText>
              </>
            )}
            {idea.targetUsers && (
              <>
                <ThemedText style={styles.expLabel}>Target users</ThemedText>
                <ThemedText style={styles.body}>{idea.targetUsers}</ThemedText>
              </>
            )}
            {idea.features && (
              <>
                <ThemedText style={styles.expLabel}>Possible features</ThemedText>
                <ThemedText style={styles.body}>{idea.features}</ThemedText>
              </>
            )}
            {idea.monetization && (
              <>
                <ThemedText style={styles.expLabel}>Monetization</ThemedText>
                <ThemedText style={styles.body}>{idea.monetization}</ThemedText>
              </>
            )}
            {idea.challenges && (
              <>
                <ThemedText style={styles.expLabel}>Challenges</ThemedText>
                <ThemedText style={styles.body}>{idea.challenges}</ThemedText>
              </>
            )}
          </View>
        )}

        <View style={styles.section}>
          <ThemedText type="subtitle">Tasks</ThemedText>
          <View style={styles.taskInputRow}>
            <TextInput
              style={[styles.taskInput, { color: colors.text, borderColor: colors.icon }]}
              placeholder="Add a task..."
              placeholderTextColor={colors.icon}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              onSubmitEditing={handleAddTask}
              returnKeyType="done"
            />
            <Pressable onPress={handleAddTask} style={[styles.addTaskBtn, { backgroundColor: colors.tint }]}>
              <ThemedText style={{ color: '#fff' }}>Add</ThemedText>
            </Pressable>
          </View>
          {idea.tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Pressable onPress={() => toggleTask(idea.id, task.id)}>
                <ThemedText style={task.completed ? styles.taskDone : undefined}>
                  {task.completed ? '✓ ' : '○ '}{task.title}
                </ThemedText>
              </Pressable>
              <Pressable onPress={() => deleteTask(idea.id, task.id)}>
                <IconSymbol name="trash.fill" size={18} color={colors.icon} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Link href={`/idea/${idea.id}/edit`} asChild>
          <Pressable style={[styles.footerBtn, { borderColor: colors.icon }]}>
            <IconSymbol name="pencil" size={20} color={colors.text} />
            <ThemedText>Edit</ThemedText>
          </Pressable>
        </Link>
        <Pressable
          onPress={handleDelete}
          style={[styles.footerBtn, { borderColor: colors.icon }]}>
          <IconSymbol name="trash.fill" size={20} color="#ef4444" />
          <ThemedText style={{ color: '#ef4444' }}>Delete</ThemedText>
        </Pressable>
      </View>
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
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  category: {
    fontSize: 14,
    opacity: 0.8,
  },
  status: {
    fontSize: 14,
    opacity: 0.8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  body: {
    marginTop: 8,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  expLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  taskInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  taskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addTaskBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  taskDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    alignItems: 'center',
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
