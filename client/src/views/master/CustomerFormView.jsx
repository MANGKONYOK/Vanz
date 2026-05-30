import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormField, Input, Card, Btn, Select } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';
import { nextCode } from '../../api/codeGen';

const MEMBERSHIP_OPTIONS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

function formatPhoneForDb(phone) {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+66')) {
        cleaned = '0' + cleaned.slice(3);
    }
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.startsWith('0') && cleaned.length === 9) {
        if (cleaned.startsWith('02')) {
            return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
        } else {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
    }
    return phone.trim();
}

export default function CustomerFormView({ data = {}, onBack, onSaved, showToast }) {
    const isNew = !data.customerCode;

    // Form fields
    const [name,       setName]       = useState(data.name       || '');
    const [phone,      setPhone]      = useState(data.phone      || '');
    const [email,      setEmail]      = useState(data.email      || '');
    const [address,    setAddress]    = useState(data.address    || '');
    const [city,       setCity]       = useState(data.city       || '');
    const [membership, setMembership] = useState(data.membership || 'Bronze');

    // Predicted next code (preview only — real code is assigned by server unless custom)
    const [previewCode, setPreviewCode] = useState(data.customerCode || '…');
    const [saving, setSaving] = useState(false);
    const [isAuto, setIsAuto] = useState(true);
    const [customCode, setCustomCode] = useState('');

    // On new form: fetch existing customers to compute next code preview
    useEffect(() => {
        if (!isNew) return;
        getJson('/customers')
            .then(customers => {
                const codes = customers.map(c => c.customer_code);
                setPreviewCode(nextCode(codes, 'CUST-', 6));
            })
            .catch(() => setPreviewCode('CUST-????'));
    }, [isNew]);

    const validate = () => {
        if (isNew && !isAuto) {
            const trimmed = customCode.trim();
            if (!trimmed) return 'Custom ID is required when Auto is unchecked';
            if (!/^CUST-\d{6}$/.test(trimmed)) return 'ID must be in the format CUST-000000 (CUST- followed by 6 digits)';
        }
        if (!name.trim())    return 'Full Name is required';
        if (!phone.trim())   return 'Phone Number is required';
        const cleanedPhone = phone.replace(/[^\d]/g, '');
        if (cleanedPhone.length < 9 || cleanedPhone.length > 11) {
            return 'Please enter a valid Phone Number';
        }
        if (!address.trim()) return 'Address is required';
        if (!city.trim())    return 'City is required';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) return showToast(err, 'error');

        setSaving(true);
        const formattedPhone = formatPhoneForDb(phone);
        try {
            if (isNew) {
                // 1. Create profile
                const profile = await postJson('/profiles', {
                    full_name: name.trim(),
                    phone:     formattedPhone,
                    email:     email.trim() || undefined,
                });
                // 2. Create address
                const addr = await postJson('/addresses', {
                    address_name:  name.trim(),
                    address_type:  'HOME',
                    address_line_1: address.trim(),
                    city:          city.trim(),
                    country_code:  'TH',
                });
                // 3. Create customer
                await postJson('/customers', {
                    profile_id:       profile.profile_id,
                    address_id:       addr.address_id,
                    membership_level: membership,
                    code:             isAuto ? previewCode : customCode.trim(),
                });
                showToast('Customer created successfully!');
            } else {
                // Parallel update profile + address
                await Promise.all([
                    putJson(`/profiles/${data.profileId}`, {
                        full_name: name.trim(),
                        phone:     formattedPhone,
                        email:     email.trim() || undefined,
                    }),
                    putJson(`/addresses/${data.addressId}`, {
                        address_line_1: address.trim(),
                        city:           city.trim(),
                    }),
                ]);
                // Update customer
                await putJson(`/customers/${data.customerCode}`, {
                    membership_level: membership,
                });
                showToast('Customer updated successfully!');
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
                className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-bold transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Customers
            </button>

            <Card className="p-5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                        {isNew ? 'New Customer' : `Edit: ${data.name}`}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Customer Code — Auto/Custom input */}
                    <FormField label="ID" required>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                value={isNew ? (isAuto ? previewCode : customCode) : previewCode}
                                onChange={e => setCustomCode(e.target.value)}
                                readOnly={!isNew || isAuto}
                                className={`font-mono flex-1 ${(!isNew || isAuto) ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300' : ''}`}
                                placeholder="CUST-000001"
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

                    {/* Membership Level */}
                    <FormField label="Membership Level" required>
                        <Select value={membership} onChange={e => setMembership(e.target.value)}>
                            {MEMBERSHIP_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </Select>
                    </FormField>

                    {/* Full Name */}
                    <FormField label="Full Name" required>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Customer full name"
                        />
                    </FormField>

                    {/* Phone */}
                    <FormField label="Phone Number" required>
                        <Input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="0xx-xxx-xxxx"
                            type="tel"
                        />
                    </FormField>

                    {/* Email */}
                    <FormField label="Email">
                        <Input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="customer@email.com"
                            type="email"
                        />
                    </FormField>

                    {/* City */}
                    <FormField label="City" required>
                        <Input
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            placeholder="Bangkok"
                        />
                    </FormField>

                    {/* Address — full width */}
                    <div className="md:col-span-2">
                        <FormField label="Address" required>
                            <Input
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="Street address / building"
                            />
                        </FormField>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack} disabled={saving}>Cancel</Btn>
                    <Btn onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save Customer'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}
