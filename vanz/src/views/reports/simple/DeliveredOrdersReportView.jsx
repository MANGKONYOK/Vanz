import { Search } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, FilterBar, FilterField, Input } from '../../../components/ui';
import { MOCK_DELIVERED_ORDERS } from '../../../data/mockData';

export default function DeliveredOrdersReportView() {
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Delivered Orders" subtitle="List of all orders that have been successfully delivered" />
            <FilterBar>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <Btn><Search className="w-4 h-4" /> Generate</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Order ID' }, { label: 'Date' }, { label: 'Customer' }, { label: 'Store' }, { label: 'Deliverer' }, { label: 'Duration', right: true }, { label: 'Total', right: true }]}>
                    {MOCK_DELIVERED_ORDERS.map(o => (
                        <Tr key={o.id}>
                            <Td bold mono className="text-xs">{o.id}</Td>
                            <Td>{o.date}</Td><Td>{o.customer}</Td><Td>{o.store}</Td><Td>{o.deliverer}</Td><Td right className="text-xs text-slate-500 font-bold">{o.duration}</Td>
                            <Td right bold>฿{o.total}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
