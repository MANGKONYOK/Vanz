import { useState } from 'react';
import { Truck, Zap } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, FormField, Input, LovInput, LovModal } from '../../components/ui';
import { MOCK_PREPARED_ORDERS, MOCK_DELIVERERS } from '../../data/mockData';

export default function DelivererDispatchView({ showToast }) {
    const [queue, setQueue] = useState(MOCK_PREPARED_ORDERS);
    const [orderId, setOrderId] = useState('');
    const [delivererId, setDelivererId] = useState('');
    const [lovTarget, setLovTarget] = useState(null);
    const handleDispatch = (id) => { showToast(`Order ${id} dispatched!`); setQueue(queue.filter(q => q.id !== id)); };
    const attemptDispatch = () => {
        if (!orderId) return showToast('Please select a prepared order first', 'error');
        if (!delivererId) return showToast('Please assign a deliverer', 'error');
        handleDispatch(orderId); setOrderId(''); setDelivererId('');
    };
    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!lovTarget} onClose={() => setLovTarget(null)} title={lovTarget === 'order' ? 'Order' : 'Deliverer'}
                columns={lovTarget === 'order' ? [{ key: 'id', label: 'Order ID' }, { key: 'store', label: 'Store' }, { key: 'customer', label: 'Customer' }] : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={lovTarget === 'order' ? queue : MOCK_DELIVERERS}
                onSelect={r => { lovTarget === 'order' ? setOrderId(r.id) : setDelivererId(`${r.id} – ${r.name}`); setLovTarget(null); }} />
            <PageHeader title="Dispatching" subtitle="Assign deliverers to prepared customer orders" />
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-4">Assign Deliverer</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 min-w-0">
                        <FormField label="Order ID" required>
                            <LovInput value={orderId} onLov={() => setLovTarget('order')} placeholder="Select prepared order..." />
                        </FormField>
                    </div>
                    <div className="flex-1 min-w-0">
                        <FormField label="Deliverer" required>
                            <LovInput value={delivererId} onLov={() => setLovTarget('deliverer')} placeholder="Assign deliverer..." />
                        </FormField>
                    </div>
                    <div className="flex-1 min-w-0 md:max-w-[150px]"><FormField label="Est. Time (Mins)" required><Input type="number" defaultValue="30" /></FormField></div>
                    <Btn onClick={attemptDispatch} size="lg"><Truck className="w-4 h-4" /> Dispatch</Btn>
                </div>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader title="Prepared Queue" />
                <Table headers={[{ label: 'Order ID' }, { label: 'Store' }, { label: 'Customer' }, { label: 'Waiting', center: true }, { label: '', right: true }]}>
                    {queue.map(q => (
                        <Tr key={q.id}>
                            <Td bold className="mono text-xs">{q.id}</Td>
                            <Td>{q.store}</Td>
                            <Td>{q.customer}</Td>
                            <Td center><Badge color="amber">{q.time}</Badge></Td>
                            <td className="px-4 py-3 text-right"><Btn size="sm" onClick={() => handleDispatch(q.id)}><Zap className="w-3 h-3" /> Dispatch</Btn></td>
                        </Tr>
                    ))}
                    {queue.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">All orders have been dispatched ✓</td></tr>}
                </Table>
            </Card>
        </div>
    );
}
