import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { saveImageToIdea } from '@/lib/images';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReferenceLink } from '@/types/idea';

interface PendingLink {
  url: string;
  label?: string;
}

interface IdeaAttachmentsProps {
  ideaId: string | null;
  images: string[];
  links: ReferenceLink[];
  onAddImage?: (uri: string) => void;
  onRemoveImage?: (uri: string) => void;
  onAddLink?: (url: string, label?: string) => void;
  onRemoveLink?: (linkId: string) => void;
  pendingImages?: string[];
  pendingLinks?: PendingLink[];
  onAddPendingImage?: (uri: string) => void;
  onRemovePendingImage?: (uri: string) => void;
  onAddPendingLink?: (url: string, label?: string) => void;
  onRemovePendingLink?: (index: number) => void;
  editable?: boolean;
  onLinkPress?: (url: string) => void;
}

export function IdeaAttachments({
  ideaId,
  images,
  links,
  onAddImage,
  onRemoveImage,
  onAddLink,
  onRemoveLink,
  pendingImages = [],
  pendingLinks = [],
  onAddPendingImage,
  onRemovePendingImage,
  onAddPendingLink,
  onRemovePendingLink,
  editable = true,
  onLinkPress,
}: IdeaAttachmentsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const allImages = ideaId ? images : (pendingImages ?? []);
  const allLinks = ideaId ? links : (pendingLinks ?? []);
  const isCreateMode = !ideaId;

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (isCreateMode && onAddPendingImage) {
        onAddPendingImage(uri);
      } else if (ideaId && onAddImage) {
        const filename = `img_${Date.now()}.jpg`;
        const destUri = await saveImageToIdea(ideaId, uri, filename);
        onAddImage(destUri);
      }
    }
  }, [ideaId, isCreateMode, onAddImage, onAddPendingImage]);

  const handleRemoveImage = useCallback(
    (uri: string) => {
      if (isCreateMode && onRemovePendingImage) {
        onRemovePendingImage(uri);
      } else {
        onRemoveImage?.(uri);
      }
    },
    [isCreateMode, onRemoveImage, onRemovePendingImage]
  );

  if (allImages.length === 0 && allLinks.length === 0 && !editable) {
    return null;
  }

  return (
    <View style={styles.container}>
      {(editable || allImages.length > 0) && (
        <>
          <ThemedText type="subtitle">Images</ThemedText>
          {editable && (
            <Pressable
              onPress={pickImage}
              style={[styles.addBtn, { borderColor: colors.icon }]}>
              <IconSymbol name="photo.fill" size={24} color={colors.icon} />
              <ThemedText>Add image</ThemedText>
            </Pressable>
          )}
          {allImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
              {allImages.map((uri) => (
                <View key={uri} style={styles.imageWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  {editable && (
                    <Pressable
                      onPress={() => handleRemoveImage(uri)}
                      style={styles.removeBtn}>
                      <IconSymbol name="xmark.circle.fill" size={24} color="#ef4444" />
                    </Pressable>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {editable && (
        <>
          <ThemedText type="subtitle" style={styles.label}>Links</ThemedText>
          <LinkInput
            onAdd={(url, label) => {
              if (isCreateMode && onAddPendingLink) {
                onAddPendingLink(url, label);
              } else if (onAddLink) {
                onAddLink(url, label);
              }
            }}
            colors={colors}
          />
        </>
      )}
      {allLinks.length > 0 && (
        <View style={[styles.linkList, !editable && styles.linkListReadOnly]}>
          <ThemedText type="subtitle" style={styles.label}>Links</ThemedText>
          {allLinks.map((link, idx) => (
            <Pressable
              key={'id' in link ? (link as ReferenceLink).id : `pending-${idx}`}
              onPress={() => onLinkPress?.(link.url)}
              style={[styles.linkRow, { borderColor: colors.icon }]}
              disabled={!onLinkPress}>
              <IconSymbol name="link" size={18} color={colors.tint} />
              <ThemedText numberOfLines={1} style={[styles.linkText, onLinkPress ? { color: colors.tint } : undefined]}>
                {link.label || link.url}
              </ThemedText>
              {editable && (
                <Pressable
                  onPress={() => {
                    if (isCreateMode && onRemovePendingLink) {
                      onRemovePendingLink(idx);
                    } else if (onRemoveLink && 'id' in link) {
                      onRemoveLink((link as ReferenceLink).id);
                    }
                  }}>
                  <IconSymbol name="trash.fill" size={18} color={colors.icon} />
                </Pressable>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function LinkInput({
  onAdd,
  colors,
}: {
  onAdd: (url: string, label?: string) => void;
  colors: (typeof Colors)['light'];
}) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onAdd(trimmed, label.trim() || undefined);
    setUrl('');
    setLabel('');
  };

  return (
    <View style={styles.linkInputRow}>
      <TextInput
        style={[styles.linkInput, { color: colors.text, borderColor: colors.icon }]}
        placeholder="https://..."
        placeholderTextColor={colors.icon}
        value={url}
        onChangeText={setUrl}
        keyboardType="url"
      />
      <TextInput
        style={[styles.linkInput, styles.linkLabelInput, { color: colors.text, borderColor: colors.icon }]}
        placeholder="Label (optional)"
        placeholderTextColor={colors.icon}
        value={label}
        onChangeText={setLabel}
      />
      <Pressable onPress={handleAdd} style={[styles.addLinkBtn, { backgroundColor: colors.tint }]}>
        <ThemedText style={{ color: '#fff' }}>Add</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  imageRow: {
    marginTop: 12,
  },
  imageWrap: {
    position: 'relative',
    marginRight: 12,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  label: {
    marginTop: 16,
  },
  linkInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  linkInput: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  linkLabelInput: {
    flex: 0.5,
    minWidth: 100,
  },
  addLinkBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  linkList: {
    marginTop: 12,
    gap: 8,
  },
  linkListReadOnly: {
    marginTop: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkText: {
    flex: 1,
  },
});
