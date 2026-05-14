import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge } from '../../components/ui';
import { INITIAL_ORDERS } from '../../data/mockData';

export default function CustomerOrderListView({ onNavigate }) {
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Customer Orders" subtitle="Manage all customer orders"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Order</Btn>} />
            <Card>
                <Table headers={[{ label: 'Order ID' }, { label: 'Date' }, { label: 'Customer' }, { label: 'Status', center: true }, { label: 'Deliverer' }]}>
                    {INITIAL_ORDERS.map(o => (
                        <Tr key={o.id}>
                            <Td mono className="text-xs font-bold text-red-600">{o.id}</Td>
                            <Td>{o.date}</Td>
                            <Td bold>{o.customer}</Td>
                            <Td center><Badge color={o.status === 'Paid' ? 'green' : 'amber'}>{o.status}</Badge></Td>
                            <Td>{o.deliverer}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
