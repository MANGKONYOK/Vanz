import { useState } from 'react';
import { ArrowLeft, Save, CreditCard, RefreshCw } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, FormField, Input, Select, LovInput, LovModal } from '../../components/ui';
import { MOCK_DELIVERERS, INITIAL_ORDERS } from '../../data/mockData';

export default function DelivererPaymentView({ showToast, onNavigateBack }) {
    const onBack = onNavigateBack || (() => {});
    const [selected, setSelected] = useState([]);
    const [deliverer, setDeliverer] = useState('');
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [paymentDate, setPaymentDate] = useState('2026-03-23');
    const [startDate, setStartDate] = useState('2026-03-01');
    const [endDate, setEndDate] = useState('2026-03-31');
    const handleSave = () => {
        if (!deliverer) return showToast('Please select a deliverer', 'error');
        if (!paymentDate) return showToast('Please specify a payment date', 'error');
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) return showToast('Period end cannot be before period start', 'error');
        if (selected.length === 0) return showToast('Please select at least one unpaid order', 'error');
        showToast('Payment confirmed successfully!'); setSelected([]); setDeliverer(''); onBack();
    };
    const selectedOrders = INITIAL_ORDERS.filter(o => selected.includes(o.id));
    const total = selectedOrders.reduce((s, o) => s + o.fee + o.bonus + o.adjustment, 0);
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={MOCK_DELIVERERS} onSelect={r => { setDeliverer(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900 transition-colors font-medium mb-2"><ArrowLeft className="w-4 h-4" /> Back to Payments</button>
            <PageHeader title="Deliverer Payment" subtitle="Process payments for completed deliverer trips" />
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Payment Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Payment Code">
                        <Input readOnly defaultValue="PAY-2026-000456" className="bg-slate-50 font-mono text-slate-500" />
                    </FormField>
                    <FormField label="Deliverer" required>
                        <LovInput value={deliverer} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
                    </FormField>
                    <FormField label="Payment Date" required>
                        <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </FormField>
                    <FormField label="Period Start"><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></FormField>
                    <FormField label="Period End"><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></FormField>
                    <FormField label="Status">
                        <Select><option value="PENDING">PENDING</option><option value="PAID">PAID</option><option value="CANCELLED">CANCELLED</option></Select>
                    </FormField>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader title="Unpaid Deliveries" action={
                    <Btn size="sm" variant="secondary"><RefreshCw className="w-3.5 h-3.5" /> Load Orders</Btn>
                } />
                <Table headers={[{ label: '', center: true }, { label: 'Order ID' }, { label: 'Date' }, { label: 'Status', center: true }, { label: 'Fee', right: true }, { label: 'Bonus', right: true }, { label: 'Adjustment', right: true }, { label: 'Extended Price', right: true }]} minWidth="700px">
                    {INITIAL_ORDERS.map(o => (
                        <Tr key={o.id}>
                            <Td center><input type="checkbox" className="rounded accent-red-600" checked={selected.includes(o.id)} onChange={() => setSelected(p => p.includes(o.id) ? p.filter(x => x !== o.id) : [...p, o.id])} /></Td>
                            <Td bold mono>{o.id}</Td>
                            <Td>{o.date}</Td>
                            <Td center><Badge color="amber">{o.status}</Badge></Td>
                            <Td right>฿{o.fee}</Td>
                            <Td right>฿{o.bonus}</Td>
                            <Td right>฿{o.adjustment}</Td>
                            <Td right bold>฿{o.fee + o.bonus + o.adjustment}</Td>
                        </Tr>
                    ))}
                </Table>
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500">{selected.length} order(s) selected</p>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Payment</p>
                            <p className="text-3xl font-black text-slate-900 mono">฿{total}</p>
                        </div>
                        <Btn onClick={handleSave} size="lg">
                            <CreditCard className="w-4 h-4" /> Confirm Payment
                        </Btn>
                    </div>
                </div>
            </Card>
        </div>
    );
}
