import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormField, Input, Card, Btn, Select } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';
import { nextCode } from '../../api/codeGen';

const MEMBERSHIP_OPTIONS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

export default function CustomerFormView({ data = {}, onBack, onSaved, showToast }) {
    const isNew = !data.customerCode;

    // Form fields
    const [name,        setName]        = useState(data.name        || '');
    const [phone,       setPhone]       = useState(data.phone       || '');
    const [email,       setEmail]       = useState(data.email       || '');
    const [address,     setAddress]     = useState(data.address     || '');
    const [address2,    setAddress2]    = useState(data.address2    || '');
    const [city,        setCity]        = useState(data.city        || '');
    const [province,    setProvince]    = useState(data.province    || '');
    const [membership,  setMembership]  = useState(data.membership  || 'Bronze');

    // Predicted next code (preview only — real code is assigned by server)
    const [previewCode, setPreviewCode] = useState(data.customerCode || '…');
    const [saving, setSaving] = useState(false);

    // On new form: fetch existing customers to compute next code preview
    useEffect(() => {
        if (!isNew) return;
        getJson('/customers')
            .then(customers => {
                const codes = customers.map(c => c.customer_code);
                setPreviewCode(nextCode(codes, 'CUST-', 4));
            })
            .catch(() => setPreviewCode('CUST-????'));
    }, [isNew]);

    const validate = () => {
        if (!name.trim())     return 'Full Name is required';
        if (!phone.trim())    return 'Phone Number is required';
        if (!address.trim())  return 'Address Line 1 is required';
        if (!city.trim())     return 'City is required';
        if (!province.trim()) return 'Province is required';
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
                // 2. Create address
                const addr = await postJson('/addresses', {
                    address_name:   name.trim(),
                    address_type:   'HOME',
                    address_line_1: address.trim(),
                    address_line_2: address2.trim(),
                    city:           city.trim(),
                    province:       province.trim(),
                    country_code:   'TH',
                });
                // 3. Create customer
                await postJson('/customers', {
                    profile_id:       profile.profile_id,
                    address_id:       addr.address_id,
                    membership_level: membership,
                });
                showToast('Customer created successfully!');
            } else {
                // Parallel update profile + address
                await Promise.all([
                    putJson(`/profiles/${data.profileId}`, {
                        full_name: name.trim(),
                        phone:     phone.trim(),
                        email:     email.trim() || undefined,
                    }),
                    putJson(`/addresses/${data.addressId}`, {
                        address_line_1: address.trim(),
                        address_line_2: address2.trim(),
                        city:           city.trim(),
                        province:       province.trim(),
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
                className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Customers
            </button>

            <Card className="p-5">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 text-lg">
                        {isNew ? 'New Customer' : `Edit: ${data.name}`}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Customer Code — read-only preview */}
                    <FormField label="Customer Code">
                        <Input
                            value={previewCode}
                            readOnly
                            className="bg-slate-50 text-slate-500 font-mono"
                            title={isNew ? 'Code is assigned by server on save' : 'Code cannot be changed'}
                        />
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

                    {/* Province */}
                    <FormField label="Province" required>
                        <Input
                            value={province}
                            onChange={e => setProvince(e.target.value)}
                            placeholder="Bangkok"
                        />
                    </FormField>

                    {/* Address Line 1 — full width */}
                    <div className="md:col-span-2">
                        <FormField label="Address Line 1" required>
                            <Input
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="House no., street, road"
                            />
                        </FormField>
                    </div>

                    {/* Address Line 2 — full width */}
                    <div className="md:col-span-2">
                        <FormField label="Address Line 2">
                            <Input
                                value={address2}
                                onChange={e => setAddress2(e.target.value)}
                                placeholder="Unit, floor, building (optional)"
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
