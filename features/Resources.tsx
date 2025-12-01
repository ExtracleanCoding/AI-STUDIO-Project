
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Button, Card, CardContent, Modal, Input, Label, Select } from '../components/ui';
import type { Resource } from '../types';

const ResourceModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    resourceToEdit?: Resource | null;
}> = ({ isOpen, onClose, resourceToEdit }) => {
    const { dispatch } = useAppContext();
    const [resource, setResource] = useState<Partial<Resource>>({});

    useEffect(() => {
        if (resourceToEdit) {
            setResource(resourceToEdit);
        } else {
            setResource({ type: 'Vehicle' });
        }
    }, [resourceToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setResource(prev => ({ ...prev, [name]: value }));
    }

    const handleSubmit = () => {
        if (!resource.name || !resource.type) {
            alert('Name and Type are required.');
            return;
        }

        if (resource.id) {
            dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'resources', data: resource as Resource } });
        } else {
            dispatch({ type: 'ADD_ITEM', payload: { entity: 'resources', data: resource as Omit<Resource, 'id'> } });
        }
        onClose();
    };

    const footer = (
        <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Resource</Button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={resource.id ? "Edit Resource" : "Add Resource"} footer={footer}>
            <div className="space-y-4">
                <div><Label htmlFor="name">Resource Name</Label><Input id="name" name="name" value={resource.name || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="type">Type</Label><Select id="type" name="type" value={resource.type} onChange={handleChange}>{['Vehicle', 'Room', 'Equipment'].map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
                {resource.type === 'Vehicle' && (
                    <>
                        <div><Label htmlFor="motDueDate">MOT Due Date</Label><Input id="motDueDate" name="motDueDate" type="date" value={resource.motDueDate || ''} onChange={handleChange} /></div>
                        <div><Label htmlFor="taxDueDate">Tax Due Date</Label><Input id="taxDueDate" name="taxDueDate" type="date" value={resource.taxDueDate || ''} onChange={handleChange} /></div>
                        <div><Label htmlFor="serviceDueDate">Service Due Date</Label><Input id="serviceDueDate" name="serviceDueDate" type="date" value={resource.serviceDueDate || ''} onChange={handleChange} /></div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export const ResourcesView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);

    const handleAdd = () => {
        setResourceToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (resource: Resource) => {
        setResourceToEdit(resource);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this resource?')) {
            dispatch({ type: 'DELETE_ITEM', payload: { entity: 'resources', id } });
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Resources</h1>
                <Button onClick={handleAdd}>Add Resource</Button>
            </div>
             <Card>
                <CardContent>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Dates</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {state.resources.map(resource => (
                                    <tr key={resource.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{resource.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{resource.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {resource.type === 'Vehicle' && `MOT: ${resource.motDueDate || 'N/A'}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                             <Button variant="ghost" onClick={() => handleEdit(resource)}>Edit</Button>
                                             <Button variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => handleDelete(resource.id)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <ResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} resourceToEdit={resourceToEdit} />
        </div>
    );
};
