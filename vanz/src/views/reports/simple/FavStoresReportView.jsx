import { useState } from 'react';
import { Heart } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, FilterBar, FilterField, LovInput, LovModal } from '../../../components/ui';
import { MOCK_STORES, MOCK_CUSTOMERS, MOCK_FAV_STORES } from '../../../data/mockData';

export default function FavStoresReportView() {
    const [activeLov, setActiveLov] = useState(null);
    const [customer, setCustomer] = useState('');
    const [store, setStore] = useState('');

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!activeLov} onClose={() => setActiveLov(null)} title={activeLov === 'store' ? 'Store' : 'Customer'}
                columns={activeLov === 'store' ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }] : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }]}
                data={activeLov === 'store' ? MOCK_STORES : MOCK_CUSTOMERS}
                onSelect={r => {
                    if (activeLov === 'store') setStore(`${r.id} – ${r.name}`);
                    else setCustomer(`${r.id} – ${r.name}`);
                    setActiveLov(null);
                }} />
            <PageHeader title="Favorite Stores" subtitle="List of stores marked as favorite by customers" />
            <FilterBar>
                <FilterField label="Customer Name">
                    <LovInput value={customer} onLov={() => setActiveLov('customer')} placeholder="Select customer..." />
                </FilterField>
                <FilterField label="Store Name">
                    <LovInput value={store} onLov={() => setActiveLov('store')} placeholder="Select store..." />
                </FilterField>
                <Btn><Heart className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <Card>
                <Table headers={[{ label: 'Customer Name' }, { label: 'Favorite Store' }, { label: 'Total Orders', right: true }]}>
                    {MOCK_FAV_STORES.map((f, i) => (
                        <Tr key={i}>
                            <Td bold>{f.customer}</Td>
                            <Td><span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />{f.store}</span></Td>
                            <Td right bold>{f.orders}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
