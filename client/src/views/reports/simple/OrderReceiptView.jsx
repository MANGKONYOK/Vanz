import { useState, useEffect } from 'react';
import { Eye, Printer, ShoppingBag } from 'lucide-react';
import { PageHeader, Btn, Card, FilterBar, FilterField, LovInput, LovModal } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function OrderReceiptView({ showToast }) {
    const [lovOpen,   setLovOpen]   = useState(false);
    const [lovOrders, setLovOrders] = useState([]);
    const [orderId,   setOrderId]   = useState('');
    const [receipt,   setReceipt]   = useState(null);
    const [loading,   setLoading]   = useState(false);

    // Load delivered orders for the LoV
    useEffect(() => {
        Promise.all([
            getJson('/orders', { status: 'DELIVERED' }).catch(() => []),
            getJson('/customers').catch(() => []),
            getJson('/profiles').catch(() => []),
            getJson('/stores').catch(() => []),
        ]).then(([orders, customers, profiles, stores]) => {
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            const custMap    = new Map(customers.map(c => [c.customer_id, c]));
            const storeMap   = new Map(stores.map(s => [s.store_id, s]));
            setLovOrders((orders || []).filter(o => o.status === 'DELIVERED').map(o => {
                const cust  = custMap.get(o.customer_id) || {};
                const prof  = profileMap.get(cust.profile_id) || {};
                const store = storeMap.get(o.store_id) || {};
                return {
                    id:       o.order_code,
                    date:     String(o.order_date || '').slice(0, 10),
                    customer: prof.full_name || cust.customer_code || '-',
                    store:    store.name || '-',
                };
            }));
        }).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLoad = async () => {
        if (!orderId) return showToast?.('Please select an order', 'error');
        setLoading(true);
        try {
            const [orders, customers, profiles, stores, deliveries, deliverers, products] = await Promise.all([
                getJson('/orders', { order_code: orderId }).catch(() => []),
                getJson('/customers').catch(() => []),
                getJson('/profiles').catch(() => []),
                getJson('/stores').catch(() => []),
                getJson('/deliveries').catch(() => []),
                getJson('/deliverers').catch(() => []),
                getJson('/store-products').catch(() => []),
            ]);

            const order = (Array.isArray(orders) ? orders : []).find(o => o.order_code === orderId);
            if (!order) return showToast?.('Order not found', 'error');

            const profileMap  = new Map(profiles.map(p => [p.profile_id, p]));
            const custMap     = new Map(customers.map(c => [c.customer_id, c]));
            const storeMap    = new Map(stores.map(s => [s.store_id, s]));
            const deliveryMap = new Map(deliveries.map(d => [d.order_id, d]));
            const delivererMap = new Map(deliverers.map(d => [d.deliverer_id, d]));
            const productMap  = new Map(products.map(p => [p.product_id, p]));

            const cust      = custMap.get(order.customer_id) || {};
            const prof      = profileMap.get(cust.profile_id) || {};
            const store     = storeMap.get(order.store_id) || {};
            const delivery  = deliveryMap.get(order.order_id) || {};
            const deliverer = delivererMap.get(delivery.deliverer_id) || {};
            const dlvProf   = profileMap.get(deliverer.profile_id) || {};

            setReceipt({
                code:       order.order_code,
                date:       String(order.order_date || '').slice(0, 16).replace('T', ' '),
                customer:   prof.full_name || cust.customer_code || '-',
                store:      store.name || '-',
                deliverer:  dlvProf.full_name || deliverer.deliverer_code || '—',
                deliveryFee: Number(delivery.delivery_fee || 0),
                items: (order.order_items || []).map(i => {
                    const p = productMap.get(i.product_id) || {};
                    return {
                        id:    i.order_item_id,
                        name:  p.name || `Product#${i.product_id}`,
                        qty:   Number(i.quantity || 1),
                        price: Number(i.unit_price || 0),
                        total: Number(i.extend_price || 0),
                    };
                }),
                subtotal: Number(order.total_price || 0),
            });
        } catch (e) {
            showToast?.(getApiErrorMessage(e, 'Failed to load receipt'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={lovOpen} onClose={() => setLovOpen(false)} title="Order"
                columns={[{ key: 'id', label: 'Order ID' }, { key: 'date', label: 'Date' }, { key: 'customer', label: 'Customer' }, { key: 'store', label: 'Store' }]}
                data={lovOrders}
                onSelect={r => { setOrderId(r.id); setReceipt(null); setLovOpen(false); }} />
            <PageHeader title="Order Receipt" subtitle="View and print customer order receipts" />
            <FilterBar>
                <FilterField label="Order ID">
                    <LovInput value={orderId} onLov={() => setLovOpen(true)} placeholder="Select order..." />
                </FilterField>
                <Btn onClick={handleLoad} disabled={loading}>
                    <Eye className="w-4 h-4" /> {loading ? 'Loading…' : 'Load Receipt'}
                </Btn>
            </FilterBar>

            {receipt && (
                <div className="max-w-sm mx-auto">
                    <Card className="p-6">
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-2 text-red-600 mb-1">
                                <ShoppingBag className="w-5 h-5 fill-current" />
                                <span className="text-xl font-black">VANz</span>
                            </div>
                            <p className="text-xs text-slate-400 mono">{receipt.code} · {receipt.date}</p>
                        </div>
                        <div className="text-xs text-slate-500 mb-3">
                            <p><span className="font-semibold">Customer:</span> {receipt.customer}</p>
                            <p><span className="font-semibold">Store:</span> {receipt.store}</p>
                            {receipt.deliverer !== '—' && <p><span className="font-semibold">Deliverer:</span> {receipt.deliverer}</p>}
                        </div>
                        <div className="border-t border-dashed border-slate-200 pt-3 mb-3">
                            {receipt.items.map(i => (
                                <div key={i.id} className="flex justify-between items-start py-1.5">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{i.name}</p>
                                        <p className="text-xs text-slate-400">x{i.qty} @ ฿{i.price.toLocaleString()}</p>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 mono">฿{i.total.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-dashed border-slate-200 pt-3 space-y-1">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span className="mono">฿{receipt.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Delivery Fee</span>
                                <span className="mono">฿{receipt.deliveryFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                                <span>Total</span>
                                <span className="mono">฿{(receipt.subtotal + receipt.deliveryFee).toLocaleString()}</span>
                            </div>
                        </div>
                        <Btn className="w-full mt-5" onClick={() => window.print()}>
                            <Printer className="w-4 h-4" /> Print Receipt
                        </Btn>
                    </Card>
                </div>
            )}
        </div>
    );
}
