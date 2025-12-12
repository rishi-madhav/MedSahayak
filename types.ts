
export enum Sender {
  USER = 'user',
  BOT = 'bot'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency'
}

export type DoctorPersona = 'female' | 'male' | 'neutral';

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  image?: string; // Base64 string
}

export interface MedicalReport {
  summary: string;
  potentialConditions: string[];
  severity: Severity;
  recommendations: string[];
  disclaimer: string;
}

export interface Consultation {
  id: string;
  date: string; // ISO string
  messages: Message[];
  report?: MedicalReport;
}

export interface ChatResponse {
  text: string;
  isEmergency: boolean;
}

export interface Reminder {
  id: string;
  medicineName: string;
  dosage?: string; // Added for dashboard
  frequency: 'once' | 'twice' | 'thrice' | 'custom';
  times: string[]; // HH:mm format
  startDate: string; // ISO string
  durationDays: number;
  notes?: string;
  active: boolean;
  doses?: { date: string; time: string; taken: boolean }[]; // Log of taken doses
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    }
  };
  openingHours?: {
    isOpen: () => boolean;
  };
  distance?: number; // Calculated distance in km
  placeId: string;
}

export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa';
