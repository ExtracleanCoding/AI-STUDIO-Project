
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Button, Card, CardContent, Modal, Input, Label, Select } from '../components/ui';
import type { Staff, StaffType } from '../types';

const StaffModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    staffToEdit?: Staff | null;
}> = ({ isOpen, onClose, staffToEdit }) => {
    const { dispatch } = useAppContext();
    const [staff, setStaff] = useState<Partial<Staff>>({});

    useEffect(() => {
        if (staffToEdit) {
            setStaff(staffToEdit);
        } else {
            setStaff({ type: 'Instructor' });
        }
    }, [staffToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setStaff(prev => ({ ...prev, [name]: value }));
    }

    const handleSubmit = () => {
        if (!staff.name || !staff.email || !staff.type) {
            alert('Name, Email, and Type are required.');
            return;
        }

        if (staff.id) {
            dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'staff', data: staff as Staff } });
        } else {
            dispatch({ type: 'ADD_ITEM', payload: { entity: 'staff', data: staff as Omit<Staff, 'id'> } });
        }
        onClose();
    };
    
    const footer = (
        <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Staff Member</Button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={staff.id ? "Edit Staff Member" : "Add Staff Member"} footer={footer}>
            <div className="space-y-4">
                <div><Label htmlFor="name">Full Name</Label><Input id="name" name="name" value={staff.name || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="email">Email Address</Label><Input id="email" name="email" type="email" value={staff.email || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="phone">Phone Number</Label><Input id="phone" name="phone" value={staff.phone || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="type">Type</Label><Select id="type" name="type" value={staff.type} onChange={handleChange}>{['Instructor', 'Tour Guide', 'Admin'].map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
            </div>
        </Modal>
    );
};


export const StaffView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);

    const handleAdd = () => {
        setStaffToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (staff: Staff) => {
        setStaffToEdit(staff);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            dispatch({ type: 'DELETE_ITEM', payload: { entity: 'staff', id } });
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Staff</h1>
                <Button onClick={handleAdd}>Add Staff Member</Button>
            </div>
             <Card>
                <CardContent>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {state.staff.map(staff => (
                                    <tr key={staff.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{staff.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{staff.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{staff.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Button variant="ghost" onClick={() => handleEdit(staff)}>Edit</Button>
                                            <Button variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => handleDelete(staff.id)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <StaffModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} staffToEdit={staffToEdit} />
        </div>
    );
};
