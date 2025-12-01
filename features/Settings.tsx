import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from '../components/ui';

export const SettingsView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [settings, setSettings] = useState(state.settings);

    const handleSave = () => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        alert('Settings saved! You may need to reload the page for some changes to take effect.');
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'ray_ryan_backup.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedState = JSON.parse(e.target?.result as string);
                    // Add validation here in a real app
                    dispatch({ type: 'SET_STATE', payload: importedState });
                    alert('Data imported successfully!');
                    window.location.reload();
                } catch (error) {
                    alert('Error importing data. Please check the file format.');
                    console.error("Import error:", error);
                }
            };
            reader.readAsText(file);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setSettings(prev => ({...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input id="businessName" name="businessName" value={settings.businessName} onChange={handleChange} />
                    </div>
                     <div>
                        <Label htmlFor="businessAddress">Business Address</Label>
                        <Input id="businessAddress" name="businessAddress" value={settings.businessAddress} onChange={handleChange} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Communication Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label htmlFor="emailTemplate">Email Template</Label>
                        <Textarea id="emailTemplate" name="emailTemplate" value={settings.emailTemplate} onChange={handleChange} />
                        <p className="text-xs text-gray-500 mt-1">Placeholders: {`{customerName}`}, {`{bookingDate}`}, {`{bookingTime}`}, {`{businessName}`}</p>
                    </div>
                    <div>
                        <Label htmlFor="smsTemplate">SMS Template</Label>
                        <Textarea id="smsTemplate" name="smsTemplate" value={settings.smsTemplate} onChange={handleChange} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Google Calendar Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="googleCalendarEnabled"
                            name="googleCalendarEnabled"
                            checked={settings.googleCalendarEnabled}
                            onChange={handleChange}
                            className="h-4 w-4 text-brand-start focus:ring-brand-start border-gray-300 rounded"
                        />
                        <Label htmlFor="googleCalendarEnabled" className="mb-0">
                            Enable "Add to Google Calendar" button on bookings
                        </Label>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        This uses a simple link to open a pre-filled event in your browser. No API keys or sign-in required.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Backup all your application data to a JSON file or restore from a previous backup.
                    </p>
                    <div className="flex space-x-2">
                        <Button variant="secondary" onClick={handleExport}>Export Data</Button>
                        <Button variant="secondary" onClick={() => document.getElementById('import-input')?.click()}>Import Data</Button>
                        <input type="file" id="import-input" className="hidden" accept=".json" onChange={handleImport} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>Save All Settings</Button>
            </div>
        </div>
    );
};
