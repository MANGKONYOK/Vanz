import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, FilterBar, FilterField, Input, Select, LovInput, LovModal } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

const STATUS_COLOR = { AVAILABLE: 'green', OUT_OF_STOCK: 'amber', DISCONTINUED: 'red', UNAVAILABLE: 'gray' };

export default function StoreProductsReportView({ showToast }) {
    const [rows,       setRows]       = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [activeLov,  setActiveLov]  = useState(null);
    const [store,      setStore]      = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [statusFilter,  setStatusFilter]  = useState('');
    const [lovStores,  setLovStores]  = useState([]);
    const [allProducts, setAllProducts] = useState([]);

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
            const mapped = (products || []).map(p => {
                const s = storeMap.get(p.store_id) || {};
                return {
                    id:         p.product_id,
                    storeCode:  s.store_code || '',
                    store:      s.name || '-',
                    name:       p.name,
                    price:      Number(p.unit_price || 0),
                    status:     p.status || 'AVAILABLE',
                };
            });
            setAllProducts(mapped);
            setRows(mapped);
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load products'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const storeCode = String(store).split(' – ')[0].trim();

    const filtered = allProducts.filter(p => {
        if (store        && p.storeCode !== storeCode) return false;
        if (productFilter && !p.name.toLowerCase().includes(productFilter.toLowerCase())) return false;
        if (statusFilter  && p.status !== statusFilter) return false;
        return true;
    });

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={!!activeLov} onClose={() => setActiveLov(null)}
                title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={lovStores}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setActiveLov(null); }} />
            <PageHeader title="Store Products" subtitle="View comprehensive list of products filtered by store" />
            <FilterBar>
                <FilterField label="Store Name">
                    <LovInput value={store} onLov={() => setActiveLov('store')} placeholder="All stores..." />
                </FilterField>
                <FilterField label="Product Name">
                    <Input placeholder="Filter by name…" value={productFilter} onChange={e => setProductFilter(e.target.value)} />
                </FilterField>
                <FilterField label="Status">
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="OUT_OF_STOCK">Out of Stock</option>
                        <option value="DISCONTINUED">Discontinued</option>
                        <option value="UNAVAILABLE">Unavailable</option>
                    </Select>
                </FilterField>
                <Btn onClick={() => { setStore(''); setProductFilter(''); setStatusFilter(''); }}>
                    <Search className="w-4 h-4" /> Reset
                </Btn>
            </FilterBar>
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Loading products…</div>
                ) : (
                    <Table headers={[
                        { label: 'Store' }, { label: 'Product Name' },
                        { label: 'Unit Price', right: true }, { label: 'Status', center: true },
                    ]}>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No products found</td></tr>
                        ) : filtered.map(p => (
                            <Tr key={p.id}>
                                <Td>{p.store}</Td>
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
