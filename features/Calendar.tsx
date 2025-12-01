import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { Button, Card, CardContent, Modal, Input, Label, Select, Badge, Tabs } from '../components/ui';
import type { Booking, BookingStatus, PaymentStatus, BlockedPeriod } from '../types';
import { generateId } from '../utils';

// MODALS
const BookingModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    bookingDate: Date;
    existingBooking?: Booking | null;
    checkConflict: (booking: Partial<Booking>) => boolean;
}> = ({ isOpen, onClose, bookingDate, existingBooking = null, checkConflict }) => {
    const { state, dispatch } = useAppContext();
    const { openBookingInGoogleCalendar } = useGoogleCalendar();
    const [booking, setBooking] = useState<Partial<Booking>>({});
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'bi-weekly'>('weekly');
    const [recurringCount, setRecurringCount] = useState(4);

    useEffect(() => {
        if (existingBooking) {
            setBooking(existingBooking);
            setIsRecurring(!!existingBooking.recurringDetails);
            if(existingBooking.recurringDetails) {
                setRecurringType(existingBooking.recurringDetails.type);
                setRecurringCount(existingBooking.recurringDetails.count);
            }
        } else {
            const start = new Date(bookingDate);
            start.setHours(9, 0, 0, 0); // Default to 9 AM
            const service = state.services[0];
            const end = new Date(start.getTime() + (service?.duration || 60) * 60000);
            setBooking({
                start: start.toISOString(),
                end: end.toISOString(),
                status: 'Scheduled',
                paymentStatus: 'Unpaid',
                serviceId: service?.id,
            });
            setIsRecurring(false);
        }
    }, [isOpen, existingBooking, bookingDate, state.services]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setBooking(prev => ({ ...prev, [name]: value }));

        if (name === 'serviceId' && booking.start) {
            const service = state.services.find(s => s.id === value);
            if(service) {
                const newEnd = new Date(new Date(booking.start).getTime() + service.duration * 60000);
                setBooking(prev => ({ ...prev, end: newEnd.toISOString() }));
            }
        }
        if (name === 'start') {
            const service = state.services.find(s => s.id === booking.serviceId);
            if(service) {
                const newEnd = new Date(new Date(value).getTime() + service.duration * 60000);
                setBooking(prev => ({ ...prev, end: newEnd.toISOString() }));
            }
        }
    };

    const handleSubmit = () => {
        if (!booking.customerId || !booking.staffId || !booking.serviceId || !booking.start || !booking.end) {
            alert("Please fill all required fields.");
            return;
        }
        
        if (checkConflict(booking)) {
            alert("This time slot conflicts with an existing booking or blocked period for the selected staff or resource.");
            return;
        }

        if (isRecurring) {
            const groupId = booking.recurringDetails?.groupId || generateId();
            const newBookings: Omit<Booking, 'id'>[] = [];
            let lastStartDate = new Date(booking.start);

            for(let i=0; i < recurringCount; i++) {
                if (i > 0) {
                     switch(recurringType) {
                        case 'daily': lastStartDate.setDate(lastStartDate.getDate() + 1); break;
                        case 'weekly': lastStartDate.setDate(lastStartDate.getDate() + 7); break;
                        case 'bi-weekly': lastStartDate.setDate(lastStartDate.getDate() + 14); break;
                    }
                }
                const duration = new Date(booking.end).getTime() - new Date(booking.start).getTime();
                const newBooking: Omit<Booking, 'id'> = {
                    ...booking as Omit<Booking, 'id'>,
                    start: new Date(lastStartDate).toISOString(),
                    end: new Date(lastStartDate.getTime() + duration).toISOString(),
                    recurringDetails: { groupId, type: recurringType, count: recurringCount },
                };
                if (!checkConflict(newBooking)) {
                     newBookings.push(newBooking);
                } else {
                    console.warn(`Skipping recurring booking on ${newBooking.start} due to conflict.`);
                }
            }
            dispatch({ type: 'ADD_ITEM', payload: { entity: 'bookings', data: newBookings }});
        } else {
             if (booking.id) {
                dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'bookings', data: { ...booking, recurringDetails: undefined } as Booking } });
            } else {
                dispatch({ type: 'ADD_ITEM', payload: { entity: 'bookings', data: booking as Omit<Booking, 'id'> } });
            }
        }
        onClose();
    };

    const handleDelete = () => {
        if (booking.id && window.confirm("Are you sure you want to delete this booking?")) {
            dispatch({ type: 'DELETE_ITEM', payload: { entity: 'bookings', id: booking.id } });
            onClose();
        }
    }

    const handleAddToGoogleCalendar = () => {
        if (booking.id) {
            openBookingInGoogleCalendar(booking as Booking);
        }
    };

    const modalFooter = (
        <div className="flex justify-between w-full">
            <div className="flex items-center space-x-2">
                {booking.id && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
                {booking.id && state.settings.googleCalendarEnabled && (
                    <Button 
                        variant="secondary" 
                        onClick={handleAddToGoogleCalendar} 
                    >
                        Add to Google Calendar
                    </Button>
                )}
            </div>
            <div className="flex space-x-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit}>Save Booking</Button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={booking.id ? "Edit Booking" : "New Booking"} footer={modalFooter}>
            <div className="space-y-4">
                <div><Label htmlFor="customerId">Customer</Label><Select name="customerId" id="customerId" value={booking.customerId} onChange={handleChange} required><option>Select Customer</option>{state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
                <div><Label htmlFor="staffId">Staff</Label><Select name="staffId" id="staffId" value={booking.staffId} onChange={handleChange} required><option>Select Staff</option>{state.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
                <div><Label htmlFor="serviceId">Service</Label><Select name="serviceId" id="serviceId" value={booking.serviceId} onChange={handleChange} required><option>Select Service</option>{state.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
                <div><Label htmlFor="resourceId">Resource</Label><Select name="resourceId" id="resourceId" value={booking.resourceId} onChange={handleChange}><option>Select Resource (optional)</option>{state.resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="start">Start Time</Label><Input type="datetime-local" name="start" id="start" value={booking.start ? booking.start.substring(0, 16) : ''} onChange={handleChange} required/></div>
                    <div><Label htmlFor="end">End Time</Label><Input type="datetime-local" name="end" id="end" value={booking.end ? booking.end.substring(0, 16) : ''} onChange={handleChange} disabled/></div>
                </div>
                <div><Label htmlFor="status">Status</Label><Select name="status" id="status" value={booking.status} onChange={handleChange} required>{['Scheduled', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}</Select></div>
                <div><Label htmlFor="paymentStatus">Payment Status</Label><Select name="paymentStatus" id="paymentStatus" value={booking.paymentStatus} onChange={handleChange} required>{['Unpaid', 'Paid', 'Paid (Credit)'].map(s => <option key={s} value={s}>{s}</option>)}</Select></div>
                 <div>
                    <div className="flex items-center">
                        <input id="isRecurring" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 text-brand-start focus:ring-brand-start border-gray-300 rounded" />
                        <Label htmlFor="isRecurring" className="ml-2 mb-0">Recurring Booking</Label>
                    </div>
                    {isRecurring && (
                        <div className="grid grid-cols-2 gap-4 mt-2 p-2 border rounded-md">
                            <Select value={recurringType} onChange={e => setRecurringType(e.target.value as any)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="bi-weekly">Bi-weekly</option></Select>
                            <Input type="number" value={recurringCount} onChange={e => setRecurringCount(parseInt(e.target.value))} placeholder="Occurrences"/>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

const BlockPeriodModal: React.FC<{isOpen: boolean, onClose: () => void}> = ({isOpen, onClose}) => {
    const { state, dispatch } = useAppContext();
    const [period, setPeriod] = useState<Partial<BlockedPeriod>>({staffId: state.staff[0]?.id});
    
    const handleSubmit = () => {
        if (!period.staffId || !period.start || !period.end) {
            alert("Please fill all fields.");
            return;
        }
        dispatch({type: 'ADD_ITEM', payload: { entity: 'blockedPeriods', data: period as Omit<BlockedPeriod, 'id'> }});
        onClose();
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPeriod(p => ({...p, [name]: value}));
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Block Staff Availability">
             <div className="space-y-4">
                <div><Label htmlFor="staffId-block">Staff</Label><Select name="staffId" id="staffId-block" value={period.staffId} onChange={handleChange} required>{state.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="start-block">Start Time</Label><Input type="datetime-local" name="start" id="start-block" value={period.start ? period.start.substring(0, 16) : ''} onChange={handleChange} required/></div>
                    <div><Label htmlFor="end-block">End Time</Label><Input type="datetime-local" name="end" id="end-block" value={period.end ? period.end.substring(0, 16) : ''} onChange={handleChange} required/></div>
                </div>
                <div><Label htmlFor="reason">Reason (optional)</Label><Input name="reason" id="reason" value={period.reason} onChange={handleChange} /></div>
                <div className="flex justify-end space-x-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit}>Block Period</Button></div>
            </div>
        </Modal>
    )
}

// VIEWS
type CalendarViewMode = 'month' | 'week' | 'day';

const getBookingColor = (booking: Booking): 'blue' | 'green' | 'gray' => {
    if(booking.status === 'Completed') return 'green';
    if(booking.status === 'Cancelled') return 'gray';
    return 'blue';
}

const MonthView: React.FC<{ 
    currentDate: Date;
    draggedBookingId: string | null;
    openModalForNew: (d: Date) => void; 
    openModalForEdit: (b: Booking) => void;
    handleDragStart: (e: React.DragEvent, bookingId: string) => void;
    handleDrop: (e: React.DragEvent, date: Date) => void;
}> = ({ currentDate, draggedBookingId, openModalForNew, openModalForEdit, handleDragStart, handleDrop }) => {
    const { state } = useAppContext();
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const days = Array.from({length: endOfMonth.getDate()}, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1));
    const prefixDays = startOfMonth.getDay(); 

    const bookingsByDate = useMemo(() => {
        const map: { [key: string]: Booking[] } = {};
        state.bookings.forEach(booking => {
            const dateKey = new Date(booking.start).toDateString();
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(booking);
        });
        return map;
    }, [state.bookings]);

    return (
        <Card>
            <CardContent className="p-0">
                <div className="grid grid-cols-7">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="text-center font-bold p-2 border-b border-r dark:border-gray-700 text-gray-600 dark:text-gray-300">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 h-[70vh]">
                    {Array.from({ length: prefixDays }).map((_, i) => <div key={`empty-${i}`} className="border-r border-b dark:border-gray-700"></div>)}
                    {days.map(day => {
                        const dateKey = day.toDateString();
                        const dayBookings = (bookingsByDate[dateKey] || []).sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
                        const isToday = day.toDateString() === new Date().toDateString();
                        return (
                            <div 
                                key={dateKey} 
                                className={`border-r border-b dark:border-gray-700 p-1 relative group overflow-y-auto transition-colors ${dragOverDate === dateKey ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnter={() => setDragOverDate(dateKey)}
                                onDragLeave={() => setDragOverDate(null)}
                                onDrop={(e) => { handleDrop(e, day); setDragOverDate(null); }}
                            >
                                <span className={`text-sm ${isToday ? 'bg-brand-start text-white rounded-full px-2' : ''}`}>{day.getDate()}</span>
                                <Button variant="ghost" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 h-auto text-xs" onClick={() => openModalForNew(day)}>+</Button>
                                <div className="mt-1 space-y-1">
                                    {dayBookings.map(booking => (
                                        <div 
                                            key={booking.id} 
                                            draggable 
                                            onDragStart={(e) => handleDragStart(e, booking.id)}
                                            onClick={() => openModalForEdit(booking)} 
                                            className={`cursor-grab transition-opacity ${draggedBookingId === booking.id ? 'opacity-30' : ''}`}
                                        >
                                            <Badge color={getBookingColor(booking)}>
                                                {new Date(booking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {state.customers.find(c => c.id === booking.customerId)?.name}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

const TimelineView: React.FC<{ 
    currentDate: Date; 
    viewMode: 'week' | 'day'; 
    draggedBookingId: string | null;
    openModalForNew: (d: Date) => void; 
    openModalForEdit: (b: Booking) => void; 
    handleDragStart: (e: React.DragEvent, bookingId: string) => void;
    handleDrop: (e: React.DragEvent, date: Date, timeInMinutes?: number) => void;
}> = ({ currentDate, viewMode, draggedBookingId, openModalForNew, openModalForEdit, handleDragStart, handleDrop }) => {
    const { state } = useAppContext();
    const { customers } = state;
    const [dragOverDay, setDragOverDay] = useState<string | null>(null);

    const days = useMemo(() => {
        if (viewMode === 'day') return [currentDate];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        return Array.from({length: 7}, (_, i) => new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));
    }, [currentDate, viewMode]);

    const timeSlots = Array.from({length: 16}, (_, i) => `${i + 6}:00`); // 6am to 9pm

    const getEventStyle = (start: Date, end: Date) => {
        const top = ((start.getHours() - 6) * 60 + start.getMinutes()) / (16 * 60) * 100;
        const height = (end.getTime() - start.getTime()) / (1000 * 60) / (16 * 60) * 100;
        return { top: `${top}%`, height: `${height}%` };
    };
    
    const onDropHandler = (e: React.DragEvent, day: Date) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const dropY = e.clientY - rect.top;
        const totalHeight = rect.height;
        const totalMinutesInView = 16 * 60;
        const minutesFromStart = (dropY / totalHeight) * totalMinutesInView;
        const snappedMinutes = Math.round(minutesFromStart / 15) * 15;
        const finalMinutes = (6 * 60) + snappedMinutes; // Add offset from 6am
        handleDrop(e, day, finalMinutes);
        setDragOverDay(null);
    };

    return (
        <Card className="h-[80vh] flex flex-col">
            <div className="grid grid-cols-[auto,1fr] flex-shrink-0">
                <div className="w-16 border-r border-b dark:border-gray-700"></div>
                <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                    {days.map(day => <div key={day.toISOString()} className="text-center font-bold p-2 border-b border-r dark:border-gray-700 text-gray-600 dark:text-gray-300">{day.toLocaleDateString([], {weekday: 'short', day: 'numeric'})}</div>)}
                </div>
            </div>
            <div className="flex-grow grid grid-cols-[auto,1fr] overflow-y-auto">
                <div className="w-16">
                    {timeSlots.map(time => <div key={time} className="h-16 text-right pr-2 text-xs text-gray-500 border-r dark:border-gray-700">{time}</div>)}
                </div>
                <div className={`relative grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                    {days.map(day => (
                        <div 
                            key={day.toISOString()} 
                            className={`relative border-r dark:border-gray-700 transition-colors ${dragOverDay === day.toDateString() ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnter={() => setDragOverDay(day.toDateString())}
                            onDragLeave={() => setDragOverDay(null)}
                            onDrop={(e) => onDropHandler(e, day)}
                        >
                            {timeSlots.map(time => <div key={time} className="h-16 border-b dark:border-gray-700"></div>)}
                            {state.bookings.filter(b => new Date(b.start).toDateString() === day.toDateString()).map(b => (
                                <div 
                                    key={b.id} 
                                    draggable 
                                    onDragStart={(e) => handleDragStart(e, b.id)}
                                    style={getEventStyle(new Date(b.start), new Date(b.end))} 
                                    onClick={() => openModalForEdit(b)} 
                                    className={`absolute w-full px-1 cursor-grab transition-opacity ${draggedBookingId === b.id ? 'opacity-30' : ''}`}
                                >
                                    <div className={`p-1 rounded text-white text-xs overflow-hidden h-full bg-blue-600`}>
                                        <p className="font-bold">{customers.find(c => c.id === b.customerId)?.name}</p>
                                        <p>{new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                            {state.blockedPeriods.filter(bp => new Date(bp.start).toDateString() === day.toDateString()).map(bp => (
                                 <div key={bp.id} style={getEventStyle(new Date(bp.start), new Date(bp.end))} className="absolute w-full px-1">
                                     <div className="p-1 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs overflow-hidden h-full">
                                         <p className="font-bold">Blocked</p>
                                         <p>{bp.reason}</p>
                                     </div>
                                 </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};


export const CalendarView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);

    const checkConflict = (checkBooking: Partial<Booking>): boolean => {
         const conflict = state.bookings.find(b => {
            if (b.id === checkBooking.id) return false;
            // A conflict occurs if the same staff OR same resource is booked
            if (b.staffId !== checkBooking.staffId && b.resourceId !== checkBooking.resourceId) return false;
            if (checkBooking.staffId && b.staffId !== checkBooking.staffId) return false;
            if (checkBooking.resourceId && b.resourceId !== checkBooking.resourceId) return false;
            
            const newStart = new Date(checkBooking.start!).getTime();
            const newEnd = new Date(checkBooking.end!).getTime();
            const existingStart = new Date(b.start).getTime();
            const existingEnd = new Date(b.end).getTime();

            return newStart < existingEnd && newEnd > existingStart;
        });

        const blocked = state.blockedPeriods.find(bp => {
            if (bp.staffId !== checkBooking.staffId) return false;
            const newStart = new Date(checkBooking.start!).getTime();
            const newEnd = new Date(checkBooking.end!).getTime();
            const blockedStart = new Date(bp.start).getTime();
            const blockedEnd = new Date(bp.end).getTime();
            return newStart < blockedEnd && newEnd > blockedStart;
        });

        return !!conflict || !!blocked;
    }

    const handleDragStart = (e: React.DragEvent, bookingId: string) => {
        e.dataTransfer.setData('bookingId', bookingId);
        setDraggedBookingId(bookingId);
    };

    const handleDrop = (e: React.DragEvent, newDate: Date, timeInMinutes?: number) => {
        e.preventDefault();
        const bookingId = e.dataTransfer.getData('bookingId');
        const originalBooking = state.bookings.find(b => b.id === bookingId);
        if (!originalBooking) return;

        const originalStartDate = new Date(originalBooking.start);
        const duration = new Date(originalBooking.end).getTime() - originalStartDate.getTime();
        
        const newStartDate = new Date(newDate);
        if(timeInMinutes !== undefined) {
             newStartDate.setHours(Math.floor(timeInMinutes / 60), timeInMinutes % 60, 0, 0);
        } else {
            // Preserve original time if only date is changed (Month View)
            newStartDate.setHours(originalStartDate.getHours(), originalStartDate.getMinutes(), 0, 0);
        }
        const newEndDate = new Date(newStartDate.getTime() + duration);
        
        const isCopy = e.altKey;
        const tempBooking = {
            ...originalBooking,
            id: isCopy ? generateId() : originalBooking.id,
            start: newStartDate.toISOString(),
            end: newEndDate.toISOString()
        };

        if(checkConflict(tempBooking)) {
            alert('This booking conflicts with an existing event or blocked period.');
        } else {
            if(isCopy) {
                const { id, ...newBookingData } = tempBooking;
                dispatch({ type: 'ADD_ITEM', payload: { entity: 'bookings', data: newBookingData as Omit<Booking, 'id'> }});
            } else {
                dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'bookings', data: tempBooking }});
            }
        }
        setDraggedBookingId(null);
    };
    
    const openModalForNew = (date: Date) => {
        setSelectedDate(date);
        setSelectedBooking(null);
        setIsBookingModalOpen(true);
    };

    const openModalForEdit = (booking: Booking) => {
        setSelectedDate(new Date(booking.start));
        setSelectedBooking(booking);
        setIsBookingModalOpen(true);
    }
    
    const handleNav = (direction: 'prev' | 'next' | 'today') => {
        if(direction === 'today') {
            setCurrentDate(new Date());
            return;
        }
        const newDate = new Date(currentDate);
        const increment = direction === 'next' ? 1 : -1;
        if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + increment);
        if (viewMode === 'week') newDate.setDate(currentDate.getDate() + 7 * increment);
        if (viewMode === 'day') newDate.setDate(currentDate.getDate() + increment);
        setCurrentDate(newDate);
    }
    
    const title = useMemo(() => {
        if (viewMode === 'month') return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (viewMode === 'day') return currentDate.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' });
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - currentDate.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
    }, [currentDate, viewMode]);

    return (
        <div className="space-y-4" onDragEnd={() => setDraggedBookingId(null)}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                     <Button onClick={() => handleNav('prev')}>&larr;</Button>
                     <Button onClick={() => handleNav('today')}>Today</Button>
                     <Button onClick={() => handleNav('next')}>&rarr;</Button>
                    <h2 className="text-xl font-semibold w-60 text-center">{title}</h2>
                </div>
                 <Tabs
                    tabs={[{id: 'month', label: 'Month'}, {id: 'week', label: 'Week'}, {id: 'day', label: 'Day'}]}
                    activeTab={viewMode}
                    onTabClick={(tabId) => setViewMode(tabId)}
                />
                <div className="flex space-x-2">
                    <Button variant="secondary" onClick={() => setIsBlockModalOpen(true)}>Block Time</Button>
                    <Button onClick={() => openModalForNew(new Date())}>Add Booking</Button>
                </div>
            </div>
            
            {viewMode === 'month' && <MonthView currentDate={currentDate} draggedBookingId={draggedBookingId} openModalForNew={openModalForNew} openModalForEdit={openModalForEdit} handleDragStart={handleDragStart} handleDrop={handleDrop} />}
            {(viewMode === 'week' || viewMode === 'day') && <TimelineView currentDate={currentDate} viewMode={viewMode} draggedBookingId={draggedBookingId} openModalForNew={openModalForNew} openModalForEdit={openModalForEdit} handleDragStart={handleDragStart} handleDrop={handleDrop} />}

            <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} bookingDate={selectedDate} existingBooking={selectedBooking} checkConflict={checkConflict} />
            <BlockPeriodModal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} />
        </div>
    );
};