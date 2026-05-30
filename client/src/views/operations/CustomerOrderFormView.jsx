import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, getApiErrorMessage } from '../../api/http';
import { orderHeaderSchema } from '../../schemas/operations';

export default function CustomerOrderFormView({ showToast, onNavigateBack }) {
    const onBack = onNavigateBack || (() => {});
    const [customers, setCustomers] = useState([]);
    const [stores, setStores] = useState([]);
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([{ id: 1, productId: '', productName: '', qty: 1, price: 0 }]);
    const [activeLov, setActiveLov] = useState(null);
    const [search, setSearch] = useState('');

    const { control, register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(orderHeaderSchema),
        defaultValues: { customer: '', store: '', deliveryAddress: '123 Sukhumvit Road' },
    });

    useEffect(() => {
        // Fetch customers, profiles, stores, and products from real db
        Promise.all([
            getJson('/customers'),
            getJson('/profiles'),
            getJson('/stores'),
            getJson('/store-products'),
        ]).then(([custs, profs, strs, prods]) => {
            const profileMap = new Map(profs.map(p => [p.profile_id, p]));
            setCustomers(custs.map(c => {
                const prof = profileMap.get(c.profile_id) || {};
                return {
                    id: c.customer_code,
                    name: prof.full_name || '—',
                    phone: prof.phone || '—'
                };
            }));
            setStores(strs.map(s => ({
                id: s.store_code,
                name: s.name,
                category: s.category || '—'
            })));
            setProducts(prods.map(p => ({
                id: p.product_id,
                name: p.name,
                price: parseFloat(p.unit_price || 0)
            })));
        }).catch(err => {
            console.error('Failed to load master records for order form:', err);
            showToast('Failed to load master records', 'error');
        });
    }, [showToast]);

    const total = items.reduce((s, i) => s + (i.qty * i.price), 0);

    const onSubmit = async (headerData) => {
        if (items.length === 0) return showToast('Order must contain at least one item', 'error');
        if (items.some(i => !i.productName || i.qty <= 0)) return showToast('Please select valid products with positive quantities', 'error');

        const customerCode = headerData.customer.split(' – ')[0];
        const storeCode = headerData.store.split(' – ')[0];

        const payload = {
            customer_code: customerCode,
            store_code: storeCode,
            address_snapshot: headerData.deliveryAddress,
            total_price: total,
            order_items: items.map(i => ({
                product_id: parseInt(i.productId, 10) || i.productId,
                quantity: i.qty,
                unit_price: i.price,
                extend_price: i.qty * i.price
            }))
        };

        try {
            await postJson('/orders', payload);
            showToast('Order saved successfully!');
            onBack();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Failed to place order'), 'error');
        }
    };

    const filteredItems = items.filter(it => 
        it.productName.toLowerCase().includes(search.toLowerCase()) ||
        String(it.productId).includes(search)
    );

    return (
        <div className="fade-in space-y-5">
            <Controller
                name="customer"
                control={control}
                render={({ field }) => (
                    <Controller
                        name="store"
                        control={control}
                        render={({ field: storeField }) => (
                            <LovModal isOpen={!!activeLov} onClose={() => setActiveLov(null)} title={activeLov?.type === 'product' ? 'Product' : activeLov?.type === 'store' ? 'Store' : 'Customer'}
                                columns={activeLov?.type === 'product' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }] : activeLov?.type === 'store' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }] : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }]}
                                data={activeLov?.type === 'product' ? products : activeLov?.type === 'store' ? stores : customers}
                                onSelect={r => {
                                    if (activeLov.type === 'product') { const n = [...items]; n[activeLov.index].productName = r.name; n[activeLov.index].price = r.price || 0; n[activeLov.index].productId = r.id; setItems(n); }
                                    else if (activeLov.type === 'store') { storeField.onChange(`${r.id} – ${r.name}`); }
                                    else { field.onChange(`${r.id} – ${r.name}`); }
                                    setActiveLov(null);
                                }} />
                        )}
                    />
                )}
            />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-bold transition-colors mb-2"><ArrowLeft className="w-4 h-4" /> Back to Orders</button>
            <PageHeader title="Customer Order" subtitle="Create a new order for a customer from a specific store" />
            <Card className="p-5">
                <h3 className="font-bold text-current mb-4">Order Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Order ID">
                        <Input 
                            value="ORD-AUTO (Assigned on save)" 
                            readOnly
                            className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300 font-mono"
                        />
                    </FormField>
                    <FormField label="Customer" required error={errors.customer?.message}>
                        <Controller
                            name="customer"
                            control={control}
                            render={({ field }) => (
                                <LovInput value={field.value} onLov={() => setActiveLov({ type: 'customer' })} placeholder="Select customer..." />
                            )}
                        />
                    </FormField>
                    <FormField label="Store" required error={errors.store?.message}>
                        <Controller
                            name="store"
                            control={control}
                            render={({ field }) => (
                                <LovInput value={field.value} onLov={() => setActiveLov({ type: 'store' })} placeholder="Select store..." />
                            )}
                        />
                    </FormField>
                    <FormField label="Delivery Address" required error={errors.deliveryAddress?.message}>
                        <Input {...register('deliveryAddress')} placeholder="123 Sukhumvit Road" />
                    </FormField>
                    <FormField label="Delivery Address Snapshot">
                        <textarea readOnly defaultValue="123 Sukhumvit Road" className="w-full min-w-0 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300 outline-none resize-none h-10" />
                    </FormField>
                    <FormField label="Payment Method" required>
                        <Select><option>Cash</option><option>PromptPay</option><option>Credit Card</option></Select>
                    </FormField>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 shadow-sm" />}
                    action={
                        <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), productId: '', productName: '', qty: 1, price: 0 }])}>
                            <Plus className="w-3.5 h-3.5" /> Add Item
                        </Btn>
                    } 
                />
                <Table headers={[{ label: 'Product' }, { label: 'Qty', center: true }, { label: 'Unit Price', right: true }, { label: 'Extended Price', right: true }, { label: '', center: true }]} minWidth="600px">
                    {filteredItems.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 min-w-[200px]">
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:border-red-400 dark:focus-within:border-red-500">
                                    <input readOnly value={it.productName} placeholder="Select product..." className="flex-1 min-w-0 px-3 py-1.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                                    <button onClick={() => setActiveLov({ type: 'product', index: items.indexOf(it) })} className="shrink-0 px-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-bold transition-colors border-l border-slate-700 dark:border-slate-600">LoV</button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center"><input type="number" min="1" value={it.qty} onChange={e => { const n = [...items]; const idx = items.indexOf(it); n[idx].qty = Math.max(1, Number(e.target.value)); setItems(n); }} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-red-400 dark:focus:border-red-500 w-16" /></td>
                            <Td right>฿{it.price}</Td>
                            <Td right bold>฿{it.qty * it.price}</Td>
                            <td className="px-4 py-3 text-center"><button onClick={() => setItems(items.filter(x => x.id !== it.id))} className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-current/10 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-gray-300 font-bold uppercase tracking-wide">Total Order</p>
                        <p className="text-3xl font-black text-current font-bold mono">฿{total}</p>
                    </div>
                    <Btn onClick={handleSubmit(onSubmit)} size="lg"><Save className="w-4 h-4" /> Place Order</Btn>
                </div>
            </Card>
        </div>
    );
}
