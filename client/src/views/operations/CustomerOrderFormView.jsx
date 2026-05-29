import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Search, RefreshCw } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';

const MUTABLE_STATUS = ['pending', 'confirmed', 'cancelled'];

export default function CustomerOrderFormView({ data = {}, onBack, onSaved, showToast }) {
    const isNew = !data.id;

    // Header state
    const [customerCode,  setCustomerCode]  = useState(data.customerCode    || '');
    const [customerLabel, setCustomerLabel] = useState('');
    const [storeCode,     setStoreCode]     = useState(data.storeCode       || '');
    const [storeLabel,    setStoreLabel]    = useState('');
    const [addressSnap,   setAddressSnap]   = useState(data.addressSnapshot || '');
    const [status,        setStatus]        = useState(data.status          || 'pending');

    // Line items
    const [items, setItems] = useState(() =>
        isNew ? [{ id: 1, productId: '', productName: '', qty: 1, price: 0 }]
              : (data.orderItems || []).map((it, idx) => ({
                    id:          idx + 1,
                    productId:   it.product_id,
                    productName: '',  // resolved below
                    qty:         Number(it.quantity),
                    price:       Number(it.unit_price),
                }))
    );

    // LoV data
    const [customers, setCustomers] = useState([]);
    const [stores,    setStores]    = useState([]);
    const [products,  setProducts]  = useState([]);

    const [activeLov,  setActiveLov]  = useState(null);
    const [itemSearch, setItemSearch] = useState('');
    const [saving,     setSaving]     = useState(false);

    useEffect(() => {
        Promise.all([
            getJson('/customers'),
            getJson('/profiles'),
            getJson('/stores'),
            getJson('/store-products'),
        ]).then(([custs, profs, storeList, prodList]) => {
            const profMap = new Map(profs.map(p => [p.profile_id, p]));
            const custsWithName = custs.map(c => ({
                ...c,
                full_name: profMap.get(c.profile_id)?.full_name || '—',
                phone:     profMap.get(c.profile_id)?.phone     || '',
            }));
            setCustomers(custsWithName);
            setStores(storeList);
            setProducts(prodList);

            // Pre-fill labels for edit mode
            if (!isNew) {
                const cust  = custsWithName.find(c => c.customer_code === data.customerCode);
                const store = storeList.find(s => s.store_code === data.storeCode);
                if (cust)  setCustomerLabel(`${cust.customer_code} – ${cust.full_name}`);
                if (store) setStoreLabel(`${store.store_code} – ${store.name}`);

                // Resolve product names for existing items
                const prodMap = new Map(prodList.map(p => [p.product_id, p]));
                setItems(prev => prev.map(it => ({
                    ...it,
                    productName: prodMap.get(it.productId)?.name || `#${it.productId}`,
                })));
            }
        }).catch(() => {});
    }, []);

    const total = items.reduce((s, i) => s + (i.qty * i.price), 0);

    const validate = () => {
        if (!customerCode)          return 'Customer is required';
        if (!storeCode)             return 'Store is required';
        if (!addressSnap.trim())    return 'Delivery Address is required';
        if (items.length === 0)     return 'Order must contain at least one item';
        if (items.some(i => !i.productId)) return 'All items must have a product selected';
        if (items.some(i => i.qty <= 0))   return 'Quantities must be greater than zero';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) return showToast(err, 'error');
        setSaving(true);
        try {
            if (isNew) {
                await postJson('/orders', {
                    customer_code:    customerCode,
                    store_code:       storeCode,
                    total_price:      total,
                    address_snapshot: addressSnap.trim(),
                    order_items:      items.map(i => ({
                        product_id:   i.productId,
                        quantity:     i.qty,
                        unit_price:   i.price,
                        extend_price: i.qty * i.price,
                    })),
                });
                showToast('Order placed successfully!');
            } else {
                await putJson(`/orders/${data.orderCode}`, {
                    status:           status,
                    address_snapshot: addressSnap.trim(),
                    total_price:      total,
                    order_items:      items.map(i => ({
                        product_id:   i.productId,
                        quantity:     i.qty,
                        unit_price:   i.price,
                        extend_price: i.qty * i.price,
                    })),
                });
                showToast('Order updated successfully!');
            }
            onSaved();
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Save failed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const addItem    = () => setItems([...items, { id: Date.now(), productId: '', productName: '', qty: 1, price: 0 }]);
    const removeItem = (id) => setItems(items.filter(i => i.id !== id));
    const updateItem = (id, field, value) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

    const filteredItems = items.filter(it =>
        it.productName.toLowerCase().includes(itemSearch.toLowerCase())
    );

    // Filtered products for LoV: if store is selected, show only that store's products
    const lovProducts = storeCode
        ? products.filter(p => {
            const storeObj = stores.find(s => s.store_code === storeCode);
            return storeObj ? p.store_id === storeObj.store_id : true;
          })
        : products;

    return (
        <div className="fade-in space-y-5">
            {/* LoVs */}
            <LovModal isOpen={activeLov?.type === 'customer'} onClose={() => setActiveLov(null)} title="Customer"
                columns={[{ key: 'customer_code', label: 'Code' }, { key: 'full_name', label: 'Name' }, { key: 'phone', label: 'Phone' }]}
                data={customers}
                onSelect={r => {
                    setCustomerCode(r.customer_code);
                    setCustomerLabel(`${r.customer_code} – ${r.full_name}`);
                    setActiveLov(null);
                }} />
            <LovModal isOpen={activeLov?.type === 'store'} onClose={() => setActiveLov(null)} title="Store"
                columns={[{ key: 'store_code', label: 'Code' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={stores}
                onSelect={r => {
                    setStoreCode(r.store_code);
                    setStoreLabel(`${r.store_code} – ${r.name}`);
                    setActiveLov(null);
                }} />
            <LovModal isOpen={activeLov?.type === 'product'} onClose={() => setActiveLov(null)} title="Product"
                columns={[{ key: 'product_id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'unit_price', label: 'Price' }]}
                data={lovProducts}
                onSelect={r => {
                    if (activeLov.itemId != null) {
                        updateItem(activeLov.itemId, 'productId',   r.product_id);
                        updateItem(activeLov.itemId, 'productName', r.name);
                        updateItem(activeLov.itemId, 'price',       Number(r.unit_price));
                    }
                    setActiveLov(null);
                }} />

            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-current/75 hover:text-current font-bold transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" /> Back to Orders
            </button>
            <PageHeader
                title={isNew ? 'Customer Order' : `Order: ${data.orderCode}`}
                subtitle={isNew ? 'Create a new order for a customer' : `Status: ${data.status}`}
            />

            <Card className="p-5">
                <h3 className="font-bold text-current mb-4">Order Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Order Code">
                        <Input value={isNew ? '(assigned on save)' : data.orderCode} readOnly
                            className="bg-slate-50 dark:bg-slate-800/50 text-current/60 font-mono" />
                    </FormField>

                    <FormField label="Customer" required>
                        {isNew ? (
                            <LovInput value={customerLabel} onLov={() => setActiveLov({ type: 'customer' })} placeholder="Select customer..." />
                        ) : (
                            <Input value={customerLabel} readOnly className="bg-slate-50 dark:bg-slate-800/50 text-current/60" />
                        )}
                    </FormField>

                    <FormField label="Store" required>
                        {isNew ? (
                            <LovInput value={storeLabel} onLov={() => setActiveLov({ type: 'store' })} placeholder="Select store..." />
                        ) : (
                            <Input value={storeLabel} readOnly className="bg-slate-50 dark:bg-slate-800/50 text-current/60" />
                        )}
                    </FormField>

                    {!isNew && (
                        <FormField label="Status">
                            <Select value={status} onChange={e => setStatus(e.target.value)}>
                                {MUTABLE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </FormField>
                    )}

                    <div className={isNew ? 'md:col-span-3' : 'md:col-span-2'}>
                        <FormField label="Delivery Address" required>
                            <Input value={addressSnap} onChange={e => setAddressSnap(e.target.value)} placeholder="Full delivery address" />
                        </FormField>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader
                    search={<Input icon={Search} placeholder="Search product..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="h-10 shadow-sm" />}
                    action={<Btn size="sm" variant="secondary" onClick={addItem}><Plus className="w-3.5 h-3.5" /> Add Item</Btn>}
                />
                <Table headers={[{ label: 'Product' }, { label: 'Qty', center: true }, { label: 'Unit Price', right: true }, { label: 'Extended', right: true }, { label: '', center: true }]} minWidth="600px">
                    {filteredItems.map(it => (
                        <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 min-w-[200px]">
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:border-red-400 dark:focus-within:border-red-500">
                                    <input readOnly value={it.productName} placeholder="Select product..."
                                        className="flex-1 min-w-0 px-3 py-1.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                                    <button onClick={() => setActiveLov({ type: 'product', itemId: it.id })}
                                        className="shrink-0 px-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-bold transition-colors border-l border-slate-700 dark:border-slate-600">LoV</button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                                <input type="number" min="1" value={it.qty}
                                    onChange={e => updateItem(it.id, 'qty', Math.max(1, Number(e.target.value)))}
                                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-red-400 dark:focus:border-red-500 w-16" />
                            </td>
                            <Td right>฿{Number(it.price).toLocaleString()}</Td>
                            <Td right bold>฿{(it.qty * it.price).toLocaleString()}</Td>
                            <td className="px-4 py-3 text-center">
                                <button onClick={() => removeItem(it.id)}
                                    className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-current/10 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-current/60 font-bold uppercase tracking-wide">Total Order</p>
                        <p className="text-3xl font-black text-current mono">฿{total.toLocaleString()}</p>
                    </div>
                    <Btn onClick={handleSave} disabled={saving} size="lg">
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : isNew ? 'Place Order' : 'Save Order'}
                    </Btn>
                </div>
            </Card>
        </div>
    );
}
