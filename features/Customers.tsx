
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { generateProgressSummary, generateNextSkillsToFocusOn, createCustomerFeedback } from '../services/geminiService';
import { DRIVING_SKILL_CATEGORIES, ALL_DRIVING_SKILLS, SKILL_STATUS } from '../constants';
import { Button, Card, CardContent, CardHeader, CardTitle, Modal, Input, Label, Textarea } from '../components/ui';
import type { Customer, ProgressNote } from '../types';
import { generateId } from '../utils';

// --- ICONS ---
const CheckCircleIcon = ({ className = '' }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const InProgressIcon = ({ className = '' }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const NotStartedIcon = ({ className = '' }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
const RocketIcon = () => <span className="text-4xl">🚀</span>;

// --- CUSTOM HOOK for PROGRESS CALCULATION ---
const useCustomerProgress = (progressNotes: ProgressNote[]) => {
    return useMemo(() => {
        const latestSkillRatings: Record<string, number> = {};
        progressNotes.forEach(note => {
            Object.entries(note.skills).forEach(([skill, rating]) => {
                if (!latestSkillRatings[skill] || rating > latestSkillRatings[skill]) {
                    latestSkillRatings[skill] = rating;
                }
            });
        });

        let mastered = 0;
        let inProgress = 0;

        ALL_DRIVING_SKILLS.forEach(skill => {
            const rating = latestSkillRatings[skill] || 0;
            if (rating >= SKILL_STATUS.MASTERED) mastered++;
            else if (rating >= SKILL_STATUS.IN_PROGRESS_MIN) inProgress++;
        });

        const total = ALL_DRIVING_SKILLS.length;
        const notStarted = total - mastered - inProgress;
        const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
        
        const categoryStats = Object.fromEntries(
            Object.entries(DRIVING_SKILL_CATEGORIES).map(([category, skills]) => {
                let catMastered = 0;
                skills.forEach(skill => {
                    if ((latestSkillRatings[skill] || 0) >= SKILL_STATUS.MASTERED) {
                        catMastered++;
                    }
                });
                const catTotal = skills.length;
                const catPercentage = catTotal > 0 ? Math.round((catMastered / catTotal) * 100) : 0;
                return [category, { mastered: catMastered, total: catTotal, percentage: catPercentage }];
            })
        );
        
        return {
            latestSkillRatings,
            stats: { mastered, inProgress, notStarted, total, percentage },
            categoryStats,
        };
    }, [progressNotes]);
};


// --- MODALS ---
const CustomerModal: React.FC<{ isOpen: boolean; onClose: () => void; customerToEdit?: Customer | null; }> = ({ isOpen, onClose, customerToEdit }) => {
    const { dispatch } = useAppContext();
    const [customer, setCustomer] = useState<Partial<Customer>>({});

    useEffect(() => {
        setCustomer(customerToEdit || { credits: 0, progressNotes: [] });
    }, [customerToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setCustomer(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    }

    const handleSubmit = () => {
        if (!customer.name || !customer.email) return alert('Name and Email are required.');
        if(customer.id) dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'customers', data: customer as Customer } });
        else dispatch({ type: 'ADD_ITEM', payload: { entity: 'customers', data: customer as Omit<Customer, 'id'> } });
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={customer.id ? "Edit Customer" : "Add Customer"} footer={<div className="flex justify-end space-x-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit}>Save Customer</Button></div>}>
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

const ProgressModal: React.FC<{ isOpen: boolean, onClose: () => void, customer: Customer, noteToEdit?: ProgressNote | null; }> = ({ isOpen, onClose, customer, noteToEdit }) => {
    const { dispatch } = useAppContext();
    const [notes, setNotes] = useState('');
    const [skills, setSkills] = useState<Record<string, number>>({});

    useEffect(() => {
        setNotes(noteToEdit?.notes || '');
        setSkills(noteToEdit?.skills || {});
    }, [noteToEdit, isOpen]);

    const handleSave = () => {
        const updatedNotes = noteToEdit
            ? customer.progressNotes.map(n => n.id === noteToEdit.id ? { ...n, notes, skills } : n)
            : [...customer.progressNotes, { id: generateId(), bookingId: 'manual', date: new Date().toISOString(), notes, skills }];
        dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'customers', data: { ...customer, progressNotes: updatedNotes } }});
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" title={noteToEdit ? `Edit Progress Note` : `Log Progress for ${customer.name}`}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div><Label htmlFor="notes">Lesson Notes</Label><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} /></div>
                <div className="space-y-3">
                    {Object.entries(DRIVING_SKILL_CATEGORIES).map(([category, skillList]) => (
                        <div key={category}>
                            <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">{category}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                {skillList.map(skill => (
                                    <div key={skill} className="flex items-center justify-between">
                                        <Label htmlFor={`skill-${skill}`} className="mb-0 font-normal">{skill}</Label>
                                        <Input type="number" id={`skill-${skill}`} min="0" max="5" value={skills[skill] || ''} onChange={e => setSkills(s => ({...s, [skill]: parseInt(e.target.value) || 0 }))} className="w-20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700 mt-4"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSave}>Save Progress</Button></div>
        </Modal>
    );
};

const EmailPreviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    customerEmail: string;
    initialSubject: string;
    initialBody: string;
}> = ({ isOpen, onClose, customerEmail, initialSubject, initialBody }) => {
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);

    useEffect(() => {
        if(isOpen) {
            setSubject(initialSubject);
            setBody(initialBody);
        }
    }, [isOpen, initialSubject, initialBody]);

    const handleSend = () => {
        const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        onClose();
    };

    const footer = (
        <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend}>📧 Send via Gmail</Button>
        </div>
    );
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Preview Progress Email" size="lg" footer={footer}>
            <div className="space-y-4">
                <div><Label htmlFor="email-to">To</Label><Input id="email-to" value={customerEmail} disabled /></div>
                <div><Label htmlFor="email-subject">Subject</Label><Input id="email-subject" value={subject} onChange={e => setSubject(e.target.value)} /></div>
                <div><Label htmlFor="email-body">Body</Label><Textarea id="email-body" value={body} onChange={e => setBody(e.target.value)} rows={10} /></div>
            </div>
        </Modal>
    );
};


