
export type View = 'dashboard' | 'calendar' | 'customers' | 'staff' | 'resources' | 'services' | 'billing' | 'analytics' | 'settings';

export type Theme = 'light' | 'dark';

export interface Identifiable {
  id: string;
}

export interface Customer extends Identifiable {
  name: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber?: string;
  credits: number; // in hours
  progressNotes: ProgressNote[];
}

export interface ProgressNote extends Identifiable {
  bookingId: string;
  date: string;
  notes: string;
  skills: Record<string, number>; // skill name -> rating 1-5
}

export type StaffType = 'Instructor' | 'Tour Guide' | 'Admin';

export interface Staff extends Identifiable {
  name: string;
  email: string;
  phone: string;
  type: StaffType;
  // Tour Guide specific
  languages?: string[];
  specializations?: string[];
}

export type ResourceType = 'Vehicle' | 'Room' | 'Equipment';

export interface Resource extends Identifiable {
  name: string;
  type: ResourceType;
  // Vehicle specific
  motDueDate?: string;
  taxDueDate?: string;
  serviceDueDate?: string;
}

export type ServiceType = 'Driving Lesson' | 'Tour';
export type PricingModel = 'Fixed' | 'Tiered';

export interface Service extends Identifiable {
  name: string;
  type: ServiceType;
  duration: number; // in minutes
  pricingModel: PricingModel;
  price: number; // For fixed
  tieredPrice?: { min: number; max: number; price: number }[]; // For tiered
}

export type BookingStatus = 'Scheduled' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Paid (Credit)';

export interface Booking extends Identifiable {
  customerId: string;
  staffId: string;
  serviceId: string;
  resourceId?: string;
  start: string; // ISO string
  end: string; // ISO string
  pickupLocation?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  googleEventId?: string;
  // Tour specific
  groupSize?: number;
  participants?: string[];
  // Recurring booking details
  recurringDetails?: {
    groupId: string; // A shared ID for all bookings in a recurring series.
    type: 'daily' | 'weekly' | 'bi-weekly';
    count: number;
  }
}

export interface BlockedPeriod extends Identifiable {
  staffId: string;
  start: string; // ISO string
  end: string; // ISO string
  reason: string;
}

export interface Expense extends Identifiable {
  date: string; // ISO string
  category: string;
  amount: number;
  description: string;
}

export interface Transaction extends Identifiable {
  date: string; // ISO string
  bookingId?: string;
  customerId: string;
  amount: number;
  method: 'Cash' | 'Card' | 'Credit';
}

export interface Settings {
  businessName: string;
  businessAddress: string;
  theme: Theme;
  geminiApiKey: string;
  emailTemplate: string;
  smsTemplate: string;
  googleCalendarEnabled: boolean;
  googleCalendarApiKey: string;
  googleCalendarClientId: string;
}

export type AppEntity = Customer | Staff | Resource | Service | Booking | BlockedPeriod | Expense | Transaction;
export type AppEntityKey = 'customers' | 'staff' | 'resources' | 'services' | 'bookings' | 'blockedPeriods' | 'expenses' | 'transactions';

export interface AppState {
  customers: Customer[];
  staff: Staff[];
  resources: Resource[];
  services: Service[];
  bookings: Booking[];
  blockedPeriods: BlockedPeriod[];
  expenses: Expense[];
  transactions: Transaction[];
  settings: Settings;
}