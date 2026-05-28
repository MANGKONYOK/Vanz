import { useState } from 'react';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { FormField, Input, Card, Btn, Select } from '../../components/ui';

export default function DelivererFormView({ data, onBack, showToast }) {
    const isNew = !data.id;
    const [id, setId] = useState(data.id || '');
    const [autoId, setAutoId] = useState(isNew);
    const [status, setStatus] = useState(data.status || 'Active');
    const [name, setName] = useState(data.name || '');
    const [license, setLicense] = useState(data.license || '');
    const [phone, setPhone] = useState(data.phone || '');
    const [type, setType] = useState(data.type || 'Motorcycle');

    const handleSave = () => {
        if (!name.trim() || !license.trim() || !phone.trim() || !type) {
            return showToast('Please fill all required fields', 'error');
        }
        if (!autoId && !id.trim()) return showToast('Please enter a Deliverer ID', 'error');
        showToast('Deliverer saved!'); onBack();
    };

    const displayId = autoId ? (id || 'D-AUTO') : id;

    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Deliverers
            </button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-6">{isNew ? 'New Deliverer' : `Edit: ${data.name}`}</h3>
                
                <div className="space-y-5">
                    {/* Row 1: Deliverer ID | Full Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <FormField label="Deliverer ID" required>
                                    <Input
                                        value={displayId}
                                        onChange={e => setId(e.target.value.toUpperCase())}
                                        placeholder="D-001"
                                        readOnly={autoId}
                                        className={autoId ? 'bg-slate-50 text-slate-500 font-mono' : 'font-mono'}
                                    />
                                </FormField>
                            </div>
                            <label className="flex items-center gap-2 mb-2.5 cursor-pointer select-none">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={autoId}
                                        onChange={e => setAutoId(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-5 h-5 border-2 border-slate-200 rounded-md peer-checked:bg-red-500 peer-checked:border-red-500 transition-all flex items-center justify-center text-white">
                                        <Check size={12} strokeWidth={4} className={autoId ? 'scale-100' : 'scale-0'} />
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-slate-600">Auto</span>
                            </label>
                        </div>
                        <FormField label="Full Name" required>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Deliverer name" />
                        </FormField>
                    </div>

                    {/* Row 2: License Plate | Phone Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="License Plate" required>
                            <Input value={license} onChange={e => setLicense(e.target.value)} placeholder="e.g. 1กข 1234" />
                        </FormField>
                        <FormField label="Phone Number" required>
                            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
                        </FormField>
                    </div>

                    {/* Row 3: Vehicle Type | Status Switch */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Vehicle Type" required>
                            <Select value={type} onChange={e => setType(e.target.value)}>
                                <option>Motorcycle</option>
                                <option>Car</option>
                                <option>Truck</option>
                            </Select>
                        </FormField>
                        <FormField label="Status">
                            <div className="bg-slate-100 p-1 rounded-xl flex w-full max-w-[240px] border border-slate-200/50 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setStatus('Active')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                                        status === 'Active'
                                            ? 'bg-red-500 text-white shadow-sm font-extrabold'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Active
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus('Inactive')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                                        status === 'Inactive'
                                            ? 'bg-slate-400 text-white shadow-sm font-extrabold'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Inactive
                                </button>
                            </div>
                        </FormField>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
                    <Btn onClick={handleSave}><Save className="w-4 h-4" /> Save Deliverer</Btn>
                </div>
            </Card>
        </div>
    );
}
