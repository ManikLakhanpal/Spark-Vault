import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
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
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Idea, IdeaStatus } from '@/types/idea';

const STATUS_ICONS: Record<IdeaStatus, 'lightbulb.fill' | 'magnifyingglass' | 'hammer.fill' | 'paperplane.fill' | 'xmark.circle.fill'> = {
  idea: 'lightbulb.fill',
  researching: 'magnifyingglass',
  building: 'hammer.fill',
  launched: 'paperplane.fill',
  abandoned: 'xmark.circle.fill',
};

const STATUS_LABELS: Record<IdeaStatus, string> = {
  idea: 'Idea',
  researching: 'Researching',
  building: 'Building',
  launched: 'Launched',
  abandoned: 'Abandoned',
};

function IdeaCard({ idea, onDelete }: { idea: Idea; onDelete: (idea: Idea) => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLongPress = useCallback(() => {
    Alert.alert(idea.title, 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(idea) },
    ]);
  }, [idea, onDelete]);

  return (
    <Link href={`/idea/${idea.id}`} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.background },
          pressed && styles.cardPressed,
        ]}
        onLongPress={handleLongPress}>
        <View style={styles.cardHeader}>
          {idea.images[0] ? (
            <Image
              source={{ uri: idea.images[0] }}
              style={styles.cardThumb}
            />
          ) : (
            <View style={[styles.cardThumb, styles.cardThumbPlaceholder]}>
              <IconSymbol name="lightbulb.fill" size={24} color={colors.icon} />
            </View>
          )}
          <View style={styles.cardMeta}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {idea.title}
            </ThemedText>
            <ThemedText numberOfLines={2} style={styles.cardDesc}>
              {idea.description || 'No description'}
            </ThemedText>
            <View style={styles.cardTags}>
              <ThemedText style={styles.categoryTag}>{idea.category}</ThemedText>
              <IconSymbol
                name={STATUS_ICONS[idea.status]}
                size={14}
                color={colors.icon}
              />
              <ThemedText style={styles.statusText}>
                {STATUS_LABELS[idea.status]}
              </ThemedText>
            </View>
          </View>
          {idea.isFavorite && (
            <IconSymbol name="star.fill" size={20} color={accentColor} />
          )}
        </View>
      </Pressable>
    </Link>
  );
}

export default function VaultScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const tint = useThemeColor({}, 'tint');
  const {
    filteredIdeas,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    isLoading,
    getAllCategories,
    deleteIdea,
  } = useIdeas();

  const [showFilters, setShowFilters] = useState(false);
  const categories = getAllCategories();

  const handleDeleteIdea = useCallback(
    (idea: Idea) => {
      Alert.alert('Delete Idea', `Are you sure you want to delete "${idea.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteIdea(idea.id) },
      ]);
    },
    [deleteIdea]
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">SparkVault</ThemedText>
        <ThemedText>
          Capture ideas. Build the future.
        </ThemedText>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search ideas..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.toolbar}>
        <Pressable
          onPress={() => setShowFilters(f => !f)}
          style={[styles.filterBtn, { borderColor: colors.icon }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.text} />
          <ThemedText style={styles.filterBtnText}>Filters</ThemedText>
        </Pressable>
        <View style={styles.sortRow}>
          {(['newest', 'oldest', 'favorites'] as const).map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setSortBy(opt)}
              style={[
                styles.sortChip,
                sortBy === opt && { backgroundColor: tint },
              ]}>
              <ThemedText style={sortBy === opt && { color: '#fff' }}>
                {opt === 'newest' ? 'Newest' : opt === 'oldest' ? 'Oldest' : 'Favorites'}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {showFilters && (
        <View style={styles.filters}>
          <View style={styles.filterSection}>
            <ThemedText type="subtitle">Category</ThemedText>
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => setFilterCategory(null)}
                style={[styles.chip, !filterCategory && { backgroundColor: tint }]}>
                <ThemedText style={!filterCategory && { color: '#fff' }}>All</ThemedText>
              </Pressable>
              {categories.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setFilterCategory(c)}
                  style={[styles.chip, filterCategory === c && { backgroundColor: tint }]}>
                  <ThemedText style={filterCategory === c && { color: '#fff' }}>{c}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.filterSection}>
            <ThemedText type="subtitle">Status</ThemedText>
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => setFilterStatus(null)}
                style={[styles.chip, !filterStatus && { backgroundColor: tint }]}>
                <ThemedText style={!filterStatus && { color: '#fff' }}>All</ThemedText>
              </Pressable>
              {(['idea', 'researching', 'building', 'launched', 'abandoned'] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setFilterStatus(s)}
                  style={[styles.chip, filterStatus === s && { backgroundColor: tint }]}>
                  <ThemedText style={filterStatus === s && { color: '#fff' }}>
                    {STATUS_LABELS[s]}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}

      {isLoading ? (
        <ThemedText style={styles.empty}>Loading...</ThemedText>
      ) : filteredIdeas.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="lightbulb.fill" size={64} color={colors.icon} />
          <ThemedText type="subtitle">No ideas yet</ThemedText>
          <ThemedText>Tap the + button to capture your first idea.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredIdeas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IdeaCard idea={item} onDelete={handleDeleteIdea} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/create')}>
        <IconSymbol name="plus.circle.fill" size={56} color={accentColor} />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 14,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filters: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  filterSection: {
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  cardThumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  cardDesc: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  cardTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  categoryTag: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusText: {
    fontSize: 12,
    opacity: 0.7,
  },
  empty: {
    textAlign: 'center',
    padding: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  fabPressed: {
    opacity: 0.8,
  },
});
