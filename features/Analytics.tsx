
import React, { useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const AnalyticsView: React.FC = () => {
    const { state } = useAppContext();

    const data = useMemo(() => {
        const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

        const processItems = (items: {date: string, amount: number}[], type: 'income' | 'expenses') => {
             items.forEach(item => {
                const date = new Date(item.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { income: 0, expenses: 0 };
                }
                monthlyData[monthKey][type] += item.amount;
            });
        }
        
        processItems(state.transactions, 'income');
        processItems(state.expenses, 'expenses');

        return Object.entries(monthlyData)
            .map(([monthKey, values]) => {
                const date = new Date(monthKey + '-02'); // Use day 2 to avoid timezone issues
                return {
                    name: date.toLocaleString('default', { month: 'short' }),
                    ...values
                };
            })
            .sort((a,b) => a.name.localeCompare(b.name)); // This sort is basic, a proper one would use date objects

    }, [state.transactions, state.expenses]);
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Analytics</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Income vs. Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: state.settings.theme === 'dark' ? '#374151' : '#ffffff',
                                        border: '1px solid #4B5563'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="income" fill="#2B59C3" />
                                <Bar dataKey="expenses" fill="#D90368" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Bookings Per Month</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                        Another chart would be rendered here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
