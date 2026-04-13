import { useState } from 'react';
import { Eye, Printer, ShoppingBag } from 'lucide-react';
import { PageHeader, Btn, Card, FilterBar, FilterField, LovInput, LovModal } from '../../../components/ui';
import { MOCK_RECEIPT_ITEMS, MOCK_DELIVERED_ORDERS } from '../../../data/mockData';

export default function OrderReceiptView() {
    const subtotal = MOCK_RECEIPT_ITEMS.reduce((s, i) => s + i.total, 0);
    const delivery = 40;
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [orderId, setOrderId] = useState('ORD-2026-008001');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Order"
                columns={[{ key: 'id', label: 'Order ID' }, { key: 'date', label: 'Date' }, { key: 'customer', label: 'Customer' }, { key: 'store', label: 'Store' }]}
                data={MOCK_DELIVERED_ORDERS}
                onSelect={r => { setOrderId(r.id); setIsLovOpen(false); }} />
            <PageHeader title="Order Receipt" subtitle="View and print customer order receipts" />
            <FilterBar>
                <FilterField label="Order ID">
                    <LovInput value={orderId} onLov={() => setIsLovOpen(true)} placeholder="Select order..." />
                </FilterField>
                <Btn><Eye className="w-4 h-4" /> Load Receipt</Btn>
            </FilterBar>
            <div className="max-w-sm mx-auto">
                <Card className="p-6">
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 text-red-600 mb-1">
                            <ShoppingBag className="w-5 h-5 fill-current" /><span className="text-xl font-black">VANz</span>
                        </div>
                        <p className="text-xs text-slate-400 mono">ORD-2026-008001 · 2026-03-21 14:32</p>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                        <p><span className="font-semibold">Customer:</span> Adisak M.</p>
                        <p><span className="font-semibold">Store:</span> Somchai Kitchen</p>
                        <p><span className="font-semibold">Deliverer:</span> Somchai J.</p>
                    </div>
                    <div className="border-t border-dashed border-slate-200 pt-3 mb-3">
                        {MOCK_RECEIPT_ITEMS.map(i => (
                            <div key={i.id} className="flex justify-between items-start py-1.5">
                                <div><p className="text-sm font-semibold text-slate-800">{i.name}</p><p className="text-xs text-slate-400">x{i.qty} @ ฿{i.price}</p></div>
                                <span className="text-sm font-bold text-slate-900 mono">฿{i.total}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-dashed border-slate-200 pt-3 space-y-1">
                        <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span className="mono">฿{subtotal}</span></div>
                        <div className="flex justify-between text-sm text-slate-600"><span>Delivery Fee</span><span className="mono">฿{delivery}</span></div>
                        <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200"><span>Total</span><span className="mono">฿{subtotal + delivery}</span></div>
                    </div>
                    <Btn className="w-full mt-5" onClick={() => { }}><Printer className="w-4 h-4" /> Print Receipt</Btn>
                </Card>
            </div>
        </div>
    );
}