// --- SUB-COMPONENTS for PROGRESS LOG ---
const SkillStatusIcon: React.FC<{ rating: number }> = ({ rating }) => {
    if (rating >= SKILL_STATUS.MASTERED) return <CheckCircleIcon className="text-green-500" />;
    if (rating >= SKILL_STATUS.IN_PROGRESS_MIN) return <InProgressIcon className="text-yellow-500" />;
    return <NotStartedIcon className="text-red-500" />;
};

const SkillCategoryCard: React.FC<{ category: string, skills: string[], ratings: Record<string, number>, stats: { mastered: number, total: number, percentage: number } }> = ({ category, skills, ratings, stats }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const displayedSkills = isExpanded ? skills : skills.slice(0, 5);

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-base">{category}</CardTitle>
                <p className="text-xs text-gray-500">{stats.mastered} / {stats.total} skills mastered</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-2"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${stats.percentage}%` }}></div></div>
            </CardHeader>
            <CardContent className="flex-grow">
                <ul className="space-y-1">
                    {displayedSkills.map(skill => (
                        <li key={skill} className="flex items-center text-sm">
                            <SkillStatusIcon rating={ratings[skill] || 0} />
                            <span className="ml-2">{skill}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            {skills.length > 5 && (
                <div className="p-2 text-center border-t dark:border-gray-700">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        {isExpanded ? 'Show Less' : `+${skills.length - 5} more...`}
                    </button>
                </div>
            )}
        </Card>
    );
};

// --- MAIN DETAIL VIEW ---
const CustomerDetail: React.FC<{ customer: Customer, onBack: () => void, onEdit: (customer: Customer) => void }> = ({ customer, onBack, onEdit }) => {
    const { dispatch } = useAppContext();
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [noteToEdit, setNoteToEdit] = useState<ProgressNote | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summary, setSummary] = useState('');
    const [nextSkills, setNextSkills] = useState('');
    const [isNextSkillsLoading, setIsNextSkillsLoading] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailContent, setEmailContent] = useState({ subject: '', body: '' });
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    
    const { latestSkillRatings, stats, categoryStats } = useCustomerProgress(customer.progressNotes);

    useEffect(() => {
        handleGenerateNextSkills();
    }, [customer.progressNotes]);

    const handleLogProgress = () => { setNoteToEdit(null); setIsProgressModalOpen(true); };
    const handleEditProgress = (note: ProgressNote) => { setNoteToEdit(note); setIsProgressModalOpen(true); };
    const handleDeleteProgress = (noteId: string) => {
        if(window.confirm("Are you sure you want to delete this progress note?")) {
            const updatedNotes = customer.progressNotes.filter(n => n.id !== noteId);
            dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'customers', data: {...customer, progressNotes: updatedNotes} } });
        }
    }

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        const result = await generateProgressSummary(customer.progressNotes);
        setSummary(result);
        setIsSummaryLoading(false);
    }
    
    const handleGenerateNextSkills = async () => {
        if(customer.progressNotes.length === 0) {
            setNextSkills("Log a lesson to get AI-powered recommendations on what to focus on next!");
            return;
        };
        setIsNextSkillsLoading(true);
        const result = await generateNextSkillsToFocusOn(latestSkillRatings);
        setNextSkills(result);
        setIsNextSkillsLoading(false);
    }

    const handleEmailProgress = async () => {
        setIsEmailLoading(true);
        const body = await createCustomerFeedback(customer.name, customer.progressNotes);
        setEmailContent({
            subject: `Your Driving Progress Report from Ray Ryan`,
            body: `Hi ${customer.name},\n\nHere is a summary of your recent driving progress:\n\n${body}\n\nKeep up the great work!\n\nBest,\nThe Ray Ryan Team`
        });
        setIsEmailModalOpen(true);
        setIsEmailLoading(false);
    }

    return (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Button onClick={onBack} variant="ghost" className="mb-2 pl-0">&larr; Back to Customers</Button>
                    <h1 className="text-3xl font-bold">Progress Log for {customer.name}</h1>
                </div>
                <div className="flex flex-wrap space-x-2">
                    <Button variant="secondary" onClick={() => onEdit(customer)}>Edit Details</Button>
                    <Button onClick={handleLogProgress}>+ Log Lesson</Button>
                    <Button onClick={handleEmailProgress} disabled={isEmailLoading || customer.progressNotes.length === 0}>
                        {isEmailLoading ? 'Generating...' : 'Email Progress'}
                    </Button>
                    <Button onClick={handleGenerateSummary} disabled={isSummaryLoading}>
                        {isSummaryLoading ? 'Summarizing...' : '✨ Summarize Progress'}
                    </Button>
                </div>
            </div>
            
            {/* Overall Progress */}
            <Card>
                <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6">
                    <div className="flex-grow w-full sm:w-auto">
                        <p className="text-2xl font-bold text-brand-start">{stats.percentage}% Complete</p>
                        <p className="text-sm text-gray-500">{stats.mastered} of {stats.total} skills mastered</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2"><div className="bg-brand-start h-2.5 rounded-full" style={{ width: `${stats.percentage}%` }}></div></div>
                    </div>
                    <div className="flex justify-around w-full sm:w-auto mt-4 sm:mt-0 sm:ml-8 text-center">
                        <div className="px-4"><p className="text-2xl font-bold text-green-500">{stats.mastered}</p><p className="text-xs text-gray-500">Mastered ✅</p></div>
                        <div className="px-4"><p className="text-2xl font-bold text-yellow-500">{stats.inProgress}</p><p className="text-xs text-gray-500">In Progress 🟡</p></div>
                        <div className="px-4"><p className="text-2xl font-bold text-red-500">{stats.notStarted}</p><p className="text-xs text-gray-500">Not Started ⛔</p></div>
                    </div>
                    <div className="hidden lg:flex flex-col items-center ml-8">
                        <RocketIcon />
                        <p className="text-xs text-gray-500 mt-1">Estimated test-ready: {Math.max(0, (stats.total - stats.mastered))} lessons</p>
                    </div>
                </CardContent>
            </Card>

            {/* AI Summary (if generated) */}
            {summary && (
                <Card>
                    <CardHeader><CardTitle>AI Progress Summary</CardTitle></CardHeader>
                    <CardContent className="whitespace-pre-wrap font-sans text-sm">{summary}</CardContent>
                </Card>
            )}

            {/* Skill Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(DRIVING_SKILL_CATEGORIES).map(([category, skills]) => (
                    <SkillCategoryCard key={category} category={category} skills={skills} ratings={latestSkillRatings} stats={categoryStats[category]}/>
                ))}
            </div>

            {/* Next Skills & Lesson History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Next Skills to Focus On</CardTitle></CardHeader>
                    <CardContent className="text-sm">
                        {isNextSkillsLoading ? "Analyzing..." : nextSkills.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Lesson History</CardTitle></CardHeader>
                    <CardContent className="max-h-[300px] overflow-y-auto space-y-4">
                        {[...customer.progressNotes].reverse().map(note => (
                            <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-semibold">{new Date(note.date).toLocaleDateString()}</p>
                                    <div className="space-x-2">
                                        {/* FIX: Removed invalid 'size' prop and used className for styling to create a smaller button. */}
                                        <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => handleEditProgress(note)}>Edit</Button>
                                        {/* FIX: Removed invalid 'size' prop and used className for styling to create a smaller button. */}
                                        <Button variant="ghost" className="text-red-500 text-xs px-2 py-1" onClick={() => handleDeleteProgress(note.id)}>Delete</Button>
                                    </div>
                                </div>
                                <p className="text-sm mb-2">{note.notes}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">Skills covered: </span>
                                    {Object.keys(note.skills).filter(s => note.skills[s] > 0).join(', ') || 'None'}
                                </p>
                            </div>
                        ))}
                        {customer.progressNotes.length === 0 && <p className="text-sm text-gray-500">No lessons logged yet.</p>}
                    </CardContent>
                </Card>
            </div>
            
            <ProgressModal isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} customer={customer} noteToEdit={noteToEdit} />
            <EmailPreviewModal 
                isOpen={isEmailModalOpen} 
                onClose={() => setIsEmailModalOpen(false)}
                customerEmail={customer.email}
                initialSubject={emailContent.subject}
                initialBody={emailContent.body}
            />
        </div>
    )
}

