
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Button, Card, CardContent, Modal, Input, Label, Select } from '../components/ui';
import type { Service } from '../types';

const ServiceModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    serviceToEdit?: Service | null;
}> = ({ isOpen, onClose, serviceToEdit }) => {
    const { dispatch } = useAppContext();
    const [service, setService] = useState<Partial<Service>>({});

    useEffect(() => {
        if (serviceToEdit) {
            setService(serviceToEdit);
        } else {
            setService({ type: 'Driving Lesson', pricingModel: 'Fixed' });
        }
    }, [serviceToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setService(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    }

    const handleSubmit = () => {
        if (!service.name || !service.type || !service.duration) {
            alert('Name, Type, and Duration are required.');
            return;
        }

        if (service.id) {
            dispatch({ type: 'UPDATE_ITEM', payload: { entity: 'services', data: service as Service } });
        } else {
            dispatch({ type: 'ADD_ITEM', payload: { entity: 'services', data: service as Omit<Service, 'id'> } });
        }
        onClose();
    };

    const footer = (
        <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Service</Button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={service.id ? "Edit Service" : "Add Service"} footer={footer}>
            <div className="space-y-4">
                <div><Label htmlFor="name">Service Name</Label><Input id="name" name="name" value={service.name || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="type">Type</Label><Select id="type" name="type" value={service.type} onChange={handleChange}>{['Driving Lesson', 'Tour'].map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
                <div><Label htmlFor="duration">Duration (minutes)</Label><Input id="duration" name="duration" type="number" value={service.duration || ''} onChange={handleChange} /></div>
                <div><Label htmlFor="pricingModel">Pricing Model</Label><Select id="pricingModel" name="pricingModel" value={service.pricingModel} onChange={handleChange}>{['Fixed', 'Tiered'].map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
                {service.pricingModel === 'Fixed' && (
                    <div><Label htmlFor="price">Price ($)</Label><Input id="price" name="price" type="number" value={service.price || ''} onChange={handleChange} /></div>
                )}
                {/* Tiered pricing UI could be added here for full functionality */}
            </div>
        </Modal>
    );
};

export const ServicesView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

    const getPriceString = (service: typeof state.services[0]) => {
        if (service.pricingModel === 'Fixed') {
            return `$${service.price.toFixed(2)}`;
        }
        if (service.tieredPrice) {
            return `From $${Math.min(...service.tieredPrice.map(p => p.price)).toFixed(2)}`;
        }
        return 'N/A';
    }

    const handleAdd = () => {
        setServiceToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (service: Service) => {
        setServiceToEdit(service);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            dispatch({ type: 'DELETE_ITEM', payload: { entity: 'services', id } });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Services</h1>
                <Button onClick={handleAdd}>Add Service</Button>
            </div>
             <Card>
                <CardContent>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {state.services.map(service => (
                                    <tr key={service.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{service.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{service.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{service.duration} min</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getPriceString(service)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Button variant="ghost" onClick={() => handleEdit(service)}>Edit</Button>
                                            <Button variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => handleDelete(service.id)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <ServiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} serviceToEdit={serviceToEdit} />
        </div>
    );
};
