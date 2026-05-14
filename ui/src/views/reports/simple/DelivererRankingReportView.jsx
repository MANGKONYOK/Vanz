import { useState } from 'react';
import { Search, Star } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, RankBadge, FilterBar, FilterField, Input, Select, LovInput, LovModal } from '../../../components/ui';
import { MOCK_DELIVERERS } from '../../../data/mockData';

export default function DelivererRankingReportView() {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [deliverer, setDeliverer] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={MOCK_DELIVERERS}
                onSelect={r => { setDeliverer(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <PageHeader title="Deliverer Ranking" subtitle="Rank deliverers based on their average rating" />
            <FilterBar>
                <FilterField label="Deliverer Name">
                    <LovInput value={deliverer} onLov={() => setIsLovOpen(true)} placeholder="Select deliverer..." />
                </FilterField>
                <FilterField label="Vehicle Type">
                    <Select><option value="">All Types</option><option>Motorcycle</option><option>Car</option><option>Truck</option></Select>
                </FilterField>
                <FilterField label="Rating"><Input type="number" step="0.1" placeholder="Min rating" /></FilterField>
                <Btn><Search className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Rank', center: true }, { label: 'Deliverer Name' }, { label: 'Vehicle Type' }, { label: 'Total Deliveries', right: true }, { label: 'Rating', right: true }]}>
                    {[...MOCK_DELIVERERS].sort((a, b) => b.rating - a.rating).map((d, i) => (
                        <Tr key={d.id}>
                            <Td center><RankBadge rank={i + 1} /></Td>
                            <Td bold>{d.name}</Td><Td>{d.type}</Td>
                            <Td mono className="text-xs">{d.phone}</Td>
                            <td className="px-4 py-3 text-right">
                                <span className="flex items-center justify-end gap-1 font-bold text-amber-600">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />{d.rating}
                                    <div className="ml-2 h-2 rounded-full bg-amber-100 w-24"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${(d.rating / 5) * 100}%` }}></div></div>
                                </span>
                            </td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
