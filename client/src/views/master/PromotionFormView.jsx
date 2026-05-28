import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Btn, Card, CardHeader, Table, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, getApiErrorMessage } from '../../api/http';

function extractCode(value) {
    return String(value || '').split(' – ')[0].trim();
}

export default function PromotionFormView({ onNavigateBack, showToast }) {
    const [items, setItems]           = useState([{ id: 1, productId: '', productName: '', discount: 0 }]);
    const [isLovOpen, setIsLovOpen]   = useState(false);
    const [lovIdx, setLovIdx]         = useState(null);
    const [store, setStore]           = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState(null);
    const [storeIsLov, setStoreIsLov] = useState(false);
    const [name, setName]             = useState('');
    const [discountType, setDiscountType] = useState('PERCENTAGE');
    const [startDate, setStartDate]   = useState('');
    const [endDate, setEndDate]       = useState('');

    // Live LoV data
    const [stores,   setStores]   = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        Promise.all([
            getJson('/stores').catch(() => []),
            getJson('/store-products').catch(() => []),
        ]).then(([storeList, productList]) => {
            setStores(storeList.map(s => ({
                id: s.store_code, storeId: s.store_id,
                name: s.name,
                category: s.category || '-',
            })));
            setProducts(productList.map(p => ({
                id: String(p.product_id),
                name: p.name,
                price: Number(p.unit_price || 0),
                storeId: p.store_id,
            })));
        }).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Filter products to selected store
    const filteredProducts = selectedStoreId
        ? products.filter(p => p.storeId === selectedStoreId)
        : products;

    const handleSave = async () => {
        if (!store) return showToast('Please select a target store', 'error');
        if (!name.trim()) return showToast('Campaign Name is required', 'error');
        if (!startDate || !endDate) return showToast('Please specify both Start and End Dates', 'error');
        if (new Date(endDate) < new Date(startDate)) return showToast('End Date cannot be before Start Date', 'error');
        if (items.length === 0) return showToast('Must include at least one product in the campaign', 'error');
        if (items.some(i => !i.productId || i.discount <= 0)) return showToast('All products must have valid positive discounts', 'error');
        try {
            await postJson('/promotions', {
                store_code: extractCode(store),
                name: name.trim(),
                start_date: startDate,
                end_date: endDate,
                discount_type: discountType,
                promotion_items: items.map((item) => ({
                    product_id:    Number(item.productId),
                    discount_value: Number(item.discount),
                })),
            });
            showToast('Promotion Campaign saved successfully!');
            onNavigateBack();
        } catch (error) {
            showToast(getApiErrorMessage(error, 'Unable to save promotion'), 'error');
        }
    };

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={storeIsLov} onClose={() => setStoreIsLov(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store' }, { key: 'category', label: 'Category' }]}
                data={stores}
                onSelect={r => {
                    setStore(`${r.id} – ${r.name}`);
                    setSelectedStoreId(r.storeId);
                    setItems([{ id: Date.now(), productId: '', productName: '', discount: 0 }]);
                    setStoreIsLov(false);
                }} />
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Product"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }]}
                data={filteredProducts}
                onSelect={r => {
                    if (lovIdx !== null) {
                        const n = [...items];
                        n[lovIdx].productName = r.name;
                        n[lovIdx].productId   = r.id;
                        setItems(n);
                    }
                    setIsLovOpen(false);
                    setLovIdx(null);
                }} />
            <button onClick={onNavigateBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Campaign Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Store" required>
                        <LovInput value={store} onLov={() => setStoreIsLov(true)} placeholder="Select store..." />
                    </FormField>
                    <FormField label="Campaign Name" required>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Sale" />
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
                    <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), productId: '', productName: '', discount: 0 }])}>
                        <Plus className="w-3.5 h-3.5" /> Add Product
                    </Btn>
                } />
                <Table headers={[{ label: 'Product' }, { label: 'Discount Value', right: true }, { label: '', center: true }]} minWidth="500px">
                    {items.map((it, i) => (
                        <tr key={it.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                                <LovInput
                                    value={it.productName ? `${it.productId} – ${it.productName}` : ''}
                                    onLov={() => {
                                        if (!store) return showToast('Please select a store first', 'error');
                                        setLovIdx(i);
                                        setIsLovOpen(true);
                                    }}
                                    placeholder={store ? 'Select product…' : 'Select store first'}
                                />
                            </td>
                            <td className="px-4 py-3 text-right">
                                <input
                                    type="number" value={it.discount}
                                    onChange={e => { const n = [...items]; n[i].discount = Number(e.target.value); setItems(n); }}
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 text-right w-24"
                                />
                            </td>
                            <td className="px-4 py-3 text-center">
                                <button onClick={() => setItems(items.filter(x => x.id !== it.id))}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <Btn onClick={handleSave} size="lg"><Save className="w-4 h-4" /> Save Campaign</Btn>
                </div>
            </Card>
        </div>
    );
}
