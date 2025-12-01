
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from '../components/ui';

export const SettingsView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [settings, setSettings] = useState(state.settings);
    const { isApiReady, isSignedIn, currentUser, signIn, signOut } = useGoogleCalendar();

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
                } catch (err) {
                    alert('Error importing data. The file might be corrupted.');
                }
            };
            reader.readAsText(file);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             setSettings({ ...settings, [name]: (e.target as HTMLInputElement).checked });
        } else {
             setSettings({ ...settings, [name]: value });
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Business Details</CardTitle>
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
                    <CardTitle>Google Calendar Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center">
                        <input id="googleCalendarEnabled" name="googleCalendarEnabled" type="checkbox" checked={settings.googleCalendarEnabled} onChange={handleChange} className="h-4 w-4 text-brand-start focus:ring-brand-start border-gray-300 rounded" />
                        <Label htmlFor="googleCalendarEnabled" className="ml-2 mb-0">Enable Google Calendar Sync</Label>
                    </div>
                    {settings.googleCalendarEnabled && (
                        <>
                             <div>
                                <Label htmlFor="googleCalendarApiKey">Google Calendar API Key</Label>
                                <Input id="googleCalendarApiKey" name="googleCalendarApiKey" type="password" value={settings.googleCalendarApiKey} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="googleCalendarClientId">Google Calendar Client ID</Label>
                                <Input id="googleCalendarClientId" name="googleCalendarClientId" type="password" value={settings.googleCalendarClientId} onChange={handleChange} />
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Authentication Status</p>
                                    {!isApiReady ? <p className="text-sm text-gray-500">Initializing...</p> : 
                                     isSignedIn ? <p className="text-sm text-green-600 dark:text-green-400">Signed in as {currentUser}</p> :
                                     <p className="text-sm text-yellow-600 dark:text-yellow-400">Not signed in</p>
                                    }
                                </div>
                                {isApiReady && (isSignedIn ? <Button variant="secondary" onClick={signOut}>Sign Out</Button> : <Button onClick={signIn}>Sign In with Google</Button>)}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* FIX: Removed the Gemini API Key section to comply with guidelines requiring the key to be managed via environment variables. */}
            
            <Card>
                <CardHeader>
                    <CardTitle>Message Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="emailTemplate">Email Template</Label>
                        <Textarea id="emailTemplate" name="emailTemplate" value={settings.emailTemplate} onChange={handleChange} rows={5} />
                    </div>
                     <div>
                        <Label htmlFor="smsTemplate">SMS Template</Label>
                        <Textarea id="smsTemplate" name="smsTemplate" value={settings.smsTemplate} onChange={handleChange} rows={2} />
                    </div>
                </CardContent>
            </Card>
            
            <div className="flex justify-end">
                <Button onClick={handleSave}>Save All Settings</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                </CardHeader>
                <CardContent className="flex space-x-4">
                    <Button onClick={handleExport}>Export Data</Button>
                    <Label htmlFor="import-file" className="cursor-pointer inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                      Import Data
                      <Input id="import-file" type="file" className="hidden" accept=".json" onChange={handleImport} />
                    </Label>
                </CardContent>
            </Card>
        </div>
    );
};