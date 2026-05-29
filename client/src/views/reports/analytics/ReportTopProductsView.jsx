import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, RankBadge, FilterBar, FilterField, Input, LovInput, LovModal } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function ReportTopProductsView({ showToast }) {
    const [lovOpen,   setLovOpen]   = useState(false);
    const [store,     setStore]     = useState('');
    const [topN,      setTopN]      = useState(10);
    const [dateFrom,  setDateFrom]  = useState('');
    const [dateTo,    setDateTo]    = useState('');
    const [lovStores, setLovStores] = useState([]);
    const [rows,      setRows]      = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [generated, setGenerated] = useState(false);

    // Load store LoV on mount
    useEffect(() => {
        Promise.all([
            getJson('/stores').catch(() => []),
        ]).then(([stores]) => {
            setLovStores((stores || []).map(s => ({
                id: s.store_code, storeId: s.store_id, name: s.name, category: s.category || '-',
            })));
        }).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleGenerate = async () => {
        setLoading(true);
        setGenerated(true);
        try {
            const storeCode = String(store).split(' – ')[0].trim();
            const [orders, products, stores] = await Promise.all([
                getJson('/orders').catch(() => []),
                getJson('/store-products', storeCode ? { store_code: storeCode } : {}).catch(() => []),
                getJson('/stores').catch(() => []),
            ]);

            const productMap = new Map((products || []).map(p => [p.product_id, p]));
            const storeMap   = new Map((stores    || []).map(s => [s.store_id,   s]));

            // Aggregate sales by product
            const salesByProduct = {};
            for (const order of (orders || [])) {
                const oDate = String(order.order_date || '').slice(0, 10);
                if (dateFrom && oDate < dateFrom) continue;
                if (dateTo   && oDate > dateTo)   continue;
                for (const item of (order.order_items || [])) {
                    const pid = item.product_id;
                    if (!salesByProduct[pid]) salesByProduct[pid] = { qty: 0, revenue: 0 };
                    salesByProduct[pid].qty     += Number(item.quantity    || 0);
                    salesByProduct[pid].revenue += Number(item.extend_price || 0);
                }
            }

            // Build ranked list
            let ranked = Object.entries(salesByProduct)
                .map(([pid, agg]) => {
                    const p   = productMap.get(Number(pid)) || {};
                    const s   = storeMap.get(p.store_id)   || {};
                    const storeCodeMatch = storeCode ? (s.store_code === storeCode) : true;
                    return storeCodeMatch ? {
                        pid:      Number(pid),
                        store:    s.name     || '-',
                        name:     p.name     || `Product#${pid}`,
                        category: s.category || '-',
                        qty:      agg.qty,
                        revenue:  agg.revenue,
                    } : null;
                })
                .filter(Boolean)
                .sort((a, b) => b.qty - a.qty)
                .slice(0, Number(topN) || 10)
                .map((r, i) => ({ ...r, rank: i + 1 }));

            setRows(ranked);
        } catch (e) {
            showToast?.(getApiErrorMessage(e, 'Failed to generate report'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={lovOpen} onClose={() => setLovOpen(false)} title="Store"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Store Name' }, { key: 'category', label: 'Category' }]}
                data={lovStores}
                onSelect={r => { setStore(`${r.id} – ${r.name}`); setLovOpen(false); }} />
            <PageHeader title="Top Selling Products" subtitle="Analyze top best-selling products by quantity sold" />
            <FilterBar>
                <FilterField label="Store">
                    <LovInput value={store} onLov={() => setLovOpen(true)} placeholder="All stores..." />
                </FilterField>
                <FilterField label="Top N">
                    <Input type="number" value={topN} min="1" onChange={e => setTopN(e.target.value)} />
                </FilterField>
                <FilterField label="Date From">
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </FilterField>
                <FilterField label="Date To">
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </FilterField>
                <Btn onClick={handleGenerate} disabled={loading}>
                    <BarChart3 className="w-4 h-4" /> {loading ? 'Loading…' : 'Generate'}
                </Btn>
            </FilterBar>
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-current/60 text-sm">Calculating top products…</div>
                ) : (
                    <Table headers={[
                        { label: 'Rank', center: true }, { label: 'Store' }, { label: 'Product' },
                        { label: 'Category' }, { label: 'Qty Sold', right: true }, { label: 'Revenue', right: true },
                    ]}>
                        {rows.length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-current/50 text-sm">
                                {generated ? 'No sales data found' : 'Set filters and click Generate'}
                            </td></tr>
                        ) : rows.map(p => (
                            <Tr key={p.pid}>
                                <Td center><RankBadge rank={p.rank} /></Td>
                                <Td>{p.store}</Td>
                                <Td bold>{p.name}</Td>
                                <Td>{p.category}</Td>
                                <Td right bold>{p.qty.toLocaleString()}</Td>
                                <Td right bold className="text-emerald-700 dark:text-emerald-400">฿{p.revenue.toLocaleString()}</Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
