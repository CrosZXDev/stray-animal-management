/** Types for map feature */

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface HeatmapData {
  points: HeatmapPoint[];
  total: number;
  useHeatmap: boolean;
}

export interface AnimalMarker {
  id: string;
  animalId: string;
  name: string | null;
  type: string;
  color: string;
  status: string;
  latitude: number;
  longitude: number;
  district: string;
}

export interface FeedingStation {
  id: string;
  latitude: number;
  longitude: number;
  district: string;
  feedingTime: string;
  isActive: boolean;
}

export interface Zone {
  id: string;
  name: string;
  district: string;
  boundary: string;
  assignedTeam?: string;
  createdAt?: string;
}

export interface ZoneStats {
  zoneId: string;
  totalAnimals: number;
  neutered: number;
  vaccinated: number;
  pendingReports: number;
  resolvedReports: number;
}

export interface CreateZonePayload {
  name: string;
  district: string;
  boundary: string; // GeoJSON string
  assignedTeam: string;
}

export interface MapLayers {
  feedingStations: FeedingStation[];
  zones: Zone[];
  shelters: unknown[];
}

export interface LayerVisibility {
  animals: boolean;
  feedingStations: boolean;
  shelters: boolean;
  tnrAreas: boolean;
}
