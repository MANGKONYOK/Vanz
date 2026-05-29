import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FilterBar, FilterField, Select, LovInput, LovModal } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

const STATUS_COLOR = { AVAILABLE: 'green', OUT_OF_STOCK: 'amber', DISCONTINUED: 'red', UNAVAILABLE: 'gray' };

export default function CategoryProductsReportView({ showToast }) {
    const [allProducts, setAllProducts] = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [lovOpen,     setLovOpen]     = useState(false);
    const [store,       setStore]       = useState('');
    const [lovStores,   setLovStores]   = useState([]);
    const [storeCategories, setStoreCategories] = useState([]);
    const [catFilter,   setCatFilter]   = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/stores').catch(() => []),
            getJson('/store-products').catch(() => []),
        ]).then(([stores, products]) => {
            if (cancelled) return;
            const storeMap = new Map(stores.map(s => [s.store_id, s]));
            setLovStores(stores.map(s => ({ id: s.store_code, storeId: s.store_id, name: s.name, category: s.category || '-' })));
            const storeCategories = [...new Set(stores.map(s => s.category).filter(Boolean))];
            setStoreCategories(storeCategories);
            const mapped = (products || []).map(p => {
                const s = storeMap.get(p.store_id) || {};
                return {
                    id:        p.product_id,
                    storeCode: s.store_code || '',
                    store:     s.name       || '-',
                    category:  s.category   || '-',
                    name:      p.name,
                    price:     Number(p.unit_price || 0),
                    status:    p.status || 'available',
                };
            });
            setAllProducts(mapped);
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load products'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const storeCode = String(store).split(' – ')[0].trim();

    const filtered = allProducts.filter(p => {
        if (store     && p.storeCode !== storeCode) return false;
        if (catFilter && p.category  !== catFilter) return false;
        return true;
    });

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={lovOpen} onClose={() => setLovOpen(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={lovStores}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setLovOpen(false); }} />
            <PageHeader title="Category Products" subtitle="List all products within a specific store category" />
            <FilterBar>
                <FilterField label="Store">
                    <LovInput value={store} onLov={() => setLovOpen(true)} placeholder="All stores..." />
                </FilterField>
                <FilterField label="Category">
                    <Select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                        <option value="">All Categories</option>
                        {storeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                </FilterField>
                <Btn onClick={() => { setStore(''); setCatFilter(''); }}>
                    <Search className="w-4 h-4" /> Reset
                </Btn>
            </FilterBar>
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Loading products…</div>
                ) : (
                    <Table headers={[
                        { label: 'Store' }, { label: 'Category' }, { label: 'Product Name' },
                        { label: 'Price', right: true }, { label: 'Status', center: true },
                    ]}>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">No products found</td></tr>
                        ) : filtered.map(p => (
                            <Tr key={p.id}>
                                <Td>{p.store}</Td>
                                <Td><Badge>{p.category}</Badge></Td>
                                <Td bold>{p.name}</Td>
                                <Td right bold>฿{p.price.toLocaleString()}</Td>
                                <Td center><Badge color={STATUS_COLOR[p.status] || 'gray'}>{p.status}</Badge></Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
