import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Idea, IdeaStatus, ReferenceLink, Task, AppSettings } from '@/types/idea';
import { PREDEFINED_CATEGORIES } from '@/types/idea';
import { loadIdeas, saveIdeas, loadSettings, saveSettings } from '@/lib/storage';
import { deleteIdeaImages, deleteImage } from '@/lib/images';

export type SortOption = 'newest' | 'oldest' | 'favorites';

interface IdeasContextValue {
  ideas: Idea[];
  filteredIdeas: Idea[];
  settings: AppSettings;
  searchQuery: string;
  filterCategory: string | null;
  filterStatus: IdeaStatus | null;
  sortBy: SortOption;
  isLoading: boolean;
  setSearchQuery: (q: string) => void;
  setFilterCategory: (c: string | null) => void;
  setFilterStatus: (s: IdeaStatus | null) => void;
  setSortBy: (s: SortOption) => void;
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'lastActivityAt' | 'images' | 'links' | 'tasks'> & Partial<Pick<Idea, 'problem' | 'targetUsers' | 'features' | 'monetization' | 'challenges'>>) => Idea;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  getIdeaById: (id: string) => Idea | undefined;
  toggleFavorite: (id: string) => void;
  addTask: (ideaId: string, title: string) => void;
  toggleTask: (ideaId: string, taskId: string) => void;
  deleteTask: (ideaId: string, taskId: string) => void;
  addLink: (ideaId: string, url: string, label?: string) => void;
  removeLink: (ideaId: string, linkId: string) => void;
  addImage: (ideaId: string, uri: string) => void;
  removeImage: (ideaId: string, uri: string) => void;
  getAllCategories: () => string[];
  updateSettings: (updates: Partial<AppSettings>) => void;
  addCustomCategory: (name: string) => void;
  removeCustomCategory: (name: string) => void;
  refreshIdeas: () => Promise<void>;
}

const IdeasContext = createContext<IdeasContextValue | null>(null);

function filterAndSortIdeas(
  ideas: Idea[],
  searchQuery: string,
  filterCategory: string | null,
  filterStatus: IdeaStatus | null,
  sortBy: SortOption
): Idea[] {
  let result = [...ideas];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      (idea) =>
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        idea.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (filterCategory) {
    result = result.filter((idea) => idea.category === filterCategory);
  }

  if (filterStatus) {
    result = result.filter((idea) => idea.status === filterStatus);
  }

  if (sortBy === 'newest') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'oldest') {
    result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sortBy === 'favorites') {
    result.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return result;
}

