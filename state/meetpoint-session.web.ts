import type { MeetPointSession } from './meetpoint-session';

const STORAGE_KEY = 'meetpoint:active-session:v1';

export function loadMeetPointSession(): MeetPointSession | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const value = JSON.parse(raw) as Partial<MeetPointSession>;
    if (!value.city || !value.date || !value.arrivalTime || !Array.isArray(value.participants)) return undefined;
    if (!value.recommendation || !Array.isArray(value.recommendation.results)) return undefined;
    return value as MeetPointSession;
  } catch {
    return undefined;
  }
}

export function saveMeetPointSession(session: MeetPointSession) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // A private browser may deny storage. In-page navigation still keeps React state.
  }
}
