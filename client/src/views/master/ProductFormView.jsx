import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormField, Input, Card, Btn, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';

const STATUS_OPTIONS = [
    { value: 'available',    label: 'Available'    },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'unavailable',  label: 'Unavailable'  },
    { value: 'discontinued', label: 'Discontinued' },
];

export default function ProductFormView({ data = {}, stores: initStores = [], onBack, onSaved, showToast }) {
    const isNew = !data.productId;

    // Store LoV — use pre-fetched list from parent (ProductListView); refresh if empty
    const [stores,      setStores]      = useState(initStores);
    const [storeDisplay, setStoreDisplay] = useState(
        data.storeCode ? `${data.storeCode} – ${data.storeName}` : ''
    );
    const [selectedStoreCode, setSelectedStoreCode] = useState(data.storeCode || '');
    const [storeIsLov,  setStoreIsLov]  = useState(false);

    const [name,   setName]   = useState(data.name  || '');
    const [price,  setPrice]  = useState(data.price != null ? String(data.price) : '');
    const [status, setStatus] = useState(data.status || 'available');
    const [saving, setSaving] = useState(false);

    // If parent didn't provide stores list (edge case), fetch live
    useEffect(() => {
        if (stores.length === 0) {
            getJson('/stores')
                .then(list => setStores(list.map(s => ({
                    id:       s.store_code,
                    storeId:  s.store_id,
                    name:     s.name,
                    category: s.category,
                }))))
                .catch(() => {});
        }
    }, []);

    const validate = () => {
        if (isNew && !selectedStoreCode) return 'Please select a Store';
        if (!name.trim())               return 'Product Name is required';
        if (price === '')               return 'Unit Price is required';
        if (Number(price) < 0)          return 'Price cannot be negative';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) return showToast(err, 'error');

        setSaving(true);
        try {
            if (isNew) {
                await postJson('/store-products', {
                    store_code: selectedStoreCode,
                    name:       name.trim(),
                    unit_price: parseFloat(price),
                    status:     status,
                });
                showToast('Product created successfully!');
            } else {
                await putJson(`/store-products/${data.productId}`, {
                    name:       name.trim(),
                    unit_price: parseFloat(price),
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
            {/* Store LoV modal */}
            <LovModal
                isOpen={storeIsLov}
                onClose={() => setStoreIsLov(false)}
                title="Select Store"
                columns={[
                    { key: 'id',       label: 'Code'     },
                    { key: 'name',     label: 'Store'    },
                    { key: 'category', label: 'Category' },
                ]}
                data={stores}
                onSelect={r => {
                    setSelectedStoreCode(r.id);
                    setStoreDisplay(`${r.id} – ${r.name}`);
                    setStoreIsLov(false);
                }}
            />

            <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Products
            </button>

            <Card className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-6">
                    {isNew ? 'New Product' : `Edit: ${data.name}`}
                </h3>

                <div className="space-y-5">
                    {/* Row 1: Product ID (read-only) | Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField label="Product ID">
                            <Input
                                value={isNew ? '(assigned by server)' : String(data.productId)}
                                readOnly
                                className="bg-slate-50 text-slate-400 font-mono"
                            />
                        </FormField>
                        <FormField label="Status">
                            <Select value={status} onChange={e => setStatus(e.target.value)}>
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Select>
                        </FormField>
                    </div>

                    {/* Row 2: Store (LoV) | Product Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField label="Store" required>
                            {isNew ? (
                                <LovInput
                                    value={storeDisplay}
                                    onLov={() => setStoreIsLov(true)}
                                    placeholder="Select store…"
                                />
                            ) : (
                                /* Store cannot be changed after creation */
                                <Input
                                    value={storeDisplay || data.storeName}
                                    readOnly
                                    className="bg-slate-50 text-slate-500"
                                    title="Store cannot be changed after creation"
                                />
                            )}
                        </FormField>
                        <FormField label="Product Name" required>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Menu item name"
                            />
                        </FormField>
                    </div>

                    {/* Row 3: Unit Price */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField label="Unit Price (฿)" required>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="0.00"
                            />
                        </FormField>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
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
