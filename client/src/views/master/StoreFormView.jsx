import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormField, Input, Card, Btn, Select } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';
import { nextCode } from '../../api/codeGen';

const CATEGORY_OPTIONS = [
    { value: 'THAI_FOOD',    label: 'Thai Food'    },
    { value: 'JAPANESE',     label: 'Japanese'     },
    { value: 'CHINESE',      label: 'Chinese'      },
    { value: 'WESTERN',      label: 'Western'      },
    { value: 'CAFE_DRINKS',  label: 'Cafe & Drinks'},
    { value: 'FAST_FOOD',    label: 'Fast Food'    },
    { value: 'BAKERY',       label: 'Bakery'       },
    { value: 'GROCERY',      label: 'Grocery'      },
    { value: 'OTHER',        label: 'Other'        },
];

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

export default function StoreFormView({ data = {}, onBack, onSaved, showToast }) {
    const isNew = !data.storeCode;

    const [name,        setName]        = useState(data.name     || '');
    const [category,    setCategory]    = useState(data.category || 'THAI_FOOD');
    const [status,      setStatus]      = useState(data.status   || 'ACTIVE');
    const [address,     setAddress]     = useState(data.address  || '');
    const [city,        setCity]        = useState(data.city     || '');
    const [previewCode, setPreviewCode] = useState(data.storeCode || '…');
    const [saving,      setSaving]      = useState(false);
    const [isAuto,      setIsAuto]      = useState(true);
    const [customCode,  setCustomCode]  = useState('');

    useEffect(() => {
        if (!isNew) return;
        getJson('/stores')
            .then(stores => {
                const codes = stores.map(s => s.store_code);
                setPreviewCode(nextCode(codes, 'STR-', 6));
            })
            .catch(() => setPreviewCode('STR-????'));
    }, [isNew]);

    const validate = () => {
        if (isNew && !isAuto) {
            const trimmed = customCode.trim();
            if (!trimmed) return 'Custom Store Code is required when Auto is unchecked';
            if (!/^STR-\d{6}$/.test(trimmed)) return 'Store Code must be in the format STR-000000 (STR- followed by 6 digits)';
        }
        if (!name.trim())    return 'Store Name is required';
        if (!category)       return 'Category is required';
        if (!address.trim()) return 'Address is required';
        if (!city.trim())    return 'City is required';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) return showToast(err, 'error');

        setSaving(true);
        try {
            if (isNew) {
                // 1. Create address
                const addr = await postJson('/addresses', {
                    address_name:   name.trim(),
                    address_type:   'STORE',
                    address_line_1: address.trim(),
                    city:           city.trim(),
                    country_code:   'TH',
                });
                // 2. Create store
                await postJson('/stores', {
                    name:       name.trim(),
                    address_id: addr.address_id,
                    category:   category,
                    status:     status,
                    code:       isAuto ? previewCode : customCode.trim(),
                });
                showToast('Store created successfully!');
            } else {
                // Parallel update address + store
                await Promise.all([
                    putJson(`/addresses/${data.addressId}`, {
                        address_line_1: address.trim(),
                        city:           city.trim(),
                    }),
                    putJson(`/stores/${data.storeCode}`, {
                        name:     name.trim(),
                        category: category,
                        status:   status,
                    }),
                ]);
                showToast('Store updated successfully!');
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
                <ArrowLeft className="w-4 h-4" /> Back to Stores
            </button>

            <Card className="p-5">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-6">
                    {isNew ? 'New Store' : `Edit: ${data.name}`}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Store Code — Auto/Custom input */}
                    <FormField label="Store Code" required>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                value={isNew ? (isAuto ? previewCode : customCode) : previewCode}
                                onChange={e => setCustomCode(e.target.value)}
                                readOnly={!isNew || isAuto}
                                className={`font-mono flex-1 ${(!isNew || isAuto) ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300' : ''}`}
                                placeholder="STR-000001"
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

                    {/* Status */}
                    <FormField label="Status">
                        <Select value={status} onChange={e => setStatus(e.target.value)}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                    </FormField>

                    {/* Store Name */}
                    <FormField label="Store Name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Restaurant or store name" />
                    </FormField>

                    {/* Category */}
                    <FormField label="Category" required>
                        <Select value={category} onChange={e => setCategory(e.target.value)}>
                            {CATEGORY_OPTIONS.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </Select>
                    </FormField>

                    {/* City */}
                    <FormField label="City" required>
                        <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Bangkok" />
                    </FormField>

                    {/* Address — full width */}
                    <div className="md:col-span-2">
                        <FormField label="Address" required>
                            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address / building" />
                        </FormField>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <Btn variant="secondary" onClick={onBack} disabled={saving}>Cancel</Btn>
                    <Btn onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save Store'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}