export const CustomersView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    const handleAdd = () => { setCustomerToEdit(null); setIsModalOpen(true); }
    const handleEdit = (customer: Customer) => { setCustomerToEdit(customer); setIsModalOpen(true); }
    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            dispatch({ type: 'DELETE_ITEM', payload: { entity: 'customers', id } });
        }
    }

    if (selectedCustomer) {
        // Find the latest version of the customer from state in case it was updated
        const currentCustomer = state.customers.find(c => c.id === selectedCustomer.id) || selectedCustomer;
        return <CustomerDetail customer={currentCustomer} onBack={() => setSelectedCustomer(null)} onEdit={handleEdit} />
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h1 className="text-3xl font-bold">Customers</h1><Button onClick={handleAdd}>Add Customer</Button></div>
            <Card><CardContent><div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700"><tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Credits (hrs)</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr></thead>
                     <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {state.customers.map(customer => (
                            <tr key={customer.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{customer.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{customer.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{customer.credits}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <Button variant="ghost" onClick={() => setSelectedCustomer(customer)}>View Progress</Button>
                                    <Button variant="ghost" onClick={() => handleEdit(customer)}>Edit</Button>
                                    <Button variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => handleDelete(customer.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div></CardContent></Card>
            <CustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} customerToEdit={customerToEdit} />
        </div>
    );
};
