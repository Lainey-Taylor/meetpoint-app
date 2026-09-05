import type { DirectResponse, Participant, Place, RecommendationResponse } from '@/types/meetpoint';
import { Platform } from 'react-native';

const configuredApiBase = process.env.EXPO_PUBLIC_MEETPOINT_API_URL?.trim();
const API_BASE = (Platform.OS === 'web' && !__DEV__
  ? ''
  : configuredApiBase || (Platform.OS === 'web' ? '' : 'http://127.0.0.1:4173')
).replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || `请求失败（${response.status}）`);
    return payload as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function suggestPlaces(city: string, keywords: string, kind: 'place' | 'restaurant' | 'restaurant-or-address') {
  if (keywords.trim().length < 2) return [] as Place[];
  const query = new URLSearchParams({ city, keywords: keywords.trim(), kind });
  const data = await request<{ suggestions: Place[] }>(`/api/suggest?${query}`);
  return data.suggestions || [];
}

function serializeParticipant(person: Participant) {
  return {
    name: person.name,
    address: person.address,
    selectedPlace: person.selectedPlace,
    modes: person.modes,
  };
}

export function recommendRestaurants(input: {
  city: string;
  date: string;
  arrivalTime: string;
  participants: Participant[];
  budget?: number;
  includeCuisines?: string[];
  excludeCuisines?: string[];
}) {
  return request<RecommendationResponse>('/api/recommend', {
    method: 'POST',
    body: JSON.stringify({
      city: input.city,
      date: input.date,
      arrivalTime: input.arrivalTime,
      participants: input.participants.map(serializeParticipant),
      filters: {
        budget: input.budget || null,
        includeCuisines: input.includeCuisines || [],
        excludeCuisines: input.excludeCuisines || [],
      },
    }),
  });
}

export function calculateRestaurantCommute(input: {
  city: string;
  date: string;
  arrivalTime: string;
  participants: Participant[];
  restaurant: Place;
}) {
  return request<DirectResponse>('/api/restaurant-commute', {
    method: 'POST',
    body: JSON.stringify({
      city: input.city,
      date: input.date,
      arrivalTime: input.arrivalTime,
      participants: input.participants.map(serializeParticipant),
      restaurant: { query: input.restaurant.name, selectedPlace: input.restaurant },
    }),
  });
}

export { API_BASE };
