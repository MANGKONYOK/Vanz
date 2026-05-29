import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormField, Input, Card, Btn, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';

const STATUS_OPTIONS = [
    { value: 'available', label: 'Available' },
    { value: 'inactive',  label: 'Inactive'  },
];

export default function ProductFormView({ data = {}, onBack, onSaved, showToast }) {
    const isNew = !data.id;

    const [name,      setName]      = useState(data.name       || '');
    const [price,     setPrice]     = useState(data.price      ?? '');
    const [status,    setStatus]    = useState(data.status      || 'available');
    const [storeCode, setStoreCode] = useState(data.storeCode   || '');
    const [storeLabel, setStoreLabel] = useState(
        data.storeCode && data.storeName ? `${data.storeCode} – ${data.storeName}` : ''
    );
    const [stores,    setStores]    = useState([]);
    const [lovOpen,   setLovOpen]   = useState(false);
    const [saving,    setSaving]    = useState(false);

    useEffect(() => {
        getJson('/stores').then(setStores).catch(() => {});
    }, []);

    const validate = () => {
        if (!name.trim())         return 'Product Name is required';
        if (!storeCode)           return 'Store is required';
        if (price === '' || isNaN(Number(price)) || Number(price) < 0)
            return 'Unit Price must be a valid number ≥ 0';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) return showToast(err, 'error');
        setSaving(true);
        try {
            if (isNew) {
                await postJson('/store-products', {
                    store_code: storeCode,
                    name:       name.trim(),
                    unit_price: Number(price),
                    status:     status,
                });
                showToast('Product created successfully!');
            } else {
                await putJson(`/store-products/${data.id}`, {
                    name:       name.trim(),
                    unit_price: Number(price),
                    status:     status,
                });
                showToast('Product updated successfully!');
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
            <LovModal isOpen={lovOpen} onClose={() => setLovOpen(false)} title="Store"
                columns={[{ key: 'store_code', label: 'Code' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={stores}
                onSelect={r => { setStoreCode(r.store_code); setStoreLabel(`${r.store_code} – ${r.name}`); setLovOpen(false); }} />

            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-current/75 hover:text-current font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Products
            </button>
            <Card className="p-5">
                <h3 className="font-bold text-current mb-6 text-lg">{isNew ? 'New Product' : `Edit: ${data.name}`}</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormField label="Product Name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Menu item name" />
                    </FormField>

                    <FormField label="Unit Price (฿)" required>
                        <Input type="number" min="0" step="0.01" value={price}
                            onChange={e => setPrice(e.target.value)} placeholder="0" />
                    </FormField>

                    <FormField label="Status">
                        <Select value={status} onChange={e => setStatus(e.target.value)}>
                            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </Select>
                    </FormField>

                    <div className="md:col-span-2">
                        <FormField label="Store" required>
                            {isNew ? (
                                <LovInput value={storeLabel} onLov={() => setLovOpen(true)} placeholder="Select store..." />
                            ) : (
                                <Input value={storeLabel || data.storeName} readOnly
                                    className="bg-slate-50 dark:bg-slate-800/50 text-current/60" />
                            )}
                        </FormField>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-current/10">
                    <Btn variant="secondary" onClick={onBack} disabled={saving}>Cancel</Btn>
                    <Btn onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save Product'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}
