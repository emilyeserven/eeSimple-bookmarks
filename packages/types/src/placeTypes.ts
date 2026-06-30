export interface PlaceType {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
  /** How many locations currently use this place type (matched by slug). Computed server-side. */
  locationCount: number;
}

export interface CreatePlaceTypeInput {
  name: string;
  sortOrder?: number;
}

export interface UpdatePlaceTypeInput {
  name?: string;
  sortOrder?: number;
}
