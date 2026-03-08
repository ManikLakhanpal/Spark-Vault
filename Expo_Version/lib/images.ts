import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';

const IDEAS_DIR = documentDirectory ? `${documentDirectory}ideas` : '';

export function getIdeaImagesDir(ideaId: string): string {
  return `${IDEAS_DIR}/${ideaId}`;
}

export async function ensureIdeaImagesDir(ideaId: string): Promise<string> {
  const dir = getIdeaImagesDir(ideaId);
  const info = await getInfoAsync(dir);
  if (!info.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

export async function saveImageToIdea(
  ideaId: string,
  sourceUri: string,
  filename: string
): Promise<string> {
  const dir = await ensureIdeaImagesDir(ideaId);
  const destUri = `${dir}/${filename}`;
  await copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

export async function deleteIdeaImages(ideaId: string): Promise<void> {
  const dir = getIdeaImagesDir(ideaId);
  const info = await getInfoAsync(dir);
  if (info.exists) {
    await deleteAsync(dir, { idempotent: true });
  }
}

export async function deleteImage(uri: string): Promise<void> {
  const info = await getInfoAsync(uri);
  if (info.exists) {
    await deleteAsync(uri, { idempotent: true });
  }
}
