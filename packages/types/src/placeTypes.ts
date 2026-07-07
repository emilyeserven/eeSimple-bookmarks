export interface PlaceType {
  id: string;
  name: string;
  slug: string;
  /** Free-text description surfaced on the place type's detail page. */
  description: string | null;
  sortOrder: number;
  createdAt: string;
  /** How many locations currently use this place type (matched by slug). Computed server-side. */
  locationCount: number;
}

export interface CreatePlaceTypeInput {
  name: string;
  sortOrder?: number;
  description?: string | null;
}

export interface UpdatePlaceTypeInput {
  name?: string;
  sortOrder?: number;
  description?: string | null;
}
