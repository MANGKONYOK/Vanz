import { useState, useEffect } from 'react';
import { Printer, Search, Eye } from 'lucide-react';
import { PageHeader, Btn, Card, LovModal, FilterBar, FilterField, LovInput } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function OrderReceiptView({ showToast }) {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [lovOrders, setLovOrders] = useState([]);

    // Master lists for client-side joins
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [stores, setStores] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [deliverers, setDeliverers] = useState([]);
    const [products, setProducts] = useState([]);

    // Resolving receipt details
    function loadReceiptForCode(code, oData = orders, cData = customers, pData = profiles, sData = stores, dlvData = deliveries, drData = deliverers, prodData = products) {
        const order = (oData || []).find(o => o.order_code === code);
        if (!order) {
            setSelectedOrder(null);
            return;
        }

        const cust = cData.find(c => String(c.customer_id) === String(order.customer_id)) || {};
        const prof = pData.find(p => String(p.profile_id) === String(cust.profile_id)) || {};
        const store = sData.find(s => String(s.store_id) === String(order.store_id)) || {};
        const delivery = dlvData.find(d => String(d.order_id) === String(order.order_id)) || {};
        const deliverer = drData.find(d => String(d.deliverer_id) === String(delivery.deliverer_id)) || {};
        const dlvProf = pData.find(p => String(p.profile_id) === String(deliverer.profile_id)) || {};

        // Resolve product names
        const items = (order.order_items || []).map(item => {
            const prod = prodData.find(p => String(p.product_id) === String(item.product_id)) || {};
            return {
                id: item.order_item_id,
                name: prod.name || `Product #${item.product_id}`,
                qty: Number(item.quantity || 0),
                price: Number(item.unit_price || 0),
                total: Number(item.extend_price || 0),
            };
        });

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const deliveryFee = Number(delivery.delivery_fee || 0);

        // Format date nicely: YYYY-MM-DD HH:MM
        const formattedDate = order.order_date
            ? String(order.order_date).replace('T', ' ').slice(0, 16)
            : '—';

        setSelectedOrder({
            code: order.order_code,
            date: formattedDate,
            customer: prof.full_name || cust.customer_code || '-',
            store: store.name || '-',
            deliverer: dlvProf.full_name || deliverer.deliverer_code || '—',
            items,
            subtotal,
            deliveryFee,
            total: subtotal + deliveryFee,
        });
    }

    // Fetch master data on mount
    useEffect(() => {
        Promise.all([
            getJson('/orders').catch(() => []),
            getJson('/customers').catch(() => []),
            getJson('/profiles').catch(() => []),
            getJson('/stores').catch(() => []),
            getJson('/deliveries').catch(() => []),
            getJson('/deliverers').catch(() => []),
            getJson('/store-products').catch(() => []),
        ]).then(([ordersData, customersData, profilesData, storesData, deliveriesData, deliverersData, productsData]) => {
            setOrders(ordersData);
            setCustomers(customersData);
            setProfiles(profilesData);
            setStores(storesData);
            setDeliveries(deliveriesData);
            setDeliverers(deliverersData);
            setProducts(productsData);

            // Filter delivered orders (case-insensitive)
            const delivered = (ordersData || [])
                .filter(o => o.status?.toUpperCase() === 'DELIVERED')
                .map(o => {
                    const cust = customersData.find(c => String(c.customer_id) === String(o.customer_id)) || {};
                    const prof = profilesData.find(p => String(p.profile_id) === String(cust.profile_id)) || {};
                    const store = storesData.find(s => String(s.store_id) === String(o.store_id)) || {};
                    return {
                        id: o.order_code,
                        date: String(o.order_date || '').slice(0, 10),
                        customer: prof.full_name || cust.customer_code || '-',
                        store: store.name || '-',
                    };
                });

            if (delivered.length > 0) {
                setLovOrders(delivered);
                const firstCode = delivered[0].id;
                setOrderId(firstCode);
                loadReceiptForCode(firstCode, ordersData, customersData, profilesData, storesData, deliveriesData, deliverersData, productsData);
            } else {
                setLovOrders([]);
                setOrderId('');
                setSelectedOrder(null);
            }
        }).catch(e => {
            showToast?.(getApiErrorMessage(e, 'Failed to load receipt master data'), 'error');
        });

    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="fade-in flex flex-col items-center justify-center min-h-[75vh] py-6 print:py-0 print:block">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    aside, header, canvas, button, .print-hide, .toast-in {
                        display: none !important;
                    }
                    html, body, #root, main, .flex-1, .fade-in {
                        background: white !important;
                        background-image: none !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                        display: block !important;
                    }
                    .max-w-5xl, .p-5, .py-6, .main-scrollbar {
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                    }
                    #receipt-print-area {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    #receipt-print-area > div {
                        border: none !important;
                        box-shadow: none !important;
                        background: white !important;
                        color: black !important;
                        padding: 2rem !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    #receipt-print-area * {
                        color: black !important;
                        border-color: #cbd5e1 !important;
                    }
                }
            ` }} />

            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Order"
                columns={[{ key: 'id', label: 'Order ID' }, { key: 'date', label: 'Date' }, { key: 'customer', label: 'Customer' }, { key: 'store', label: 'Store' }]}
                data={lovOrders}
                onSelect={r => { setIsLovOpen(false); setOrderId(r.id); loadReceiptForCode(r.id); }} />
            
            <div className="print-hide w-full flex flex-col items-center">
                <PageHeader title="Order Receipt" subtitle="View and print customer order receipts" className="text-center mb-4" />

                <FilterBar>
                    <FilterField label="Order ID" className="max-w-[300px]">
                        <LovInput value={orderId} onLov={() => setIsLovOpen(true)} placeholder="Select order..." />
                    </FilterField>
                    <Btn onClick={() => loadReceiptForCode(orderId)}>
                        <Eye className="w-4 h-4" /> Load Receipt
                    </Btn>
                </FilterBar>
            </div>

            {selectedOrder ? (
                <div className="max-w-sm w-full mx-auto" id="receipt-print-area">
                    <Card className="p-6 bg-white dark:bg-slate-900 border-2 border-red-100 dark:border-red-900/50 shadow-xl rounded-2xl text-slate-800 dark:text-slate-100 transition-all duration-300 print:border-none print:shadow-none print:p-0">
                        {/* Header */}
                        <div className="text-center mb-5 border-b border-dashed border-slate-200 dark:border-slate-800 pb-5">
                            <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                                <img src="/favicon.svg?v=4" className="w-7 h-7 -mt-1" alt="logo" />
                                <span className="text-2xl font-black tracking-tight">Vanz</span>
                            </div>
                            
                            {/* Clickable Order Selector Pill */}
                            <div 
                                onClick={() => setIsLovOpen(true)}
                                className="cursor-pointer inline-flex items-center gap-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full text-xs font-bold transition-all shadow-sm border border-slate-200/50 dark:border-slate-700/50 print:bg-transparent print:border-none print:p-0 print:shadow-none"
                                title="Click to select another order"
                            >
                                <span className="mono text-red-600 dark:text-red-400">{selectedOrder.code}</span>
                                <span className="text-slate-400 dark:text-slate-500">·</span>
                                <span>{selectedOrder.date}</span>
                                <Search className="w-3.5 h-3.5 text-red-600 shrink-0 print-hide" />
                            </div>
                        </div>

                        {/* Metadata Box */}
                        <div className="text-xs mb-5 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-2 text-slate-700 dark:text-slate-300">
                            <p><span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">Customer:</span> {selectedOrder.customer}</p>
                            <p><span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">Store:</span> {selectedOrder.store}</p>
                            <p><span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">Deliverer:</span> {selectedOrder.deliverer}</p>
                        </div>

                        {/* Items Section */}
                        <div className="mb-4 space-y-3">
                            {selectedOrder.items.length === 0 ? (
                                <p className="text-xs text-center text-slate-500 py-2">No items in this order</p>
                            ) : selectedOrder.items.map(i => (
                                <div key={i.id} className="flex justify-between items-start py-1">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{i.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">x{i.qty} @ ฿{i.price}</p>
                                    </div>
                                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 mono">
                                        <span className="font-sans mr-1 text-xs text-slate-500 dark:text-slate-400 font-normal">฿</span>{i.total}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Totals Section */}
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                            <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300 font-bold">
                                <span>Subtotal</span>
                                <span className="mono text-slate-900 dark:text-slate-100 font-extrabold"><span className="font-sans mr-1 text-slate-500 dark:text-slate-400 text-xs font-normal">฿</span>{selectedOrder.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300 font-bold">
                                <span>Delivery Fee</span>
                                <span className="mono text-slate-900 dark:text-slate-100 font-extrabold"><span className="font-sans mr-1 text-slate-500 dark:text-slate-400 text-xs font-normal">฿</span>{selectedOrder.deliveryFee}</span>
                            </div>
                            <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-100 pt-3 border-t-2 border-slate-200 dark:border-slate-800">
                                <span>Total</span>
                                <span className="mono text-red-600 dark:text-red-400 font-black text-lg"><span className="font-sans mr-1 text-sm font-bold">฿</span>{selectedOrder.total}</span>
                            </div>
                        </div>

                        {/* Print Button */}
                        <button 
                            type="button"
                            onClick={() => window.print()}
                            className="w-full mt-6 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer text-sm print-hide"
                        >
                            <Printer className="w-4.5 h-4.5" /> Print Receipt
                        </button>
                    </Card>
                </div>
            ) : (
                <div className="py-12 text-center text-slate-500 text-sm print-hide">
                    No order receipt selected or no delivered orders found. Click the selector above to pick an order.
                </div>
            )}
        </div>
    );
}
