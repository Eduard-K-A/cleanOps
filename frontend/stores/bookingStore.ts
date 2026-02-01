import { create } from 'zustand';
import type { BookingStep as StepType, JobUrgency } from '@/types';

type Step = 'size' | 'location' | 'urgency' | 'payment';

interface BookingState {
  step: Step;
  size: string;
  address: string;
  urgency: JobUrgency;
  tasks: string[];
  price_amount: number;
  setStep: (s: Step) => void;
  setSize: (s: string) => void;
  setLocation: (address: string) => void;
  setUrgency: (u: JobUrgency) => void;
  setTasks: (t: string[]) => void;
  setPriceAmount: (n: number) => void;
  reset: () => void;
}

const defaultState = {
  step: 'size' as Step,
  size: '',
  address: '',
  urgency: 'NORMAL' as JobUrgency,
  tasks: [] as string[],
  price_amount: 0,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...defaultState,
  setStep: (step) => set({ step }),
  setSize: (size) => set({ size }),
  setLocation: (address) => set({ address: address ?? '' }),
  setUrgency: (urgency) => set({ urgency }),
  setTasks: (tasks) => set({ tasks }),
  setPriceAmount: (price_amount) => set({ price_amount }),
  reset: () => set(defaultState),
}));
