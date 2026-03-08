export type IdeaStatus =
  | 'idea'
  | 'researching'
  | 'building'
  | 'launched'
  | 'abandoned';

export interface ReferenceLink {
  id: string;
  url: string;
  label?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: IdeaStatus;
  createdAt: string;
  lastActivityAt?: string;
  isFavorite: boolean;
  images: string[];
  links: ReferenceLink[];
  problem?: string;
  targetUsers?: string;
  features?: string;
  monetization?: string;
  challenges?: string;
  tasks: Task[];
}

export const PREDEFINED_CATEGORIES = [
  'App',
  'Startup',
  'Book',
  'Content',
  'Story',
  'Other',
] as const;

export type PredefinedCategory = (typeof PREDEFINED_CATEGORIES)[number];

export interface AppSettings {
  remindersEnabled: boolean;
  reminderDays: number;
  customCategories: string[];
}
