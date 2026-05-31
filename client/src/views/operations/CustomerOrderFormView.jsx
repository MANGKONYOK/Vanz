import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Td, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { getJson, postJson, putJson, getApiErrorMessage } from '../../api/http';
import { orderHeaderSchema } from '../../schemas/operations';
import { nextCode } from '../../api/codeGen';

function formatPhone(phone) {
    if (!phone) return '—';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+66')) {
        cleaned = '0' + cleaned.slice(3);
    }
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.startsWith('0') && cleaned.length === 9) {
        if (cleaned.startsWith('02')) {
            return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
        } else {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
    }
    return phone;
}

export default function CustomerOrderFormView({ data, showToast, onNavigateBack }) {
    const onBack = onNavigateBack || (() => {});
    const [customers, setCustomers] = useState([]);
    const [stores, setStores] = useState([]);
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([{ id: 1, productId: '', productName: '', qty: 1, price: 0 }]);
    const [activeLov, setActiveLov] = useState(null);
    const [search, setSearch] = useState('');
    const [addressSnapshot, setAddressSnapshot] = useState('');

    const [previewCode, setPreviewCode] = useState('…');
    const [isAuto, setIsAuto] = useState(true);
    const [customCode, setCustomCode] = useState('');

    const { control, register, handleSubmit, setValue, watch, getValues, reset, formState: { errors } } = useForm({
        resolver: zodResolver(orderHeaderSchema),
        defaultValues: { customer: '', store: '', deliveryAddress: '', status: 'PENDING' },
    });

    const watchedStatus = watch('status');
    const isNew = !data;
    const isEditable = isNew || (watchedStatus || 'PENDING').toUpperCase() === 'PENDING';

    useEffect(() => {
        const orderPromise = data ? getJson(`/orders?order_code=${data.id}`) : Promise.resolve([]);
        // Fetch customers, profiles, stores, products, and addresses from real db
        Promise.all([
            getJson('/customers'),
            getJson('/profiles'),
            getJson('/stores'),
            getJson('/store-products'),
            getJson('/orders').catch(() => []),
            getJson('/addresses').catch(() => []),
            orderPromise,
        ]).then(([custs, profs, strs, prods, ords, addressesRes, orderRes]) => {
            const profileMap = new Map(profs.map(p => [p.profile_id, p]));
            const addressMap = new Map((addressesRes || []).map(a => [a.address_id, a]));
            setCustomers(custs.map(c => {
                const prof = profileMap.get(c.profile_id) || {};
                const addr = addressMap.get(c.address_id) || {};
                const formattedAddr = addr.address_line_1 
                    ? `${addr.address_line_1}${addr.address_line_2 ? ', ' + addr.address_line_2 : ''}, ${addr.city}, ${addr.province || ''}, ${addr.country_code}`.replace(/,\s*,/g, ',').trim()
                    : '';
                return {
                    id: c.customer_code,
                    name: prof.full_name || '—',
                    phone: formatPhone(prof.phone),
                    address: formattedAddr
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

            const codes = ords.map(o => o.order_code);
            setPreviewCode(nextCode(codes, 'ORD-', 6));

            if (data && orderRes.length > 0) {
                const fullOrder = orderRes[0];
                
                // Find store code and name
                const matchingStore = strs.find(s => s.store_id === fullOrder.store_id);
                const storeVal = matchingStore ? `${matchingStore.store_code} – ${matchingStore.name}` : '';
                
                // Find customer code and name
                const matchingCust = custs.find(c => c.customer_id === fullOrder.customer_id);
                const prof = matchingCust ? profileMap.get(matchingCust.profile_id) : null;
                const custVal = matchingCust ? `${matchingCust.customer_code} – ${prof?.full_name || '—'}` : '';

                reset({
                    customer: custVal,
                    store: storeVal,
                    deliveryAddress: fullOrder.address_snapshot || '',
                    status: (fullOrder.status || 'PENDING').toUpperCase(),
                });
                
                setAddressSnapshot(fullOrder.address_snapshot || '');

                // Load items
                const mappedItems = (fullOrder.order_items || []).map((it, index) => {
                    const prod = prods.find(p => String(p.product_id) === String(it.product_id));
                    return {
                        id: it.order_item_id || index,
                        productId: it.product_id,
                        productName: prod ? prod.name : '—',
                        qty: parseInt(it.quantity, 10) || 1,
                        price: parseFloat(it.unit_price || 0),
                    };
                });
                setItems(mappedItems);
                setIsAuto(false);
                setPreviewCode(fullOrder.order_code);
            }
        }).catch(err => {
            console.error('Failed to load master records for order form:', err);
            showToast('Failed to load master records', 'error');
        });
    }, [data, showToast, reset]);

    const total = items.reduce((s, i) => s + (i.qty * i.price), 0);

    const onSubmit = async () => {
        const formValues = getValues();
        if (isNew && !isAuto) {
            const trimmed = customCode.trim();
            if (!trimmed) return showToast('Custom Order ID is required when Auto is unchecked', 'error');
            if (!/^ORD-\d{6}$/.test(trimmed)) return showToast('Order ID must be in the format ORD-000000 (ORD- followed by 6 digits)', 'error');
        }
        if (items.length === 0) return showToast('Order must contain at least one item', 'error');
        if (items.some(i => !i.productName || i.qty <= 0)) return showToast('Please select valid products with positive quantities', 'error');

        const customerCode = (formValues.customer || '').split(' – ')[0];
        const storeCode = (formValues.store || '').split(' – ')[0];

        const roundedTotal = Math.round((total + Number.EPSILON) * 100) / 100;
        const payload = {
            customer_code: customerCode,
            store_code: storeCode,
            address_snapshot: formValues.deliveryAddress || '',
            total_price: roundedTotal,
            status: formValues.status || 'PENDING',
             order_items: items.map(i => {
                const itemPrice = Math.round((parseFloat(i.price) + Number.EPSILON) * 100) / 100;
                const extPrice = Math.round(((parseInt(i.qty, 10) * itemPrice) + Number.EPSILON) * 100) / 100;
                return {
                    product_id: parseInt(i.productId, 10) || i.productId,
                    quantity: parseInt(i.qty, 10) || 1,
                    unit_price: itemPrice,
                    extend_price: extPrice
                };
            })
        };

        try {
            if (isNew) {
                payload.code = isAuto ? previewCode : customCode.trim();
                await postJson('/orders', payload);
                showToast('Order saved successfully!');
            } else {
                await putJson(`/orders/${data.id}`, payload);
                showToast('Order updated successfully!');
            }
            onBack();
        } catch (err) {
            showToast(getApiErrorMessage(err, isNew ? 'Failed to place order' : 'Failed to update order'), 'error');
        }
    };

    const filteredItems = items.filter(it => 
        it.productName.toLowerCase().includes(search.toLowerCase()) ||
        String(it.productId).includes(search)
    );

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!activeLov} onClose={() => setActiveLov(null)} title={activeLov?.type === 'product' ? 'Product' : activeLov?.type === 'store' ? 'Store' : 'Customer'}
                columns={activeLov?.type === 'product' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }] : activeLov?.type === 'store' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }] : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }]}
                data={activeLov?.type === 'product' ? products : activeLov?.type === 'store' ? stores : customers}
                onSelect={r => {
                    if (activeLov.type === 'product') { const n = [...items]; n[activeLov.index].productName = r.name; n[activeLov.index].price = r.price || 0; n[activeLov.index].productId = r.id; setItems(n); }
                    else if (activeLov.type === 'store') { setValue('store', `${r.id} – ${r.name}`); }
                    else { 
                        setValue('customer', `${r.id} – ${r.name}`); 
                        if (isNew) {
                            setValue('deliveryAddress', r.address || '');
                        }
                    }
                    setActiveLov(null);
                }} />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-bold transition-colors mb-2"><ArrowLeft className="w-4 h-4" /> Back to Orders</button>
            <PageHeader 
                title={isNew ? "Customer Order" : `Edit Order: ${data.id}`} 
                subtitle={isNew ? "Create a new order for a customer from a specific store" : "Modify details of an existing customer order"} 
            />
            <Card className="p-5">
                <h3 className="font-bold text-current mb-4">Order Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Order ID" required>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                value={isNew ? (isAuto ? previewCode : customCode) : previewCode}
                                onChange={e => setCustomCode(e.target.value)}
                                readOnly={!isNew || isAuto}
                                className={`font-mono flex-1 ${(!isNew || isAuto) ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300' : ''}`}
                                placeholder="ORD-000001"
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
                    <FormField label="Customer" required error={errors.customer?.message}>
                        <Controller
                            name="customer"
                            control={control}
                            render={({ field }) => (
                                <LovInput value={field.value} onLov={() => isEditable && setActiveLov({ type: 'customer' })} placeholder="Select customer..." disabled={!isEditable} />
                            )}
                        />
                    </FormField>
                    <FormField label="Store" required error={errors.store?.message}>
                        <Controller
                            name="store"
                            control={control}
                            render={({ field }) => (
                                <LovInput value={field.value} onLov={() => isEditable && setActiveLov({ type: 'store' })} placeholder="Select store..." disabled={!isEditable} />
                            )}
                        />
                    </FormField>
                    <FormField label="Delivery Address" required error={errors.deliveryAddress?.message}>
                        <Input {...register('deliveryAddress')} placeholder="Enter delivery address..." disabled={!isEditable} className={!isEditable ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : ''} />
                    </FormField>
                    <FormField label="Delivery Address Snapshot">
                        <Input readOnly value={isNew ? "No snapshot saved yet." : addressSnapshot} className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300" />
                    </FormField>
                    <FormField label="Status" required={!isNew} error={errors.status?.message}>
                        {isNew ? (
                            <Input readOnly value="Pending" className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-300 cursor-not-allowed font-medium" />
                        ) : (
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onChange={e => field.onChange(e.target.value)}>
                                        <option value="PENDING">Pending</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="PREPARING">Preparing</option>
                                        <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                                        <option value="PICKED_UP">Picked Up</option>
                                        <option value="DISPATCHED">Dispatched</option>
                                        <option value="DELIVERING">Delivering</option>
                                        <option value="DELIVERED">Delivered</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                        <option value="FAILED">Failed</option>
                                    </Select>
                                )}
                            />
                        )}
                    </FormField>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} className="h-10 shadow-sm" />}
                    action={
                        isEditable && (
                            <Btn size="sm" variant="secondary" onClick={() => setItems([...items, { id: Date.now(), productId: '', productName: '', qty: 1, price: 0 }])}>
                                <Plus className="w-3.5 h-3.5" /> Add Item
                            </Btn>
                        )
                    } 
                />
                <Table headers={[{ label: 'Product' }, { label: 'Qty', center: true }, { label: 'Unit Price', right: true }, { label: 'Extended Price', right: true }, { label: '', center: true }]} minWidth="600px">
                    {filteredItems.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 min-w-[200px]">
                                <div className={`flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 ${!isEditable ? 'opacity-65 bg-slate-50 dark:bg-slate-800/50' : 'focus-within:border-red-400 dark:focus-within:border-red-500'}`}>
                                    <input readOnly value={it.productName} placeholder="Select product..." disabled={!isEditable} className={`flex-1 min-w-0 px-3 py-1.5 text-sm outline-none text-slate-900 dark:text-slate-100 ${!isEditable ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800'}`} />
                                    <button 
                                        onClick={() => isEditable && setActiveLov({ type: 'product', index: items.indexOf(it) })} 
                                        disabled={!isEditable} 
                                        className={`shrink-0 px-3 text-xs font-bold transition-colors border-l border-slate-700 dark:border-slate-600 ${!isEditable ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white'}`}
                                    >
                                        LoV
                                    </button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={it.qty} 
                                    disabled={!isEditable} 
                                    onChange={e => { const n = [...items]; const idx = items.indexOf(it); n[idx].qty = Math.max(1, Number(e.target.value)); setItems(n); }} 
                                    className={`border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm text-center outline-none w-16 ${!isEditable ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 focus:border-red-400 dark:focus:border-red-500'}`} 
                                />
                            </td>
                            <Td right>฿{parseFloat(it.price || 0).toFixed(2)}</Td>
                            <Td right bold>฿{parseFloat((it.qty * it.price) || 0).toFixed(2)}</Td>
                            <td className="px-4 py-3 text-center">
                                {isEditable && (
                                    <button onClick={() => setItems(items.filter(x => x.id !== it.id))} className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-current/10 flex flex-col sm:flex-row justify-end items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-gray-300 font-bold uppercase tracking-wide">Total Order</p>
                        <p className="text-3xl font-black text-current font-bold mono">฿{total.toFixed(2)}</p>
                    </div>
                    <Btn onClick={handleSubmit(onSubmit)} size="lg"><Save className="w-4 h-4" /> {isNew ? 'Place Order' : 'Save Changes'}</Btn>
                </div>
            </Card>
        </div>
    );
}
