
import React, { createContext, useReducer, useEffect, ReactNode } from 'react';
// FIX: Added 'Expense' to the type import list to resolve a type error.
import type { AppState, AppEntityKey, AppEntity, StaffType, ResourceType, ServiceType, PricingModel, BookingStatus, PaymentStatus, Booking, Transaction, ProgressNote, Expense } from '../types';
import { LOCAL_STORAGE_KEY, DRIVING_SKILLS } from '../constants';
import { generateId } from '../utils';

const getInitialState = (): AppState => {
  try {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error("Failed to load state from localStorage", error);
  }

  // --- COMPREHENSIVE TEST DATA ---

  // --- Core Entities ---
  const sampleCustomers = [
    { id: 'cust1', name: 'John Doe', email: 'john.d@example.com', phone: '555-0101', address: '123 Oak Ave, Anytown', licenseNumber: 'D12345', credits: 2, progressNotes: [] },
    { id: 'cust2', name: 'Jane Smith', email: 'jane.s@example.com', phone: '555-0102', address: '456 Pine St, Anytown', licenseNumber: 'S67890', credits: 0, progressNotes: [] },
    { id: 'cust3', name: 'Michael Chen', email: 'michael.c@example.com', phone: '555-0103', address: '789 Maple Dr, Anytown', licenseNumber: 'C54321', credits: 10, progressNotes: [] },
    { id: 'cust4', name: 'Sarah Jenkins', email: 'sarah.j@example.com', phone: '555-0104', address: '101 Birch Rd, Anytown', licenseNumber: 'J98765', credits: 0, progressNotes: [] },
  ];

  const sampleStaff = [
    { id: 'staff1', name: 'Ray Ryan', email: 'ray@ryandrivingschool.com', phone: '555-0199', type: 'Instructor' as StaffType },
    { id: 'staff2', name: 'Alice Martin', email: 'alice@ryandrivingschool.com', phone: '555-0198', type: 'Instructor' as StaffType },
    { id: 'staff3', name: 'Bob Carter', email: 'bob@ryandrivingschool.com', phone: '555-0197', type: 'Tour Guide' as StaffType },
  ];

  const sampleResources = [
    { id: 'res1', name: 'Toyota Yaris - RR01', type: 'Vehicle' as ResourceType, motDueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], taxDueDate: '2025-08-01', serviceDueDate: '2025-04-15' },
    { id: 'res2', name: 'Ford Focus - RR02', type: 'Vehicle' as ResourceType, motDueDate: '2025-11-20', taxDueDate: '2025-09-01', serviceDueDate: '2025-06-01' },
    { id: 'res3', name: 'Minibus - TOUR01', type: 'Vehicle' as ResourceType, motDueDate: '2025-09-15', taxDueDate: '2025-07-01', serviceDueDate: '2025-05-20' },
  ];

  const sampleServices = [
      {id: 'svc1', name: '1-Hour Driving Lesson', type: 'Driving Lesson' as ServiceType, duration: 60, pricingModel: 'Fixed' as PricingModel, price: 35},
      {id: 'svc2', name: '2-Hour Driving Lesson', type: 'Driving Lesson' as ServiceType, duration: 120, pricingModel: 'Fixed' as PricingModel, price: 65},
      {id: 'svc3', name: 'Pre-Test Assessment', type: 'Driving Lesson' as ServiceType, duration: 90, pricingModel: 'Fixed' as PricingModel, price: 50},
      {id: 'svc4', name: 'City Heritage Tour', type: 'Tour' as ServiceType, duration: 180, pricingModel: 'Tiered' as PricingModel, price: 0, tieredPrice: [{min: 1, max: 2, price: 50}, {min: 3, max: 5, price: 40}]},
  ];

  // --- Dynamic Date Helpers ---
  const today = new Date();
  const getDate = (monthDelta: number, dayDelta: number, hour: number, minute: number = 0) => {
      const d = new Date();
      d.setMonth(d.getMonth() + monthDelta);
      d.setDate(d.getDate() + dayDelta);
      d.setHours(hour, minute, 0, 0);
      return d;
  }

  // --- Progress Notes for Customer 1 ---
  const progressNotesForCust1: ProgressNote[] = [
      { id: 'pn1', bookingId: 'book_past1', date: getDate(0, -14, 10).toISOString(), notes: "Good control of the vehicle, needs to check mirrors more frequently, especially at junctions.", skills: { "Use of Mirrors": 3, "Junctions": 3, "Steering Control": 4 } },
      { id: 'pn2', bookingId: 'book_past2', date: getDate(0, -7, 10).toISOString(), notes: "Mirror checks have improved significantly. Parallel parking is still a challenge but getting better.", skills: { "Use of Mirrors": 4, "Parallel Parking": 2, "Awareness and Planning": 3 } },
      { id: 'pn3', bookingId: 'book_past3', date: getDate(0, -2, 14).toISOString(), notes: "Confident on roundabouts. Bay parking was excellent today. Ready to tackle dual carriageways next lesson.", skills: { "Roundabouts": 5, "Bay Parking": 5, "Parallel Parking": 3 } },
  ];
  sampleCustomers[0].progressNotes = progressNotesForCust1;

  // --- Bookings ---
  const sampleBookings: Booking[] = [
    // Past completed bookings for analytics
    { id: 'book_past1', customerId: 'cust1', staffId: 'staff1', serviceId: 'svc1', resourceId: 'res1', start: getDate(0, -14, 10).toISOString(), end: getDate(0, -14, 11).toISOString(), status: 'Completed' as BookingStatus, paymentStatus: 'Paid' as PaymentStatus },
    { id: 'book_past2', customerId: 'cust1', staffId: 'staff1', serviceId: 'svc1', resourceId: 'res1', start: getDate(0, -7, 10).toISOString(), end: getDate(0, -7, 11).toISOString(), status: 'Completed' as BookingStatus, paymentStatus: 'Paid' as PaymentStatus },
    { id: 'book_past3', customerId: 'cust1', staffId: 'staff2', serviceId: 'svc2', resourceId: 'res2', start: getDate(0, -2, 14).toISOString(), end: getDate(0, -2, 16).toISOString(), status: 'Completed' as BookingStatus, paymentStatus: 'Paid' as PaymentStatus },
    { id: 'book_past4', customerId: 'cust2', staffId: 'staff2', serviceId: 'svc1', resourceId: 'res2', start: getDate(0, -20, 11).toISOString(), end: getDate(0, -20, 12).toISOString(), status: 'Completed' as BookingStatus, paymentStatus: 'Paid' as PaymentStatus },
    
    // Upcoming bookings
    { id: 'book_future1', customerId: 'cust2', staffId: 'staff2', serviceId: 'svc3', resourceId: 'res2', start: getDate(0, 2, 9).toISOString(), end: getDate(0, 2, 10, 30).toISOString(), status: 'Scheduled' as BookingStatus, paymentStatus: 'Unpaid' as PaymentStatus },
    { id: 'book_future2', customerId: 'cust3', staffId: 'staff1', serviceId: 'svc2', resourceId: 'res1', start: getDate(0, 3, 13).toISOString(), end: getDate(0, 3, 15).toISOString(), status: 'Scheduled' as BookingStatus, paymentStatus: 'Paid (Credit)' as PaymentStatus },
    { id: 'book_future3', customerId: 'cust4', staffId: 'staff3', serviceId: 'svc4', resourceId: 'res3', start: getDate(0, 5, 10).toISOString(), end: getDate(0, 5, 13).toISOString(), status: 'Scheduled' as BookingStatus, paymentStatus: 'Paid' as PaymentStatus, groupSize: 4, participants: ['Sarah Jenkins', 'Paul Adams', 'Laura Wilson', 'Chris Green'] },

    // Cancelled booking
    { id: 'book_cancel1', customerId: 'cust2', staffId: 'staff1', serviceId: 'svc1', resourceId: 'res1', start: getDate(0, -5, 15).toISOString(), end: getDate(0, -5, 16).toISOString(), status: 'Cancelled' as BookingStatus, paymentStatus: 'Unpaid' as PaymentStatus },
    
    // Today's booking
    { id: 'book_today1', customerId: 'cust1', staffId: 'staff1', serviceId: 'svc1', resourceId: 'res1', start: getDate(0, 0, 11).toISOString(), end: getDate(0, 0, 12).toISOString(), status: 'Scheduled' as BookingStatus, paymentStatus: 'Unpaid' as PaymentStatus },
  ];
  
  // Recurring Bookings for Michael Chen (cust3)
  const recurringGroupId = generateId();
  for(let i=0; i < 4; i++) {
      const startDate = getDate(0, 7 + (i * 7), 10);
      const endDate = new Date(startDate.getTime() + 120 * 60000); // 2 hours
      sampleBookings.push({
          id: `book_recur_${i}`,
          customerId: 'cust3', staffId: 'staff1', serviceId: 'svc2', resourceId: 'res1',
          start: startDate.toISOString(), end: endDate.toISOString(),
          status: 'Scheduled' as BookingStatus, paymentStatus: 'Paid (Credit)' as PaymentStatus,
          recurringDetails: { groupId: recurringGroupId, type: 'weekly', count: 4 }
      });
  }

  // --- Financial Records for Analytics ---
  const sampleExpenses: Expense[] = [
    { id: 'exp1', date: getDate(-2, 5, 0).toISOString(), category: 'Fuel', amount: 65.50, description: 'Fuel for Toyota Yaris' },
    { id: 'exp2', date: getDate(-2, 18, 0).toISOString(), category: 'Insurance', amount: 120.00, description: 'Monthly vehicle insurance' },
    { id: 'exp3', date: getDate(-1, 6, 0).toISOString(), category: 'Fuel', amount: 72.30, description: 'Fuel for Ford Focus' },
    { id: 'exp4', date: getDate(-1, 18, 0).toISOString(), category: 'Insurance', amount: 120.00, description: 'Monthly vehicle insurance' },
    { id: 'exp5', date: getDate(0, -10, 0).toISOString(), category: 'Vehicle Maintenance', amount: 250.00, description: 'New tyres for Yaris' },
    { id: 'exp6', date: getDate(0, -2, 0).toISOString(), category: 'Fuel', amount: 68.90, description: 'Team fuel top-up' },
  ];
  
  const sampleTransactions: Transaction[] = [
    { id: 'txn1', date: getDate(0, -14, 11).toISOString(), bookingId: 'book_past1', customerId: 'cust1', amount: 35, method: 'Card' },
    { id: 'txn2', date: getDate(0, -7, 11).toISOString(), bookingId: 'book_past2', customerId: 'cust1', amount: 35, method: 'Card' },
    { id: 'txn3', date: getDate(0, -2, 16).toISOString(), bookingId: 'book_past3', customerId: 'cust1', amount: 65, method: 'Cash' },
    { id: 'txn4', date: getDate(0, -20, 12).toISOString(), bookingId: 'book_past4', customerId: 'cust2', amount: 35, method: 'Card' },
    { id: 'txn5', date: getDate(0, 5, 10).toISOString(), bookingId: 'book_future3', customerId: 'cust4', amount: 160, method: 'Card' }, // 4 people * 40
  ];

  // --- Blocked Periods ---
  const sampleBlockedPeriods = [
      { id: 'block1', staffId: 'staff1', start: getDate(0, 4, 13).toISOString(), end: getDate(0, 4, 17).toISOString(), reason: 'Dentist Appointment' }
  ];

  return {
    customers: sampleCustomers,
    staff: sampleStaff,
    resources: sampleResources,
    services: sampleServices,
    bookings: sampleBookings,
    blockedPeriods: sampleBlockedPeriods,
    expenses: sampleExpenses,
    transactions: sampleTransactions,
    // FIX: Removed geminiApiKey from initial settings to adhere to guidelines.
    settings: {
      businessName: "Ray Ryan Driving School",
      businessAddress: "123 Main St, Anytown, USA",
      theme: 'light',
      geminiApiKey: '',
      emailTemplate: `Hi {customerName},\n\nThis is a confirmation for your booking on {bookingDate} at {bookingTime}.\n\nThanks,\n{businessName}`,
      smsTemplate: `Booking confirmation: {bookingDate} @ {bookingTime} with {businessName}.`,
      googleCalendarEnabled: false,
      googleCalendarApiKey: '',
      googleCalendarClientId: '',
    },
  };
};

