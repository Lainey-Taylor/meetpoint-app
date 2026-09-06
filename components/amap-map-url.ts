import { API_BASE } from '@/services/meetpoint-api';

export type MapPoint = { label: string; location?: { lng: number; lat: number } };

export function buildAmapUrl(members: MapPoint[], restaurants: MapPoint[], allowEmpty = false) {
  const payload = {
    members: members.filter((item) => item.location).slice(0, 4),
    restaurants: restaurants.filter((item) => item.location).slice(0, 10),
  };
  if (!allowEmpty && (!payload.members.length || !payload.restaurants.length)) return null;
  return `${API_BASE}/api/map?data=${encodeURIComponent(JSON.stringify(payload))}`;
}
