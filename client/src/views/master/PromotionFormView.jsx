import { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Btn, Card, CardHeader, Table, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { postJson, putJson, getApiErrorMessage } from '../../api/http';

export default function PromotionFormView({ data = {}, stores = [], products = [], onBack, onSaved, showToast }) {
    const isNew = !data.id;

    const [name,         setName]         = useState(data.name         || '');
    const [discountType, setDiscountType] = useState(data.discountType  || 'PERCENTAGE');
    const [startDate,    setStartDate]    = useState(data.startDate     || '');
    const [endDate,      setEndDate]      = useState(data.endDate       || '');
    const [storeCode,    setStoreCode]    = useState(data.storeCode     || '');
    const [storeLabel,   setStoreLabel]   = useState(
        data.storeCode && data.storeName ? `${data.storeCode} – ${data.storeName}` : ''
    );
    const [items, setItems] = useState(() =>
        isNew ? [{ id: 1, productId: '', productName: '', discount: 0 }]
              : (data.items || []).map((it, idx) => ({
                    id:          idx + 1,
                    productId:   it.product_id,
                    productName: products.find(p => p.product_id === it.product_id)?.name || `Product #${it.product_id}`,
                    discount:    it.discount_value,
                }))
    );

    const [storeLovOpen,   setStoreLovOpen]   = useState(false);
    const [productLovOpen, setProductLovOpen] = useState(false);
    const [productLovIdx,  setProductLovIdx]  = useState(null);
    const [saving,         setSaving]         = useState(false);

    const validate = () => {
        if (!name.trim())   return 'Campaign Name is required';
        if (!storeCode)     return 'Store is required';
        if (!startDate)     return 'Start Date is required';
        if (!endDate)       return 'End Date is required';
        if (endDate < startDate) return 'End Date cannot be before Start Date';
        if (items.length === 0)  return 'Must include at least one product';
        if (items.some(i => !i.productId)) return 'All items must have a product selected';
        if (items.some(i => i.discount <= 0)) return 'All discount values must be greater than zero';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) return showToast(err, 'error');
        setSaving(true);
        try {
            const body = {
                name:          name.trim(),
                discount_type: discountType,
                start_date:    startDate,
                end_date:      endDate,
                promotion_items: items.map(i => ({
                    product_id:     i.productId,
                    discount_value: i.discount,
                })),
            };
            if (isNew) {
                await postJson('/promotions', { ...body, store_code: storeCode });
                showToast('Promotion created successfully!');
            } else {
                await putJson(`/promotions/${data.promotionCode}`, body);
                showToast('Promotion updated successfully!');
            }
            onSaved();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Save failed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const addItem = () => setItems([...items, { id: Date.now(), productId: '', productName: '', discount: 0 }]);
    const removeItem = (id) => setItems(items.filter(i => i.id !== id));
    const updateItem = (id, field, value) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={storeLovOpen} onClose={() => setStoreLovOpen(false)} title="Store"
                columns={[{ key: 'store_code', label: 'Code' }, { key: 'name', label: 'Store' }, { key: 'category', label: 'Category' }]}
                data={stores}
                onSelect={r => { setStoreCode(r.store_code); setStoreLabel(`${r.store_code} – ${r.name}`); setStoreLovOpen(false); }} />
            <LovModal isOpen={productLovOpen} onClose={() => setProductLovOpen(false)} title="Product"
                columns={[{ key: 'product_id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'unit_price', label: 'Price' }]}
                data={products}
                onSelect={r => {
                    if (productLovIdx !== null) {
                        updateItem(productLovIdx, 'productId',   r.product_id);
                        updateItem(productLovIdx, 'productName', r.name);
                    }
                    setProductLovOpen(false);
                    setProductLovIdx(null);
                }} />

            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-current/75 hover:text-current font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Promotions
            </button>

            <Card className="p-5">
                <h3 className="font-bold text-current mb-4 text-lg">{isNew ? 'New Campaign' : `Edit: ${data.name}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Promotion Code">
                        <Input value={isNew ? '(assigned on save)' : data.promotionCode} readOnly
                            className="bg-slate-50 dark:bg-slate-800/50 text-current/60 font-mono" />
                    </FormField>

                    <FormField label="Campaign Name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Sale" />
                    </FormField>

                    <FormField label="Store" required>
                        {isNew ? (
                            <LovInput value={storeLabel} onLov={() => setStoreLovOpen(true)} placeholder="Select store..." />
                        ) : (
                            <Input value={storeLabel || data.storeName} readOnly
                                className="bg-slate-50 dark:bg-slate-800/50 text-current/60" />
                        )}
                    </FormField>

                    <FormField label="Discount Type" required>
                        <Select value={discountType} onChange={e => setDiscountType(e.target.value)}>
                            <option value="PERCENTAGE">Percentage</option>
                            <option value="FIXED_AMOUNT">Fixed Amount</option>
                        </Select>
                    </FormField>

                    <FormField label="Start Date" required>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </FormField>

                    <FormField label="End Date" required>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </FormField>
                </div>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader title="Promotion Items" action={
                    <Btn size="sm" variant="secondary" onClick={addItem}>
                        <Plus className="w-3.5 h-3.5" /> Add Product
                    </Btn>
                } />
                <Table headers={[{ label: 'Product' }, { label: 'Discount Value', right: true }, { label: '', center: true }]} minWidth="500px">
                    {items.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:border-red-400 dark:focus-within:border-red-500">
                                    <input readOnly value={it.productName} placeholder="Select product..."
                                        className="flex-1 min-w-0 px-3 py-1.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                                    <button onClick={() => { setProductLovIdx(it.id); setProductLovOpen(true); }}
                                        className="shrink-0 px-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-bold transition-colors border-l border-slate-700 dark:border-slate-600">LoV</button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <input type="number" min="0" value={it.discount}
                                    onChange={e => updateItem(it.id, 'discount', Number(e.target.value))}
                                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 dark:focus:border-red-500 text-right w-24" />
                            </td>
                            <td className="px-4 py-3 text-center">
                                <button onClick={() => removeItem(it.id)}
                                    className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-current/10 flex justify-end">
                    <Btn onClick={handleSave} disabled={saving} size="lg">
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save Campaign'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}
