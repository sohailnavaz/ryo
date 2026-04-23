import type { Category } from '@bnb/db';

export type SearchFilters = {
  destination?: string;
  startDate?: string;
  endDate?: string;
  guests?: number;
  category?: Category;
  minPrice?: number;
  maxPrice?: number;
  propertyTypes?: string[];
  amenities?: string[];
  bedrooms?: number;
};

export const EMPTY_FILTERS: SearchFilters = {
  category: 'All',
};
