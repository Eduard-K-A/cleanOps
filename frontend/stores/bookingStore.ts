import { create } from 'zustand';
import type { BookingStep as StepType, JobUrgency } from '@/types';

type Step = 'size' | 'location' | 'urgency' | 'payment';

interface BookingState {
  step: Step;
  size: string;
  location_lat: number | null;
  location_lng: number | null;
  address: string;
  urgency: JobUrgency;
  tasks: string[];
  price_amount: number;
  setStep: (s: Step) => void;
  setSize: (s: string) => void;
  setLocation: (lat: number, lng: number, address?: string) => void;
  setUrgency: (u: JobUrgency) => void;
  setTasks: (t: string[]) => void;
  setPriceAmount: (n: number) => void;
  reset: () => void;
}

const defaultState = {
  step: 'size' as Step,
  size: '',
  location_lat: null as number | null,
  location_lng: null as number | null,
  address: '',
  urgency: 'NORMAL' as JobUrgency,
  tasks: [] as string[],
  price_amount: 0,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...defaultState,
  setStep: (step) => set({ step }),
  setSize: (size) => set({ size }),
  setLocation: (location_lat, location_lng, address) =>
    set({ location_lat, location_lng, address: address ?? '' }),
  setUrgency: (urgency) => set({ urgency }),
  setTasks: (tasks) => set({ tasks }),
  setPriceAmount: (price_amount) => set({ price_amount }),
  reset: () => set(defaultState),
}));
