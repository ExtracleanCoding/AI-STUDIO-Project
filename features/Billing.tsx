
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Button, Card, CardContent, CardHeader, CardTitle, Modal, Input, Label, Select, Badge } from '../components/ui';
import type { Expense, Booking, Transaction } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

const ExpenseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    expenseToEdit?: Expense | null;
}> = ({ isOpen, onClose, expenseToEdit }) => {
    const { dispatch } = useAppContext();
    const [expense, setExpense] = useState<Partial<Expense>>({});

    useEffect(() => {
        if (expenseToEdit) {
            setExpense(expenseToEdit);
        } else {
            setExpense({ date: new Date().toISOString().split('T')[0], category: EXPENSE_CATEGORIES[0] });
        }
    }, [expenseToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setExpense(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).type === 'number' ? parseFloat(value) : value }));
    }

    const handleSubmit = () => {
        if (!expense.description || !expense.amount || !expense.category) {
            alert('Description, Amount, and Category are required.');
            return;
        }

        if (expense.id) {
            dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'expenses', data: expense as Expense } });
        } else {
            dispatch({ type: 'ADD_ITEM', payload: { entity: 'expenses', data: expense as Omit<Expense, 'id'> } });
        }
        onClose();
    };
    
    const footer = (
        <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Expense</Button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={expense.id ? "Edit Expense" : "Log Expense"} footer={footer}>
            <div className="space-y-4">
                <div><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" value={expense.date?.split('T')[0] || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="description">Description</Label><Input id="description" name="description" value={expense.description || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="amount">Amount ($)</Label><Input id="amount" name="amount" type="number" value={expense.amount || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="category">Category</Label><Select id="category" name="category" value={expense.category} onChange={handleChange}>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</Select></div>
            </div>
        </Modal>
    );
};


export const BillingView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [activeTab, setActiveTab] = useState<'payments' | 'expenses' | 'transactions'>('payments');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

    const outstandingBookings = state.bookings.filter(b => b.paymentStatus === 'Unpaid');
    const getEntityName = (id: string, type: 'customer' | 'service') => state[type === 'customer' ? 'customers' : 'services'].find(e => e.id === id)?.name || 'Unknown';

    const handleAddExpense = () => {
        setExpenseToEdit(null);
        setIsExpenseModalOpen(true);
    };
    const handleEditExpense = (expense: Expense) => {
        setExpenseToEdit(expense);
        setIsExpenseModalOpen(true);
    };
    const handleDeleteExpense = (id: string) => {
        if(window.confirm('Are you sure you want to delete this expense?')) {
            dispatch({type: 'DELETE_ITEM', payload: { entity: 'expenses', id }});
        }
    }

    const handleRecordPayment = (booking: Booking) => {
        // In a real app, you might have a modal to select payment method
        const method: Transaction['method'] = 'Card'; 
        dispatch({type: 'RECORD_PAYMENT', payload: { booking, method }});
    }

    const TabButton: React.FC<{tab: typeof activeTab, label: string}> = ({tab, label}) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${activeTab === tab ? 'border-brand-start text-brand-start' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
            {label}
        </button>
    )

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Billing & Finances</h1>
            
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton tab="payments" label="Outstanding Payments" />
                    <TabButton tab="expenses" label="Expenses" />
                    <TabButton tab="transactions" label="Transaction Log" />
                </nav>
            </div>

            {activeTab === 'payments' && (
                <Card>
                    <CardHeader><CardTitle>Outstanding Payments ({outstandingBookings.length})</CardTitle></CardHeader>
                    <CardContent>
                        <TableWrapper>
                           <thead className="bg-gray-50 dark:bg-gray-700"><tr><Th>Customer</Th><Th>Service</Th><Th>Date</Th><Th>Amount</Th><Th_Sr>Actions</Th_Sr></tr></thead>
                           <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {outstandingBookings.map(booking => {
                                    const service = state.services.find(s => s.id === booking.serviceId);
                                    return (
                                        <tr key={booking.id}>
                                            <Td>{getEntityName(booking.customerId, 'customer')}</Td>
                                            <Td>{getEntityName(booking.serviceId, 'service')}</Td>
                                            <Td>{new Date(booking.start).toLocaleDateString()}</Td>
                                            <Td>${service?.price.toFixed(2) || 'N/A'}</Td>
                                            <Td className="text-right"><Button variant="secondary" onClick={() => handleRecordPayment(booking)}>Record Payment</Button></Td>
                                        </tr>
                                    )
                                })}
                           </tbody>
                        </TableWrapper>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'expenses' && (
                 <Card>
                    <CardHeader><div className="flex justify-between items-center"><CardTitle>Expenses</CardTitle><Button onClick={handleAddExpense}>Log Expense</Button></div></CardHeader>
                    <CardContent>
                       <TableWrapper>
                           <thead className="bg-gray-50 dark:bg-gray-700"><tr><Th>Date</Th><Th>Description</Th><Th>Category</Th><Th>Amount</Th><Th_Sr>Actions</Th_Sr></tr></thead>
                           <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {state.expenses.map(expense => (
                                    <tr key={expense.id}>
                                        <Td>{new Date(expense.date).toLocaleDateString()}</Td><Td>{expense.description}</Td><Td><Badge>{expense.category}</Badge></Td><Td>${expense.amount.toFixed(2)}</Td>
                                        <Td className="text-right space-x-2"><Button variant="ghost" onClick={() => handleEditExpense(expense)}>Edit</Button><Button variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => handleDeleteExpense(expense.id)}>Delete</Button></Td>
                                    </tr>
                                ))}
                           </tbody>
                       </TableWrapper>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'transactions' && (
                 <Card>
                    <CardHeader><CardTitle>Transaction Log</CardTitle></CardHeader>
                    <CardContent>
                       <TableWrapper>
                           <thead className="bg-gray-50 dark:bg-gray-700"><tr><Th>Date</Th><Th>Customer</Th><Th>Amount</Th><Th>Method</Th></tr></thead>
                           <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {state.transactions.map(t => (
                                    <tr key={t.id}><Td>{new Date(t.date).toLocaleDateString()}</Td><Td>{getEntityName(t.customerId, 'customer')}</Td><Td>${t.amount.toFixed(2)}</Td><Td>{t.method}</Td></tr>
                                ))}
                           </tbody>
                       </TableWrapper>
                    </CardContent>
                </Card>
            )}
            <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} expenseToEdit={expenseToEdit} />
        </div>
    );
};

// Helper components for tables
const TableWrapper: React.FC<{children: React.ReactNode}> = ({children}) => <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">{children}</table></div>
const Th: React.FC<{children: React.ReactNode}> = ({children}) => <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{children}</th>
const Td: React.FC<{children?: React.ReactNode, className?: string}> = ({children, className}) => <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 ${className}`}>{children}</td>
const Th_Sr: React.FC<{children: React.ReactNode}> = ({children}) => <th scope="col" className="relative px-6 py-3"><span className="sr-only">{children}</span></th>
