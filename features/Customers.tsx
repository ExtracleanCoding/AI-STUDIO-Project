
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { generateProgressSummary } from '../services/geminiService';
import { DRIVING_SKILLS } from '../constants';
import { Button, Card, CardContent, CardHeader, CardTitle, Modal, Input, Label, Textarea } from '../components/ui';
import type { Customer, ProgressNote } from '../types';
import { generateId } from '../utils';

const CustomerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    customerToEdit?: Customer | null;
}> = ({ isOpen, onClose, customerToEdit }) => {
    const { dispatch } = useAppContext();
    const [customer, setCustomer] = useState<Partial<Customer>>({});

    useEffect(() => {
        if(customerToEdit) {
            setCustomer(customerToEdit);
        } else {
            setCustomer({ credits: 0, progressNotes: [] });
        }
    }, [customerToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setCustomer(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    }

    const handleSubmit = () => {
        if (!customer.name || !customer.email) {
            alert('Name and Email are required.');
            return;
        }

        if(customer.id) {
            dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'customers', data: customer as Customer } });
        } else {
            dispatch({ type: 'ADD_ITEM', payload: { entity: 'customers', data: customer as Omit<Customer, 'id'> } });
        }
        onClose();
    };
    
    const footer = (
        <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Customer</Button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={customer.id ? "Edit Customer" : "Add Customer"} footer={footer}>
            <div className="space-y-4">
                <div><Label htmlFor="name">Full Name</Label><Input id="name" name="name" value={customer.name || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="email">Email Address</Label><Input id="email" name="email" type="email" value={customer.email || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="phone">Phone Number</Label><Input id="phone" name="phone" value={customer.phone || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="address">Address</Label><Input id="address" name="address" value={customer.address || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="licenseNumber">License Number</Label><Input id="licenseNumber" name="licenseNumber" value={customer.licenseNumber || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="credits">Lesson Credits (hours)</Label><Input id="credits" name="credits" type="number" value={customer.credits || 0} onChange={handleChange} /></div>
            </div>
        </Modal>
    );
};


const ProgressModal: React.FC<{ 
    isOpen: boolean, 
    onClose: () => void, 
    customer: Customer,
    noteToEdit?: ProgressNote | null;
}> = ({ isOpen, onClose, customer, noteToEdit }) => {

    const { dispatch } = useAppContext();
    const [notes, setNotes] = useState('');
    const [skills, setSkills] = useState<Record<string, number>>({});

    useEffect(() => {
        if (noteToEdit) {
            setNotes(noteToEdit.notes);
            setSkills(noteToEdit.skills);
        } else {
            setNotes('');
            setSkills({});
        }
    }, [noteToEdit, isOpen]);

    const handleSave = () => {
        let updatedNotes: ProgressNote[];

        if (noteToEdit) {
            // Editing existing note
            const updatedNote = { ...noteToEdit, notes, skills };
            updatedNotes = customer.progressNotes.map(note => note.id === noteToEdit.id ? updatedNote : note);
        } else {
            // Adding new note
            const newNote: ProgressNote = {
                id: generateId(),
                bookingId: 'manual-entry', // A real implementation would pass the relevant booking
                date: new Date().toISOString(),
                notes,
                skills,
            };
            updatedNotes = [...customer.progressNotes, newNote];
        }
        
        const updatedCustomer = { ...customer, progressNotes: updatedNotes };
        dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'customers', data: updatedCustomer }});
        onClose();
    }
    
    const title = noteToEdit ? `Edit Progress for ${new Date(noteToEdit.date).toLocaleDateString()}` : `Log Progress for ${customer.name}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="notes">Lesson Notes</Label>
                    <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <div>
                    <h4 className="font-medium mb-2">Skill Assessment (1-5)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    {DRIVING_SKILLS.map(skill => (
                        <div key={skill} className="flex items-center justify-between">
                            <Label htmlFor={`skill-${skill}`} className="mb-0">{skill}</Label>
                             <Input 
                                type="number" 
                                id={`skill-${skill}`}
                                min="1" max="5" 
                                value={skills[skill] || ''}
                                onChange={e => setSkills(s => ({...s, [skill]: parseInt(e.target.value) || 0 }))} 
                                className="w-20" 
                            />
                        </div>
                    ))}
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Progress</Button>
                </div>
            </div>
        </Modal>
    );
}

const CustomerDetail: React.FC<{ customer: Customer, onBack: () => void, onEdit: (customer: Customer) => void }> = ({ customer, onBack, onEdit }) => {
    const { state } = useAppContext();
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [noteToEdit, setNoteToEdit] = useState<ProgressNote | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summary, setSummary] = useState('');
    
    const handleLogProgress = () => {
        setNoteToEdit(null);
        setIsProgressModalOpen(true);
    };

    const handleEditProgress = (note: ProgressNote) => {
        setNoteToEdit(note);
        setIsProgressModalOpen(true);
    };

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        const result = await generateProgressSummary(customer.progressNotes);
        setSummary(result);
        setIsSummaryLoading(false);
    }

    const handleEmailFeedback = () => {
        const subject = `Driving Progress Summary for ${customer.name}`;
        const body = `Hi ${customer.name.split(' ')[0]},\n\nHere is a summary of your recent driving progress:\n\n${summary}\n\nKeep up the great work!\n\nBest,\n${state.settings.businessName}`;
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customer.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, '_blank');
    }
    
    return (
         <div>
            <Button onClick={onBack} variant="ghost" className="mb-4">&larr; Back to Customers</Button>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{customer.name}</CardTitle>
                        <div className="space-x-2">
                            <Button variant="secondary" onClick={() => onEdit(customer)}>Edit Details</Button>
                            <Button onClick={handleLogProgress}>Log Progress</Button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email} &bull; {customer.phone}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-semibold">Details</h4>
                        <p>Address: {customer.address}</p>
                        <p>Credits: {customer.credits} hours</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">AI Progress Summary</h4>
                            <div className="flex items-center space-x-2">
                                {summary && <Button variant="secondary" onClick={handleEmailFeedback}>Email Feedback</Button>}
                                <Button onClick={handleGenerateSummary} disabled={isSummaryLoading || customer.progressNotes.length === 0}>
                                    {isSummaryLoading ? 'Generating...' : 'Generate Summary'}
                                </Button>
                            </div>
                        </div>
                         <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-md min-h-[100px] whitespace-pre-wrap">
                            {summary || "Click 'Generate Summary' to see an AI-powered progress report."}
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold">Progress History</h4>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 mt-2 max-h-60 overflow-y-auto">
                             {customer.progressNotes.length > 0 ? [...customer.progressNotes].reverse().map(note => (
                                <li key={note.id} className="py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => handleEditProgress(note)}>
                                    <p className="font-medium">{new Date(note.date).toLocaleDateString()}</p>
                                    <p className="text-sm">{note.notes}</p>
                                    <p className="text-xs text-gray-500">{Object.entries(note.skills).map(([s,r]) => `${s}: ${r}/5`).join(', ')}</p>
                                </li>
                            )) : <p className="text-sm text-gray-500">No progress notes logged.</p>}
                        </ul>
                    </div>
                </CardContent>
            </Card>
            <ProgressModal 
                isOpen={isProgressModalOpen} 
                onClose={() => setIsProgressModalOpen(false)} 
                customer={customer}
                noteToEdit={noteToEdit}
            />
        </div>
    )
}

export const CustomersView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    const handleAdd = () => {
        setCustomerToEdit(null);
        setIsModalOpen(true);
    }
    const handleEdit = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsModalOpen(true);
    }
    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            dispatch({ type: 'DELETE_ITEM', payload: { entity: 'customers', id } });
        }
    }

    if (selectedCustomer) {
        return <CustomerDetail customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} onEdit={handleEdit} />
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Customers</h1>
                <Button onClick={handleAdd}>Add Customer</Button>
            </div>
            <Card>
                <CardContent>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Credits (hrs)</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {state.customers.map(customer => (
                                    <tr key={customer.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{customer.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{customer.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{customer.credits}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Button variant="ghost" onClick={() => setSelectedCustomer(customer)}>View</Button>
                                            <Button variant="ghost" onClick={() => handleEdit(customer)}>Edit</Button>
                                            <Button variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => handleDelete(customer.id)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <CustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} customerToEdit={customerToEdit} />
        </div>
    );
};
