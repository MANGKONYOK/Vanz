import { useState } from 'react';
import { TrendingUp, Target } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, StatCard, FilterBar, FilterField, Input, LovInput, LovModal } from '../../../components/ui';
import { MOCK_STORES, MOCK_PROMOTIONS } from '../../../data/mockData';

export default function PromoPerfReportView() {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [store, setStore] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={MOCK_STORES}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <PageHeader title="Promotion Performance" subtitle="Measure campaign revenue and conversion impact" />
            <FilterBar>
                <FilterField label="Store">
                    <LovInput value={store} onLov={() => setIsLovOpen(true)} placeholder="Select store..." />
                </FilterField>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-31" /></FilterField>
                <Btn><TrendingUp className="w-4 h-4" /> Generate</Btn>
            </FilterBar>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard label="Total Promo Revenue" value="฿20,600" icon={<TrendingUp size={18} />} sub="Across all campaigns" color="green" />
                <StatCard label="Active Campaigns" value="2" icon={<Target size={18} />} sub="Currently running" color="red" />
            </div>
            <Card>
                <Table headers={[{ label: 'Campaign' }, { label: 'Store' }, { label: 'Period' }, { label: 'Discount Type' }, { label: 'Orders Applied', right: true }, { label: 'Unique Products', right: true }, { label: 'Revenue Generated', right: true }]}>
                    {MOCK_PROMOTIONS.map(p => (
                        <Tr key={p.id}>
                            <Td bold>{p.name}</Td><Td>{p.store}</Td>
                            <Td className="text-xs">{p.startDate} → {p.endDate}</Td>
                            <Td>{p.discountType}</Td>
                            <Td right bold className="text-emerald-600">{p.orders}</Td>
                            <Td right bold>{p.products}</Td>
                            <Td right bold className="text-emerald-700">฿{p.revenue.toLocaleString()}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
