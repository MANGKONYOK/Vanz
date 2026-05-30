import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormField, Input, Card, Btn, Select } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';
import { nextCode } from '../../api/codeGen';

const VEHICLE_OPTIONS = ['MOTORCYCLE', 'CAR', 'BICYCLE', 'SCOOTER', 'VAN', 'TRUCK'];
const STATUS_OPTIONS  = [
    { value: 'AVAILABLE', label: 'Active'   },
    { value: 'BUSY',      label: 'Busy'     },
    { value: 'OFFLINE',   label: 'Inactive' },
];

export default function DelivererFormView({ data = {}, onBack, onSaved, showToast }) {
    const isNew = !data.delivererCode;

    const [name,          setName]          = useState(data.name          || '');
    const [phone,         setPhone]         = useState(data.phone         || '');
    const [email,         setEmail]         = useState(data.email         || '');
    const [license,       setLicense]       = useState(data.license       || '');
    const [vehicleType,   setVehicleType]   = useState(data.type          || 'MOTORCYCLE');
    const [currentStatus, setCurrentStatus] = useState(data.currentStatus || 'AVAILABLE');
    const [previewCode,   setPreviewCode]   = useState(data.delivererCode  || '…');
    const [saving,        setSaving]        = useState(false);
    const [isAuto,        setIsAuto]        = useState(true);
    const [customCode,    setCustomCode]    = useState('');

    useEffect(() => {
        if (!isNew) return;
        getJson('/deliverers')
            .then(deliverers => {
                const codes = deliverers.map(d => d.deliverer_code);
                setPreviewCode(nextCode(codes, 'DLV-', 6));
            })
            .catch(() => setPreviewCode('DLV-????'));
    }, [isNew]);

    const validate = () => {
        if (!isAuto && !customCode.trim()) return 'Custom Deliverer Code is required when Auto is unchecked';
        if (!name.trim())    return 'Full Name is required';
        if (!phone.trim())   return 'Phone Number is required';
        if (!license.trim()) return 'License Plate is required';
        if (!vehicleType)    return 'Vehicle Type is required';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) return showToast(err, 'error');

        setSaving(true);
        try {
            if (isNew) {
                // 1. Create profile
                const profile = await postJson('/profiles', {
                    full_name: name.trim(),
                    phone:     phone.trim(),
                    email:     email.trim() || undefined,
                });
                // 2. Create deliverer
                await postJson('/deliverers', {
                    profile_id:     profile.profile_id,
                    vehicle_type:   vehicleType,
                    license_plate:  license.trim().toUpperCase(),
                    current_status: currentStatus,
                    code:           isAuto ? previewCode : customCode.trim(),
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
                        vehicle_type:   vehicleType,
                        license_plate:  license.trim().toUpperCase(),
                        current_status: currentStatus,
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
            <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Deliverers
            </button>

            <Card className="p-5">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-6">
                    {isNew ? 'New Deliverer' : `Edit: ${data.name}`}
                </h3>

                <div className="space-y-5">
                    {/* Row 1: Code preview | Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Deliverer Code">
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    value={isNew ? (isAuto ? previewCode : customCode) : previewCode}
                                    onChange={e => setCustomCode(e.target.value)}
                                    readOnly={!isNew || isAuto}
                                    className={`font-mono flex-1 ${(!isNew || isAuto) ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300' : ''}`}
                                    placeholder="DLV-000001"
                                />
                                {isNew && (
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-gray-300 select-none cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/55 transition-colors h-9">
                                        <input
                                            type="checkbox"
                                            checked={isAuto}
                                            onChange={e => setIsAuto(e.target.checked)}
                                            className="rounded accent-red-650 cursor-pointer"
                                        />
                                        <span>Auto</span>
                                    </label>
                                )}
                            </div>
                        </FormField>
                        <FormField label="Status">
                            <div className="bg-slate-100 p-1 rounded-xl flex w-full max-w-[280px] border border-slate-200/50 mt-1">
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setCurrentStatus(opt.value)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                                            currentStatus === opt.value
                                                ? 'bg-red-500 text-white shadow-sm'
                                                : 'text-slate-500 dark:text-gray-300 hover:text-slate-800 dark:hover:text-white'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </FormField>
                    </div>

                    {/* Row 2: Full Name | Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Full Name" required>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Deliverer full name" />
                        </FormField>
                        <FormField label="Phone Number" required>
                            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" type="tel" />
                        </FormField>
                    </div>

                    {/* Row 3: License Plate | Vehicle Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="License Plate" required>
                            <Input
                                value={license}
                                onChange={e => setLicense(e.target.value)}
                                placeholder="e.g. 1กข 1234"
                                className="font-mono"
                            />
                        </FormField>
                        <FormField label="Vehicle Type" required>
                            <Select value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                                {VEHICLE_OPTIONS.map(v => (
                                    <option key={v} value={v}>{v.charAt(0) + v.slice(1).toLowerCase()}</option>
                                ))}
                            </Select>
                        </FormField>
                    </div>

                    {/* Row 4: Email (optional) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Email">
                            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="deliverer@email.com" type="email" />
                        </FormField>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
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
