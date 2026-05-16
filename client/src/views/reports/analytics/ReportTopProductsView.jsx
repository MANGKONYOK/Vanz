import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, RankBadge, FilterBar, FilterField, Input, LovInput, LovModal } from '../../../components/ui';
import { MOCK_STORES, MOCK_TOP_PRODUCTS } from '../../../data/mockData';

export default function ReportTopProductsView() {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [store, setStore] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={MOCK_STORES}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <PageHeader title="Top Selling Products" subtitle="Analyze top best-selling products by quantity sold" />
            <FilterBar>
                <FilterField label="Store">
                    <LovInput value={store} onLov={() => setIsLovOpen(true)} placeholder="Select store..." />
                </FilterField>
                <FilterField label="Top"><Input type="number" defaultValue="10" /></FilterField>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <Btn><BarChart3 className="w-4 h-4" /> Generate</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Rank', center: true }, { label: 'Store' }, { label: 'Product' }, { label: 'Category' }, { label: 'Qty Sold', right: true }, { label: 'Revenue', right: true }]}>
                    {MOCK_TOP_PRODUCTS.map(p => (
                        <Tr key={p.id}>
                            <Td center><RankBadge rank={p.rank} /></Td>
                            <Td>{p.store}</Td>
                            <Td bold>{p.name}</Td><Td>{p.category}</Td>
                            <Td right bold>{p.qty.toLocaleString()}</Td>
                            <Td right bold className="text-emerald-700">฿{p.revenue.toLocaleString()}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
