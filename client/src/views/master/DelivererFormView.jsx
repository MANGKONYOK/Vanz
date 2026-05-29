import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormField, Input, Card, Btn, Select } from '../../components/ui';
import { postJson, putJson, getApiErrorMessage } from '../../api/http';

const VEHICLE_TYPES = ['Motorcycle', 'Car', 'Truck'];
const STATUS_OPTIONS = [
    { value: 'available', label: 'Available' },
    { value: 'busy',      label: 'Busy'      },
    { value: 'offline',   label: 'Offline'   },
];

export default function DelivererFormView({ data = {}, onBack, onSaved, showToast }) {
    const isNew = !data.id;

    const [name,    setName]    = useState(data.name    || '');
    const [phone,   setPhone]   = useState(data.phone   || '');
    const [email,   setEmail]   = useState(data.email   || '');
    const [license, setLicense] = useState(data.license || '');
    const [type,    setType]    = useState(data.type    || 'Motorcycle');
    const [status,  setStatus]  = useState(data.status  || 'offline');
    const [saving,  setSaving]  = useState(false);

    const validate = () => {
        if (!name.trim())    return 'Full Name is required';
        if (!phone.trim())   return 'Phone Number is required';
        if (!license.trim()) return 'License Plate is required';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) return showToast(err, 'error');
        setSaving(true);
        try {
            if (isNew) {
                const profile = await postJson('/profiles', {
                    full_name: name.trim(),
                    phone:     phone.trim(),
                    email:     email.trim() || undefined,
                });
                await postJson('/deliverers', {
                    profile_id:    profile.profile_id,
                    vehicle_type:  type,
                    license_plate: license.trim().toUpperCase(),
                    current_status: status,
                });
                showToast('Deliverer created successfully!');
            } else {
                await Promise.all([
                    putJson(`/profiles/${data.profileId}`, {
                        full_name: name.trim(),
                        phone:     phone.trim(),
                        email:     email.trim() || undefined,
                    }),
                    putJson(`/deliverers/${data.delivererCode}`, {
                        vehicle_type:   type,
                        license_plate:  license.trim().toUpperCase(),
                        current_status: status,
                    }),
                ]);
                showToast('Deliverer updated successfully!');
            }
            onSaved();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Save failed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-current/75 hover:text-current font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Deliverers
            </button>
            <Card className="p-5">
                <h3 className="font-bold text-current mb-6 text-lg">{isNew ? 'New Deliverer' : `Edit: ${data.name}`}</h3>

                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Deliverer Code">
                            <Input value={isNew ? '(assigned on save)' : data.delivererCode} readOnly
                                className="bg-slate-50 dark:bg-slate-800/50 text-current/60 font-mono" />
                        </FormField>
                        <FormField label="Full Name" required>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Deliverer name" />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="License Plate" required>
                            <Input value={license} onChange={e => setLicense(e.target.value.toUpperCase())} placeholder="e.g. 1กข 1234" />
                        </FormField>
                        <FormField label="Phone Number" required>
                            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" type="tel" />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Email">
                            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="deliverer@email.com" type="email" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Vehicle Type" required>
                                <Select value={type} onChange={e => setType(e.target.value)}>
                                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                            </FormField>
                            <FormField label="Status">
                                <Select value={status} onChange={e => setStatus(e.target.value)}>
                                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </Select>
                            </FormField>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-current/10">
                    <Btn variant="secondary" onClick={onBack} disabled={saving}>Cancel</Btn>
                    <Btn onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save Deliverer'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}