type Action = 
  | { type: 'SET_STATE'; payload: AppState } 
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'ADD_ITEM'; payload: { entity: AppEntityKey; data: Omit<AppEntity, 'id'> | Omit<AppEntity, 'id'>[] } }
  | { type: 'UPDATE_ITEM'; payload: { entity: AppEntityKey; data: AppEntity } }
  | { type: 'DELETE_ITEM'; payload: { entity: AppEntityKey; id: string } }
  | { type: 'RECORD_PAYMENT', payload: { booking: Booking, method: Transaction['method'] } };

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;
    case 'UPDATE_SETTINGS':
        return {
            ...state,
            settings: { ...state.settings, ...action.payload },
        };
    case 'ADD_ITEM': {
      const { entity, data } = action.payload;
      const itemsToAdd = Array.isArray(data) 
        ? data.map(d => ({ ...d, id: generateId() })) 
        : [{ ...data, id: generateId() }];
      
      return {
        ...state,
        [entity]: [...state[entity], ...itemsToAdd],
      };
    }
    case 'UPDATE_ITEM': {
      const { entity, data } = action.payload;
      return {
        ...state,
        [entity]: state[entity].map((item: AppEntity) => (item.id === data.id ? data : item)),
      };
    }
    case 'DELETE_ITEM': {
      const { entity, id } = action.payload;
      return {
        ...state,
        [entity]: state[entity].filter((item: AppEntity) => item.id !== id),
      };
    }
    case 'RECORD_PAYMENT': {
        const { booking, method } = action.payload;
        const service = state.services.find(s => s.id === booking.serviceId);
        if (!service) return state;

        const updatedBooking: Booking = { ...booking, paymentStatus: 'Paid' };
        
        const newTransaction: Omit<Transaction, 'id'> = {
            date: new Date().toISOString(),
            bookingId: booking.id,
            customerId: booking.customerId,
            amount: service.price,
            method: method,
        };

        return {
            ...state,
            bookings: state.bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b),
            transactions: [...state.transactions, { ...newTransaction, id: generateId() }]
        }
    }
    default:
      return state;
  }
};

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    try {
      // Debounce saving to localStorage
      const handler = setTimeout(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      }, 500);
      return () => clearTimeout(handler);
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [state]);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};