
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import type { Booking } from '../types';

const KPICard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <Card>
        <CardContent className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            </div>
        </CardContent>
    </Card>
);

export const DashboardView: React.FC = () => {
    const { state } = useAppContext();
    
    const upcomingBookings = state.bookings
        .filter(b => new Date(b.start) > new Date())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 5);
        
    const totalRevenue = state.transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalHours = state.bookings
        .filter(b => b.status === 'Completed')
        .reduce((sum, b) => sum + (new Date(b.end).getTime() - new Date(b.start).getTime()) / (1000 * 60 * 60), 0);
    const incomePerHour = totalHours > 0 ? (totalRevenue / totalHours).toFixed(2) : '0.00';
    // NOTE: A real utilization rate would be (booked hours / available hours).
    // This is a simplified placeholder as we don't track available hours.
    const utilizationRate = totalHours > 0 ? '75%' : '0%';

    const getEntityName = (id: string, type: 'customer' | 'staff' | 'service') => {
        const key = type === 'customer' ? 'customers' : type === 'staff' ? 'staff' : 'services';
        const entity = state[key].find(e => e.id === id);
        return entity ? entity.name : 'Unknown';
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} color="bg-green-100 dark:bg-green-900" icon={<span className="text-green-600 dark:text-green-400 text-xl font-bold">$</span>} />
                <KPICard title="Income Per Hour" value={`$${incomePerHour}`} color="bg-blue-100 dark:bg-blue-900" icon={<span className="text-blue-600 dark:text-blue-400 text-xl">⚡️</span>} />
                <KPICard title="Utilization" value={utilizationRate} color="bg-yellow-100 dark:bg-yellow-900" icon={<span className="text-yellow-600 dark:text-yellow-400 text-xl">📊</span>} />
                <KPICard title="Total Customers" value={state.customers.length.toString()} color="bg-purple-100 dark:bg-purple-900" icon={<span className="text-purple-600 dark:text-purple-400 text-xl">👥</span>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingBookings.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {upcomingBookings.map(booking => (
                                    <li key={booking.id} className="py-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{getEntityName(booking.serviceId, 'service')}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{getEntityName(booking.customerId, 'customer')} with {getEntityName(booking.staffId, 'staff')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{new Date(booking.start).toLocaleDateString()}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(booking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">No upcoming bookings.</p>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>System Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ul className="space-y-2">
                        {state.resources.filter(r => r.type === 'Vehicle').map(r => {
                             const isMotDueSoon = r.motDueDate && new Date(r.motDueDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                             if (isMotDueSoon) {
                                 return <li key={r.id} className="text-sm text-yellow-700 dark:text-yellow-300">⚠️ {r.name}: MOT due on {new Date(r.motDueDate!).toLocaleDateString()}</li>
                             }
                             return null;
                        })}
                       </ul>
                       <p className="text-gray-500 dark:text-gray-400 mt-2">No other notifications.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
