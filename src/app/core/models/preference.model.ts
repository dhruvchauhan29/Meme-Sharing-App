export interface Preference {
  sortOrder: 'newest' | 'oldest';
  filterTeam?: string;
  filterMood?: string;
  filterTags: string[];
  showSavedOnly: boolean;
  searchQuery: string;
}
