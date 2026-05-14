import { Plus } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge } from '../../components/ui';

export default function DelivererPaymentListView({ onNavigate }) {
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Deliverer Payments" subtitle="Process and view deliverer payments"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" />Create Payment</Btn>} />
            <Card>
                <Table headers={[{ label: 'Period' }, { label: 'Date' }, { label: 'Deliverer' }, { label: 'Status', center: true }, { label: 'Amount', right: true }]}>
                    <Tr>
                        <Td>Mar 2026</Td><Td>2026-03-24</Td><Td bold>Somchai J.</Td><Td center><Badge color="green">Paid</Badge></Td><Td right bold>฿2,450</Td>
                    </Tr>
                     <Tr>
                        <Td>Mar 2026</Td><Td>2026-03-22</Td><Td bold>Kittisak P.</Td><Td center><Badge color="green">Paid</Badge></Td><Td right bold>฿1,500</Td>
                    </Tr>
                </Table>
            </Card>
        </div>
    );
}