export function IdeasProvider({ children }: { children: React.ReactNode }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>({
    remindersEnabled: true,
    reminderDays: 7,
    customCategories: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<IdeaStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isLoading, setIsLoading] = useState(true);

  const filteredIdeas = filterAndSortIdeas(
    ideas,
    searchQuery,
    filterCategory,
    filterStatus,
    sortBy
  );

  const refreshIdeas = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loadedIdeas, loadedSettings] = await Promise.all([
        loadIdeas(),
        loadSettings(),
      ]);
      setIdeas(loadedIdeas);
      setSettingsState(loadedSettings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshIdeas();
  }, [refreshIdeas]);

  useEffect(() => {
    if (ideas.length > 0) {
      saveIdeas(ideas);
    }
  }, [ideas]);

  const addIdea = useCallback(
    (
      idea: Omit<
        Idea,
        'id' | 'createdAt' | 'lastActivityAt' | 'images' | 'links' | 'tasks'
      > &
        Partial<Pick<Idea, 'problem' | 'targetUsers' | 'features' | 'monetization' | 'challenges'>>
    ): Idea => {
      const now = new Date().toISOString();
      const newIdea: Idea = {
        ...idea,
        id: uuidv4(),
        createdAt: now,
        lastActivityAt: now,
        images: [],
        links: [],
        tasks: [],
      };
      setIdeas((prev) => [...prev, newIdea]);
      return newIdea;
    },
    []
  );

  const updateIdea = useCallback((id: string, updates: Partial<Idea>) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id
          ? {
              ...idea,
              ...updates,
              lastActivityAt: new Date().toISOString(),
            }
          : idea
      )
    );
  }, []);

  const deleteIdea = useCallback(async (id: string) => {
    await deleteIdeaImages(id);
    setIdeas((prev) => prev.filter((idea) => idea.id !== id));
  }, []);

  const getIdeaById = useCallback(
    (id: string) => ideas.find((idea) => idea.id === id),
    [ideas]
  );

  const toggleFavorite = useCallback((id: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id ? { ...idea, isFavorite: !idea.isFavorite } : idea
      )
    );
  }, []);

  const addTask = useCallback((ideaId: string, title: string) => {
    const task: Task = { id: uuidv4(), title, completed: false };
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId
          ? { ...idea, tasks: [...idea.tasks, task], lastActivityAt: new Date().toISOString() }
          : idea
      )
    );
  }, []);

  const toggleTask = useCallback((ideaId: string, taskId: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              tasks: idea.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
              ),
              lastActivityAt: new Date().toISOString(),
            }
          : idea
      )
    );
  }, []);

  const deleteTask = useCallback((ideaId: string, taskId: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              tasks: idea.tasks.filter((t) => t.id !== taskId),
              lastActivityAt: new Date().toISOString(),
            }
          : idea
      )
    );
  }, []);

  const addLink = useCallback((ideaId: string, url: string, label?: string) => {
    const link: ReferenceLink = { id: uuidv4(), url, label };
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId
          ? { ...idea, links: [...idea.links, link], lastActivityAt: new Date().toISOString() }
          : idea
      )
    );
  }, []);

  const removeLink = useCallback((ideaId: string, linkId: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              links: idea.links.filter((l) => l.id !== linkId),
              lastActivityAt: new Date().toISOString(),
            }
          : idea
      )
    );
  }, []);

  const addImage = useCallback((ideaId: string, uri: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId
          ? { ...idea, images: [...idea.images, uri], lastActivityAt: new Date().toISOString() }
          : idea
      )
    );
  }, []);

  const removeImage = useCallback(async (ideaId: string, uri: string) => {
    await deleteImage(uri);
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              images: idea.images.filter((i) => i !== uri),
              lastActivityAt: new Date().toISOString(),
            }
          : idea
      )
    );
  }, []);

  const getAllCategories = useCallback(() => {
    const custom = settings.customCategories;
    return [...PREDEFINED_CATEGORIES, ...custom];
  }, [settings.customCategories]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  const addCustomCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || settings.customCategories.includes(trimmed)) return;
      const next = [...settings.customCategories, trimmed];
      const updated = { ...settings, customCategories: next };
      setSettingsState(updated);
      saveSettings(updated);
    },
    [settings]
  );

  const removeCustomCategory = useCallback(
    (name: string) => {
      const next = settings.customCategories.filter((c) => c !== name);
      const updated = { ...settings, customCategories: next };
      setSettingsState(updated);
      saveSettings(updated);
    },
    [settings]
  );

  const value: IdeasContextValue = {
    ideas,
    filteredIdeas,
    settings,
    searchQuery,
    filterCategory,
    filterStatus,
    sortBy,
    isLoading,
    setSearchQuery,
    setFilterCategory,
    setFilterStatus,
    setSortBy,
    addIdea,
    updateIdea,
    deleteIdea,
    getIdeaById,
    toggleFavorite,
    addTask,
    toggleTask,
    deleteTask,
    addLink,
    removeLink,
    addImage,
    removeImage,
    getAllCategories,
    updateSettings,
    addCustomCategory,
    removeCustomCategory,
    refreshIdeas,
  };

  return (
    <IdeasContext.Provider value={value}>{children}</IdeasContext.Provider>
  );
}

export function useIdeas() {
  const ctx = useContext(IdeasContext);
  if (!ctx) throw new Error('useIdeas must be used within IdeasProvider');
  return ctx;
}
