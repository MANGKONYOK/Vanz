import { Award, Star } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, RankBadge, FilterBar, FilterField, Input } from '../../../components/ui';
import { MOCK_TOP_DELIVERERS } from '../../../data/mockData';

export default function TopDeliverersReportView() {
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Top Deliverers" subtitle="Analyze top deliverers with the most deliveries" />
            <FilterBar>
                <FilterField label="Top"><Input type="number" defaultValue="10" /></FilterField>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <Btn><Award className="w-4 h-4" /> Generate</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Rank', center: true }, { label: 'Deliverer' }, { label: 'Vehicle' }, { label: 'Deliveries', right: true }, { label: 'Total Earnings', right: true }, { label: 'Rating', right: true }]}>
                    {MOCK_TOP_DELIVERERS.map(d => (
                        <Tr key={d.id}>
                            <Td center><RankBadge rank={d.rank} /></Td>
                            <Td bold>{d.name}</Td><Td>{d.type}</Td>
                            <Td mono className="text-xs">{d.phone}</Td>
                            <Td right bold>{d.deliveries}</Td>
                            <Td right bold className="text-emerald-600">฿{d.earnings.toLocaleString()}</Td>
                            <td className="px-4 py-3 text-right"><span className="flex items-center justify-end gap-1 font-bold text-amber-600"><Star className="w-4 h-4 fill-amber-400 text-amber-400" />{d.rating}</span></td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
