export type TravelMode = 'transit' | 'driving' | 'walking' | 'bicycling' | 'electrobike';

export type Place = {
  id?: string;
  name: string;
  district?: string;
  address?: string;
  location?: { lng: number; lat: number };
};

export type ModeConstraint = { mode: TravelMode; limitMinutes: number };

export type Participant = {
  id: string;
  name: string;
  address: string;
  selectedPlace?: Place;
  modes: ModeConstraint[];
  owner?: boolean;
};

export type RouteResult = {
  mode: TravelMode;
  status: 'ok' | 'error';
  displayMinutes?: number;
  durationSeconds?: number;
  limitMinutes?: number | null;
  qualifies?: boolean;
  overrunSeconds?: number;
  sourceNote?: string;
};

export type ParticipantResult = {
  name: string;
  feasible?: boolean;
  unverifiable?: boolean;
  bestOverrunSeconds?: number | null;
  routes: RouteResult[];
};

export type RestaurantResult = Place & {
  rating?: number | null;
  cost?: number | null;
  type?: string;
  qualified?: boolean;
  maxOverrunSeconds?: number | null;
  participantResults: ParticipantResult[];
  warnings?: string[];
};

export type RecommendationResponse = {
  resultType: 'qualified' | 'relaxed' | 'unverifiable';
  results: RestaurantResult[];
  participants?: Array<{ name: string; location?: { lng: number; lat: number }; formattedAddress?: string }>;
  center?: { lng: number; lat: number };
  summary?: Record<string, unknown>;
};

export type DirectResponse = {
  resultType: 'direct';
  restaurant: RestaurantResult;
  participantResults: ParticipantResult[];
  participants?: Array<{ name: string; location?: { lng: number; lat: number }; formattedAddress?: string }>;
  center?: { lng: number; lat: number };
};
