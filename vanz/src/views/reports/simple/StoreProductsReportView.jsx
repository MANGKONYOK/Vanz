import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FilterBar, FilterField, Input, Select, LovInput, LovModal } from '../../../components/ui';
import { MOCK_STORES, MOCK_PRODUCTS } from '../../../data/mockData';

export default function StoreProductsReportView() {
    const [activeLov, setActiveLov] = useState(null);
    const [store, setStore] = useState('');
    const [product, setProduct] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!activeLov} onClose={() => setActiveLov(null)} title={activeLov === 'store' ? 'Store' : 'Product'}
                columns={activeLov === 'store' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }] : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Product' }, { key: 'price', label: 'Price' }]}
                data={activeLov === 'store' ? MOCK_STORES : MOCK_PRODUCTS}
                onSelect={r => {
                    if (activeLov === 'store') setStore(`${r.id} – ${r.name}`);
                    else setProduct(r.name);
                    setActiveLov(null);
                }} />
            <PageHeader title="Store Products" subtitle="View comprehensive list of products filtered by store" />
            <FilterBar>
                <FilterField label="Store Name">
                    <LovInput value={store} onLov={() => setActiveLov('store')} placeholder="Select store..." />
                </FilterField>
                <FilterField label="Product Name">
                    <LovInput value={product} onLov={() => setActiveLov('product')} placeholder="Select product..." />
                </FilterField>
                <FilterField label="Unit Price"><Input type="number" placeholder="0.00" /></FilterField>
                <FilterField label="Status">
                    <Select><option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option></Select>
                </FilterField>
                <Btn><Search className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Store' }, { label: 'Product Name' }, { label: 'Category' }, { label: 'Unit Price', right: true }, { label: 'Status', center: true }]}>
                    {MOCK_PRODUCTS.map(p => (
                        <Tr key={p.id}>
                            <Td>{p.store}</Td><Td bold>{p.name}</Td><Td>{p.category}</Td>
                            <Td right bold>฿{p.price}</Td>
                            <Td center><Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
