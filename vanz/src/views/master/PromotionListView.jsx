import { Plus } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge } from '../../components/ui';
import { MOCK_PROMOTIONS } from '../../data/mockData';

export default function PromotionListView({ onNavigate }) {
    return (
        <div className="fade-in">
            <PageHeader title="Promotions" subtitle="Manage store promotional campaigns"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Promotion</Btn>} />
            <Card>
                <Table headers={[{ label: 'ID' }, { label: 'Campaign Name' }, { label: 'Store' }, { label: 'Period' }, { label: 'Type' }, { label: 'Status', center: true }]}>
                    {MOCK_PROMOTIONS.map(p => (
                        <Tr key={p.id}>
                            <Td mono className="text-xs">{p.id}</Td>
                            <Td bold>{p.name}</Td>
                            <Td>{p.store}</Td>
                            <Td className="text-xs">{p.startDate} → {p.endDate}</Td>
                            <Td>{p.discountType}</Td>
                            <Td center><Badge color="green">{p.status}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
