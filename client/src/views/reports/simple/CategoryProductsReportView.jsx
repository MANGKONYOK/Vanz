import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FilterBar, FilterField, Select, LovInput, LovModal } from '../../../components/ui';
import { MOCK_STORES, MOCK_PRODUCTS } from '../../../data/mockData';

export default function CategoryProductsReportView() {
    const [isLovOpen, setIsLovOpen] = useState(false);
    const [store, setStore] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={isLovOpen} onClose={() => setIsLovOpen(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={MOCK_STORES}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setIsLovOpen(false); }} />
            <PageHeader title="Category Products" subtitle="List all products within a specific category" />
            <FilterBar>
                <FilterField label="Store">
                    <LovInput value={store} onLov={() => setIsLovOpen(true)} placeholder="Select store..." />
                </FilterField>
                <FilterField label="Category Name">
                    <Select>
                        <option value="">All Categories</option>
                        <option>Main Dish</option>
                        <option>Drinks</option>
                        <option>Appetizer</option>
                        <option>Dessert</option>
                        <option>Other</option>
                    </Select>
                </FilterField>
                <Btn><Search className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Store' }, { label: 'Category' }, { label: 'Product Name' }, { label: 'Price', right: true }, { label: 'Status', center: true }]}>
                    {MOCK_PRODUCTS.map(p => (
                        <Tr key={p.id}>
                            <Td>{p.store}</Td><Td><Badge>{p.category}</Badge></Td>
                            <Td bold>{p.name}</Td>
                            <Td right bold>฿{p.price}</Td>
                            <Td center><Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
