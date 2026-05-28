import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormField, Input, Card, Btn, Select } from '../../components/ui';

export default function StoreFormView({ data, onBack, showToast }) {
    const [name, setName] = useState(data.name || '');
    const [category, setCategory] = useState(data.category || 'Thai Food');
    const [phone, setPhone] = useState(data.phone || '');
    const [open, setOpen] = useState(data.open || '');
    const [address, setAddress] = useState(data.address || '');

    const handleSave = () => {
        if (!name.trim() || !category || !phone.trim() || !address.trim()) {
            return showToast('Please fill all required fields', 'error');
        }
        showToast('Store saved!'); onBack();
    };
    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Stores</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">{data.id ? `Edit: ${data.name}` : 'New Store'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Store Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="Restaurant name" /></FormField>
                    <FormField label="Category" required>
                        <Select value={category} onChange={e => setCategory(e.target.value)}><option>Thai Food</option><option>Japanese</option><option>Cafe & Drinks</option><option>Fast Food</option><option>Other</option></Select>
                    </FormField>
                    <FormField label="Phone" required><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="02-xxx-xxxx" /></FormField>
                    <FormField label="Operating Hours"><Input value={open} onChange={e => setOpen(e.target.value)} placeholder="09:00-21:00" /></FormField>
                    <div className="md:col-span-2"><FormField label="Address" required><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" /></FormField></div>
                </div>
                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSave}><Save className="w-4 h-4" /> Save</Btn>
                </div>
            </Card>
        </div>
    );
}
