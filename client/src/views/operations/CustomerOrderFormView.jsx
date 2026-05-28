import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, getApiErrorMessage } from '../../api/http';

function extractCode(value) {
    return String(value || '').split(' – ')[0].trim();
}

export default function CustomerOrderFormView({ showToast, onNavigateBack }) {
    const onBack = onNavigateBack || (() => {});

    // LoV data loaded from API
    const [customers, setCustomers] = useState([]);
    const [stores,    setStores]    = useState([]);
    const [products,  setProducts]  = useState([]);

    // Form state
    const [customer, setCustomer] = useState('');
    const [store,    setStore]    = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState(null);
    const [addressSnapshot, setAddressSnapshot] = useState('');
    const [items, setItems]       = useState([{ id: 1, productId: '', productName: '', qty: 1, price: 0 }]);
    const [activeLov, setActiveLov] = useState(null); // null | 'customer' | 'store' | { type:'product', index }
    const [saving, setSaving]     = useState(false);

    const total = items.reduce((s, i) => s + (Number(i.qty) * Number(i.price)), 0);

    // Load LoV data on mount
    useEffect(() => {
        Promise.all([
            getJson('/customers').catch(() => []),
            getJson('/profiles').catch(() => []),
            getJson('/stores').catch(() => []),
            getJson('/store-products').catch(() => []),
        ]).then(([custs, profiles, storeList, productList]) => {
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            setCustomers(custs.map(c => {
                const prof = profileMap.get(c.profile_id) || {};
                return { id: c.customer_code, name: prof.full_name || c.customer_code, phone: prof.phone || '-' };
            }));
            const storeMap = new Map(storeList.map(s => [s.store_id, s]));
            setStores(storeList.map(s => ({
                id: s.store_code, storeId: s.store_id, name: s.name,
                category: s.category ? s.category.charAt(0) + s.category.slice(1).toLowerCase().replace(/_/g, ' ') : '-',
            })));
            setProducts(productList.map(p => {
                const store = storeMap.get(p.store_id) || {};
                return {
                    id: String(p.product_id), name: p.name,
                    price: Number(p.unit_price || 0),
                    storeId: p.store_id, storeCode: store.store_code,
                };
            }));
        }).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Filter products to the selected store
    const filteredProducts = selectedStoreId
        ? products.filter(p => p.storeId === selectedStoreId)
        : products;

    const handleSave = async () => {
        if (!customer)          return showToast('Please select a customer', 'error');
        if (!store)             return showToast('Please select a store', 'error');
        if (!addressSnapshot.trim()) return showToast('Delivery address is required', 'error');
        if (items.length === 0) return showToast('Order must have at least one item', 'error');
        if (items.some(i => !i.productId || Number(i.qty) <= 0))
            return showToast('Please select valid products with positive quantities', 'error');
        setSaving(true);
        try {
            await postJson('/orders', {
                customer_code:    extractCode(customer),
                store_code:       extractCode(store),
                address_snapshot: addressSnapshot.trim(),
                total_price:      total,
                order_items: items.map(i => ({
                    product_id:   Number(i.productId),
                    quantity:     Number(i.qty),
                    unit_price:   Number(i.price),
                    extend_price: Number(i.qty) * Number(i.price),
                })),
            });
            showToast('Order created successfully!');
            setCustomer(''); setStore(''); setSelectedStoreId(null);
            setAddressSnapshot('');
            setItems([{ id: 1, productId: '', productName: '', qty: 1, price: 0 }]);
        } catch (e) {
            showToast(getApiErrorMessage(e, 'Unable to create order'), 'error');
        } finally {
            setSaving(false);
        }
    };

    // LoV select handler
    const handleLovSelect = (r) => {
        if (activeLov === 'customer') {
            setCustomer(`${r.id} – ${r.name}`);
        } else if (activeLov === 'store') {
            setStore(`${r.id} – ${r.name}`);
            setSelectedStoreId(r.storeId);
            // Clear items that belong to a different store
            setItems([{ id: Date.now(), productId: '', productName: '', qty: 1, price: 0 }]);
        } else if (activeLov?.type === 'product') {
            const n = [...items];
            n[activeLov.index] = { ...n[activeLov.index], productId: r.id, productName: r.name, price: r.price };
            setItems(n);
        }
        setActiveLov(null);
    };

    const lovTitle   = activeLov === 'customer' ? 'Customer' : activeLov === 'store' ? 'Store' : 'Product';
    const lovColumns = activeLov === 'customer'
        ? [{ key: 'id', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }]
        : activeLov === 'store'
        ? [{ key: 'id', label: 'Code' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]
        : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }];
    const lovData    = activeLov === 'customer' ? customers : activeLov === 'store' ? stores : filteredProducts;

    return (
        <div className="fade-in space-y-5">
            <LovModal
                isOpen={!!activeLov}
                onClose={() => setActiveLov(null)}
                title={lovTitle}
                columns={lovColumns}
                data={lovData}
                onSelect={handleLovSelect}
            />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Orders
            </button>
            <PageHeader title="Customer Order" subtitle="Create a new order for a customer from a specific store" />

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Customer" required>
                        <LovInput value={customer} onLov={() => setActiveLov('customer')} placeholder="Select customer…" />
                    </FormField>
                    <FormField label="Store" required>
                        <LovInput value={store} onLov={() => setActiveLov('store')} placeholder="Select store…" />
                    </FormField>
                    <div className="md:col-span-2">
                        <FormField label="Delivery Address" required>
                            <Input
                                value={addressSnapshot}
                                onChange={e => setAddressSnapshot(e.target.value)}
                                placeholder="Full delivery address for this order"
                            />
                        </FormField>
                    </div>
                </div>
            </Card>

            {/* ── Items ──────────────────────────────────────────────────────── */}
            <Card className="overflow-hidden">
                <CardHeader title="Order Items" action={
                    <Btn size="sm" variant="secondary"
                        onClick={() => setItems([...items, { id: Date.now(), productId: '', productName: '', qty: 1, price: 0 }])}>
                        <Plus className="w-3.5 h-3.5" /> Add Item
                    </Btn>
                } />
                <Table
                    headers={[
                        { label: 'Product' }, { label: 'Unit Price', right: true },
                        { label: 'Qty', center: true }, { label: 'Subtotal', right: true }, { label: '', center: true },
                    ]}
                    minWidth="600px"
                >
                    {items.map((item, i) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <Td>
                                <LovInput
                                    value={item.productName ? `${item.productId} – ${item.productName}` : ''}
                                    onLov={() => {
                                        if (!store) return showToast('Please select a store first', 'error');
                                        setActiveLov({ type: 'product', index: i });
                                    }}
                                    placeholder={store ? 'Select product…' : 'Select store first'}
                                />
                            </Td>
                            <td className="px-4 py-3 text-right">
                                <span className="text-sm font-mono text-slate-700">฿{Number(item.price).toLocaleString()}</span>
                            </td>
                            <Td center>
                                <input type="number" min="1" value={item.qty}
                                    onChange={e => { const n = [...items]; n[i].qty = Number(e.target.value); setItems(n); }}
                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-red-400 w-20" />
                            </Td>
                            <td className="px-4 py-3 text-right font-bold mono text-sm">
                                ฿{(Number(item.qty) * Number(item.price)).toLocaleString()}
                            </td>
                            <Td center>
                                <button onClick={() => setItems(items.filter((_, j) => j !== i))}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </Td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Price</p>
                        <p className="text-3xl font-black text-slate-900 mono">฿{total.toLocaleString()}</p>
                    </div>
                    <Btn onClick={handleSave} size="lg" disabled={saving}>
                        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Create Order'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}
