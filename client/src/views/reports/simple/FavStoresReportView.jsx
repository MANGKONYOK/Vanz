import { useState, useEffect } from 'react';
import { Heart, Search } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, FilterBar, FilterField, LovInput, LovModal } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function FavStoresReportView({ showToast }) {
    const [rows,       setRows]       = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [activeLov,  setActiveLov]  = useState(null);
    const [customer,   setCustomer]   = useState('');
    const [store,      setStore]      = useState('');
    const [lovCustomers, setLovCustomers] = useState([]);
    const [lovStores,    setLovStores]    = useState([]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/favorite-stores').catch(() => []),
            getJson('/customers').catch(() => []),
            getJson('/profiles').catch(() => []),
            getJson('/stores').catch(() => []),
        ]).then(([favStores, customers, profiles, stores]) => {
            if (cancelled) return;
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            const custMap    = new Map(customers.map(c => [c.customer_code, c]));
            const storeMap   = new Map(stores.map(s => [s.store_code, s]));

            setLovCustomers(customers.map(c => {
                const prof = profileMap.get(c.profile_id) || {};
                return { id: c.customer_code, name: prof.full_name || c.customer_code, phone: prof.phone || '-' };
            }));
            setLovStores(stores.map(s => ({
                id: s.store_code, name: s.name,
                category: s.category || '-',
            })));

            setRows((favStores || []).map(f => {
                const cust  = custMap.get(f.customer_code) || {};
                const prof  = profileMap.get(cust.profile_id) || {};
                const stre  = storeMap.get(f.store_code) || {};
                return {
                    customerCode: f.customer_code,
                    storeCode:    f.store_code,
                    customer:     prof.full_name || f.customer_code,
                    store:        stre.name      || f.store_code,
                };
            }));
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load favorite stores'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const custCode  = String(customer).split(' – ')[0].trim();
    const storeCode = String(store).split(' – ')[0].trim();

    const filtered = rows.filter(f => {
        if (customer && f.customerCode !== custCode) return false;
        if (store    && f.storeCode    !== storeCode) return false;
        return true;
    });

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!activeLov} onClose={() => setActiveLov(null)}
                title={activeLov === 'store' ? 'Store' : 'Customer'}
                columns={activeLov === 'store'
                    ? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]
                    : [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' },       { key: 'phone',    label: 'Phone' }]}
                data={activeLov === 'store' ? lovStores : lovCustomers}
                onSelect={r => {
                    if (activeLov === 'store') setStore(`${r.id} – ${r.name}`);
                    else setCustomer(`${r.id} – ${r.name}`);
                    setActiveLov(null);
                }} />
            <PageHeader title="Favorite Stores" subtitle="List of stores marked as favorite by customers" />
            <FilterBar>
                <FilterField label="Customer">
                    <LovInput value={customer} onLov={() => setActiveLov('customer')} placeholder="All customers..." />
                </FilterField>
                <FilterField label="Store">
                    <LovInput value={store} onLov={() => setActiveLov('store')} placeholder="All stores..." />
                </FilterField>
                <Btn onClick={() => { setCustomer(''); setStore(''); }}>
                    <Heart className="w-4 h-4" /> Reset
                </Btn>
            </FilterBar>
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 dark:text-gray-300 text-sm">Loading favorite stores…</div>
                ) : (
                    <Table headers={[{ label: 'Customer Name' }, { label: 'Favorite Store' }]}>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={2} className="py-10 text-center text-slate-500 dark:text-gray-300 text-sm">No favorite store records found</td></tr>
                        ) : filtered.map((f, i) => (
                            <Tr key={i}>
                                <Td bold>{f.customer}</Td>
                                <Td>
                                    <span className="flex items-center gap-1.5">
                                        <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />{f.store}
                                    </span>
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
