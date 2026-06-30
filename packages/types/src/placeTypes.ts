export interface PlaceType {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
}

export interface CreatePlaceTypeInput {
  name: string;
  sortOrder?: number;
}

export interface UpdatePlaceTypeInput {
  name?: string;
  sortOrder?: number;
}
