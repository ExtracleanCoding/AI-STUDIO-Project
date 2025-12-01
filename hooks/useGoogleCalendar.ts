import { useAppContext } from './useAppContext';
import type { Booking } from '../types';

export const useGoogleCalendar = () => {
    const { state } = useAppContext();

    const openBookingInGoogleCalendar = (booking: Booking) => {
        if (!booking) return;

        const customer = state.customers.find(c => c.id === booking.customerId);
        const service = state.services.find(s => s.id === booking.serviceId);

        const title = encodeURIComponent(`${service?.name || 'Appointment'} with ${customer?.name || 'Customer'}`);
        const description = encodeURIComponent(`Service: ${service?.name}\nCustomer: ${customer?.name}\nStatus: ${booking.status}`);
        
        // Google Calendar URL format for dates: YYYYMMDDTHHMMSSZ (in UTC)
        const formatGoogleDate = (isoString: string) => {
            return new Date(isoString).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
        };

        const startDate = formatGoogleDate(booking.start);
        const endDate = formatGoogleDate(booking.end);

        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${description}`;
        
        // Open the URL in a new tab
        window.open(url, '_blank');
    };

    return { openBookingInGoogleCalendar };
};