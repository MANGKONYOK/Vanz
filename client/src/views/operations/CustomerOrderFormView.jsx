import { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Check, Search } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { MOCK_CUSTOMERS, MOCK_STORES, MOCK_PRODUCTS } from '../../data/mockData';

export default function CustomerOrderFormView({ showToast, onNavigateBack }) {
    const onBack = onNavigateBack || (() => {});
    const [orderId, setOrderId] = useState('');
    const [autoId, setAutoId] = useState(true);
    const [items, setItems] = useState([{ id: 1, productId: '', productName: '', qty: 1, price: 0 }]);
    const [activeLov, setActiveLov] = useState(null);
    const [customer, setCustomer] = useState('');
    const [store, setStore] = useState('');
    const [search, setSearch] = useState('');
    const total = items.reduce((s, i) => s + (i.qty * i.price), 0);

    const displayId = autoId ? (orderId || 'ORD-AUTO') : orderId;
    const handleSave = () => {
        if (!customer) return showToast('Please select a customer', 'error');
        if (!store) return showToast('Please select a store to order from', 'error');
        if (items.length === 0) return showToast('Order must contain at least one item', 'error');
        if (items.some(i => !i.productName || i.qty <= 0)) return showToast('Please select valid products with positive quantities', 'error');
        showToast('Order saved successfully!'); setItems([{ id: 1, productId: '', productName: '', qty: 1, price: 0 }]); setCustomer(''); setStore('');
    };

    const filteredItems = items.filter(it => 
        it.productName.toLowerCase().includes(search.toLowerCase()) ||
        it.productId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!activeLov} onClose={() => setActiveLov(null)} title={activeLov?.type === 'product' ? 'Product' : activeLov?.type === 'store' ? 'Store' : 'Customer'}
                columns={activeLov?.type === 'product' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }] : activeLov?.type === 'store' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }] : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }]}
                data={activeLov?.type === 'product' ? MOCK_PRODUCTS : activeLov?.type === 'store' ? MOCK_STORES : MOCK_CUSTOMERS}
                onSelect={r => {
                    if (activeLov.type === 'product') { const n = [...items]; n[activeLov.index].productName = r.name; n[activeLov.index].price = r.price || 0; n[activeLov.index].productId = r.id; setItems(n); }
                    else if (activeLov.type === 'store') { setStore(`${r.id} – ${r.name}`); }
                    else { setCustomer(`${r.id} – ${r.name}`); }
                    setActiveLov(null);
                }} />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 transition-colors font-medium mb-2"><ArrowLeft className="w-4 h-4" /> Back to Orders</button>
            <PageHeader title="Customer Order" subtitle="Create a new order for a customer from a specific store" />
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <FormField label="Order ID" required>
                                <Input 
                                    value={displayId} 
                                    onChange={e => setOrderId(e.target.value.toUpperCase())} 
                                    placeholder="ORD-001" 
                                    readOnly={autoId}
                                    className={autoId ? 'bg-slate-50 text-slate-500 font-mono' : 'font-mono'}
                                />
                            </FormField>
                        </div>
                        <label className="flex items-center gap-2 mb-2.5 cursor-pointer select-none">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    checked={autoId} 
                                    onChange={e => setAutoId(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-5 h-5 border-2 border-slate-200 rounded-md peer-checked:bg-red-500 peer-checked:border-red-500 transition-all flex items-center justify-center text-white">
                                    <Check size={12} strokeWidth={4} className={autoId ? 'scale-100' : 'scale-0'} />
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-600 font-sans">Auto</span>
                        </label>
                    </div>
                    <FormField label="Customer" required>
                        <LovInput value={customer} onLov={() => setActiveLov({ type: 'customer' })} placeholder="Select customer..." />
                    </FormField>
                    <FormField label="Store" required>
                        <LovInput value={store} onLov={() => setActiveLov({ type: 'store' })} placeholder="Select store..." />
                    </FormField>
                    <FormField label="Delivery Address" required>
                        <Input defaultValue="123 Sukhumvit Road" />
                    </FormField>
                    <FormField label="Delivery Address Snapshot">
                        <textarea readOnly defaultValue="123 Sukhumvit Road" className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 outline-none resize-none h-10" />
                    </FormField>
                    <FormField label="Payment Method" required>
                        <Select><option>Cash</option><option>PromptPay</option><option>Credit Card</option></Select>
                    </FormField>
                    <FormField label="Date">
                        <Input type="date" defaultValue="2026-03-23" />
                    </FormField>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white border-slate-200 h-10 shadow-sm" />}
                    action={
                        <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), productId: '', productName: '', qty: 1, price: 0 }])}>
                            <Plus className="w-3.5 h-3.5" /> Add Item
                        </Btn>
                    } 
                />
                <Table headers={[{ label: 'Product' }, { label: 'Qty', center: true }, { label: 'Unit Price', right: true }, { label: 'Extended Price', right: true }, { label: '', center: true }]} minWidth="600px">
                    {filteredItems.map((it, i) => (
                        <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 min-w-[200px]">
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-red-400">
                                    <input readOnly value={it.productName} placeholder="Select product..." className="flex-1 min-w-0 px-3 py-1.5 text-sm outline-none bg-white" />
                                    <button onClick={() => setActiveLov({ type: 'product', index: items.indexOf(it) })} className="shrink-0 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors border-l border-slate-700">LoV</button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center"><input type="number" min="1" value={it.qty} onChange={e => { const n = [...items]; const idx = items.indexOf(it); n[idx].qty = Math.max(1, Number(e.target.value)); setItems(n); }} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-red-400 w-16" /></td>
                            <Td right>฿{it.price}</Td>
                            <Td right bold>฿{it.qty * it.price}</Td>
                            <td className="px-4 py-3 text-center"><button onClick={() => setItems(items.filter(x => x.id !== it.id))} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Order Total</p>
                        <p className="text-3xl font-black text-slate-900 mono">฿{total}</p>
                    </div>
                    <Btn onClick={handleSave} size="lg"><Save className="w-4 h-4" /> Place Order</Btn>
                </div>
            </Card>
        </div>
    );
}
