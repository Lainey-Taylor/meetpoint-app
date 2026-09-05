import type { Participant, RecommendationResponse } from '@/types/meetpoint';

export type MeetPointSession = {
  city: string;
  date: string;
  arrivalTime: string;
  participants: Participant[];
  recommendation: RecommendationResponse;
};

export function loadMeetPointSession(): MeetPointSession | undefined {
  return undefined;
}

export function saveMeetPointSession(_session: MeetPointSession) {
  // Native persistence will be added with the installable app version.
}
