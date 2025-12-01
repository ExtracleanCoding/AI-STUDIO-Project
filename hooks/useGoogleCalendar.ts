import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from './useAppContext';
import type { Booking } from '../types';

// Augment the window object with gapi and google types
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

const loadGapiScript = () => {
    return new Promise<void>((resolve, reject) => {
        if (document.getElementById('gapi-script')) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.id = 'gapi-script';
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load GAPI script.'));
        document.body.appendChild(script);
    });
};

export const useGoogleCalendar = () => {
    const { state, dispatch } = useAppContext();
    const { settings } = state;

    const [isApiReady, setIsApiReady] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    const updateSigninStatus = useCallback((signedIn: boolean) => {
        setIsSignedIn(signedIn);
        if (signedIn) {
            const profile = window.gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
            setCurrentUser(profile.getEmail());
        } else {
            setCurrentUser(null);
        }
    }, []);

    const initClient = useCallback(() => {
        window.gapi.client.init({
            apiKey: settings.googleCalendarApiKey,
            clientId: settings.googleCalendarClientId,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
        }).then(() => {
            setIsApiReady(true);
            const authInstance = window.gapi.auth2.getAuthInstance();
            authInstance.isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(authInstance.isSignedIn.get());
        }).catch((error: any) => {
            console.error("Error initializing Google API client:", error);
        });
    }, [settings.googleCalendarApiKey, settings.googleCalendarClientId, updateSigninStatus]);

    useEffect(() => {
        if (!settings.googleCalendarEnabled) return;
        
        loadGapiScript().then(() => {
            window.gapi.load('client:auth2', initClient);
        }).catch(console.error);
        
    }, [settings.googleCalendarEnabled, initClient]);

    const signIn = () => {
        if (isApiReady) {
            window.gapi.auth2.getAuthInstance().signIn();
        }
    };

    const signOut = () => {
        if (isApiReady) {
            window.gapi.auth2.getAuthInstance().signOut();
        }
    };
    
    const bookingToGoogleEvent = (booking: Booking) => {
        const customer = state.customers.find(c => c.id === booking.customerId);
        const service = state.services.find(s => s.id === booking.serviceId);
        
        return {
            'summary': `${service?.name || 'Appointment'} with ${customer?.name || 'Customer'}`,
            'description': `Service: ${service?.name}\nCustomer: ${customer?.name}\nStatus: ${booking.status}`,
            'start': { 'dateTime': booking.start, 'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone },
            'end': { 'dateTime': booking.end, 'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone },
            'extendedProperties': { 'private': { 'bookingId': booking.id } }
        };
    };

    const addSingleBookingToCalendar = async (booking: Booking): Promise<Booking | null> => {
        if (!isSignedIn) {
            alert("Please sign in to Google first.");
            return null;
        }
        if (!booking || !booking.id) {
            console.error("Invalid booking provided to sync.");
            return null;
        }

        try {
            const eventPayload = bookingToGoogleEvent(booking);
            let response;

            if (booking.googleEventId) {
                response = await window.gapi.client.calendar.events.update({
                    'calendarId': 'primary',
                    'eventId': booking.googleEventId,
                    'resource': eventPayload,
                });
                alert('Booking updated in your Google Calendar.');
                return booking;
            } else {
                response = await window.gapi.client.calendar.events.insert({
                    'calendarId': 'primary',
                    'resource': eventPayload,
                });
                
                if (response.result.id) {
                    const updatedBooking = { ...booking, googleEventId: response.result.id };
                    dispatch({ 
                        type: 'UPDATE_ITEM', 
                        payload: { entity: 'bookings', data: updatedBooking } 
                    });
                    alert('Booking added to your Google Calendar.');
                    return updatedBooking;
                }
            }
        } catch (error) {
            console.error("Error syncing single booking:", error);
            alert("Failed to sync booking with Google Calendar. See console for details.");
        }
        return null;
    };

    const syncBookings = async () => {
        if (!isSignedIn) {
            alert("Please sign in to Google first.");
            return;
        }

        try {
            const bookingsToSync = state.bookings.filter(b => new Date(b.start) > new Date() && b.status === 'Scheduled');
            if (bookingsToSync.length === 0) {
                alert("No upcoming, scheduled bookings to sync.");
                return;
            }

            const existingEventsResponse = await window.gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'privateExtendedProperty': `bookingId`,
                'showDeleted': false,
            });
            
            const existingEvents = existingEventsResponse.result.items;
            const batch = window.gapi.client.newBatch();

            for (const booking of bookingsToSync) {
                const eventPayload = bookingToGoogleEvent(booking);
                const existingEvent = existingEvents.find((e: any) => e.extendedProperties.private.bookingId === booking.id);

                if (existingEvent) { // Update existing event
                    batch.add(window.gapi.client.calendar.events.update({
                        'calendarId': 'primary',
                        'eventId': existingEvent.id,
                        'resource': eventPayload,
                    }));
                } else { // Create new event
                    const request = window.gapi.client.calendar.events.insert({
                        'calendarId': 'primary',
                        'resource': eventPayload,
                    });
                    
                    // Need to handle getting the ID back for new events
                    request.execute((resp: any) => {
                        if(resp.id && !booking.googleEventId) {
                            dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'bookings', data: { ...booking, googleEventId: resp.id } } });
                        }
                    });
                }
            }
            
            if (batch.getRequests().length > 0) {
                 await batch;
            }
            
            alert(`Sync complete! Checked ${bookingsToSync.length} bookings.`);

        } catch (error) {
            console.error("Error during Google Calendar sync:", error);
            alert(`An error occurred during sync. Check the console for details.`);
        }
    };


    return { isApiReady, isSignedIn, currentUser, signIn, signOut, syncBookings, addSingleBookingToCalendar };
};