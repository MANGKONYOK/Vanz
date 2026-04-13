import { useState } from 'react';
import { History } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, Badge, FilterBar, FilterField, Input, LovInput, LovModal } from '../../../components/ui';
import { MOCK_DELIVERERS, MOCK_DELIVERER_HISTORY } from '../../../data/mockData';

export default function DelivererHistoryReportView() {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [deliverer, setDeliverer] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={MOCK_DELIVERERS}
                onSelect={r => { setDeliverer(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <PageHeader title="Deliverer History" subtitle="View delivery history of a specific deliverer" />
            <FilterBar>
                <FilterField label="Deliverer ID">
                    <LovInput value={deliverer} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
                </FilterField>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <Btn><History className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <Card>
                <CardHeader title="Somchai J. (D-001) — Delivery History" />
                <Table headers={[{ label: 'Order ID' }, { label: 'Date' }, { label: 'Time', center: true }, { label: 'Store' }, { label: 'Customer' }, { label: 'Fee', right: true }, { label: 'Status', center: true }]}>
                    {MOCK_DELIVERER_HISTORY.map(h => (
                        <Tr key={h.id}>
                            <Td bold mono className="text-xs">{h.id}</Td><Td>{h.date}</Td>
                            <Td center className="text-xs font-bold text-slate-500">{h.time}</Td>
                            <Td>{h.store}</Td><Td>{h.customer}</Td>
                            <Td right bold>฿{h.fee}</Td>
                            <Td center><Badge color="green">{h.status}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
