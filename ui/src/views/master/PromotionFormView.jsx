import { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Btn, Card, CardHeader, Table, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { MOCK_STORES, MOCK_PRODUCTS } from '../../data/mockData';

export default function PromotionFormView({ onNavigateBack, showToast }) {
    const [items, setItems] = useState([{ id: 1, productId: '', productName: '', discount: 0 }]);
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [lovIdx, setLovIdx] = useState(null);
    const [store, setStore] = useState('');
    const [storeIsLov, setStoreIsLov] = useState(false);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const handleSave = () => {
        if (!store) return showToast('Please select a target store', 'error');
        if (!name.trim()) return showToast('Campaign Name is required', 'error');
        if (!startDate || !endDate) return showToast('Please specify both Start and End Dates', 'error');
        if (new Date(endDate) < new Date(startDate)) return showToast('End Date cannot be before Start Date', 'error');
        if (items.length === 0) return showToast('Must include at least one product in the campaign', 'error');
        if (items.some(i => !i.productName || i.discount <= 0)) return showToast('All products must have valid positive discounts', 'error');
        showToast('Promotion Campaign saved successfully!'); onNavigateBack();
    };
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={storeIsLov} onClose={() => setStoreIsLov(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store' }, { key: 'category', label: 'Category' }]}
                data={MOCK_STORES} onSelect={r => { setStore(`${r.id} – ${r.name}`); setStoreIsLov(false); }} />
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Product"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }]}
                data={MOCK_PRODUCTS} onSelect={r => { if (lovIdx !== null) { const n = [...items]; n[lovIdx].productName = r.name; n[lovIdx].productId = r.id; setItems(n); } setIsLovOpen(false); setLovIdx(null); }} />
            <button onClick={onNavigateBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium"><ArrowLeft className="w-4 h-4" /> Back</button>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Campaign Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Campaign Code">
                        <Input readOnly defaultValue="PROMO-2026-001" className="bg-slate-50 font-mono text-slate-500" />
                    </FormField>
                    <FormField label="Store" required>
                        <LovInput value={store} onLov={() => setStoreIsLov(true)} placeholder="Select store..." />
                    </FormField>
                    <FormField label="Campaign Name" required><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Sale" /></FormField>
                    <FormField label="Discount Type" required>
                        <Select><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed Amount</option></Select>
                    </FormField>
                    <FormField label="Start Date" required><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></FormField>
                    <FormField label="End Date" required><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></FormField>
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
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-red-400">
                                    <input readOnly value={it.productName} placeholder="Select product..." className="flex-1 min-w-0 px-3 py-1.5 text-sm outline-none bg-white" />
                                    <button onClick={() => { setLovIdx(i); setIsLovOpen(true); }} className="shrink-0 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors border-l border-slate-700">LoV</button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right"><input type="number" value={it.discount} onChange={e => { const n = [...items]; n[i].discount = Number(e.target.value); setItems(n); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 text-right w-24" /></td>
                            <td className="px-4 py-3 text-center"><button onClick={() => setItems(items.filter(x => x.id !== it.id))} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></td>
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
