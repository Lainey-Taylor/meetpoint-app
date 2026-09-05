import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { demoQualified, initialParticipants } from '@/data/demo';
import type { DirectResponse, Participant, Place, RecommendationResponse } from '@/types/meetpoint';

type MeetPointState = {
  city: string;
  date: string;
  arrivalTime: string;
  participants: Participant[];
  recommendation: RecommendationResponse;
  directResult?: DirectResponse;
  setParticipants: (people: Participant[]) => void;
  setCity: (city: string) => void;
  setDate: (date: string) => void;
  setArrivalTime: (time: string) => void;
  setRecommendation: (result: RecommendationResponse) => void;
  setDirectResult: (result?: DirectResponse) => void;
  setParticipantPlace: (id: string, place: Place) => void;
};

const Context = createContext<MeetPointState | null>(null);

export function MeetPointProvider({ children }: PropsWithChildren) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [city, setCity] = useState('北京');
  const [date, setDate] = useState(() => {
    const nextDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return nextDay.toISOString().slice(0, 10);
  });
  const [arrivalTime, setArrivalTime] = useState('18:30');
  const [recommendation, setRecommendation] = useState(demoQualified);
  const [directResult, setDirectResult] = useState<DirectResponse>();

  const value = useMemo<MeetPointState>(() => ({
    city, date, arrivalTime, participants, recommendation, directResult,
    setParticipants, setCity, setDate, setArrivalTime, setRecommendation, setDirectResult,
    setParticipantPlace(id, place) {
      setParticipants((current) => current.map((person) => person.id === id
        ? { ...person, address: place.name, selectedPlace: place }
        : person));
    },
  }), [arrivalTime, city, date, directResult, participants, recommendation]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useMeetPoint() {
  const value = useContext(Context);
  if (!value) throw new Error('useMeetPoint must be used inside MeetPointProvider');
  return value;
}
