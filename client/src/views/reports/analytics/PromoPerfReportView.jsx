import { useState, useEffect } from 'react';
import { TrendingUp, Target } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, StatCard, FilterBar, FilterField, Input, LovInput, LovModal } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function PromoPerfReportView({ showToast }) {
    const [lovOpen,   setLovOpen]   = useState(false);
    const [store,     setStore]     = useState('');
    const [dateFrom,  setDateFrom]  = useState('');
    const [dateTo,    setDateTo]    = useState('');
    const [lovStores, setLovStores] = useState([]);
    const [rows,      setRows]      = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [generated, setGenerated] = useState(false);
    const [stats,     setStats]     = useState({ totalRevenue: 0, activeCampaigns: 0 });

    useEffect(() => {
        Promise.all([getJson('/stores').catch(() => [])]).then(([stores]) => {
            setLovStores((stores || []).map(s => ({ id: s.store_code, storeId: s.store_id, name: s.name, category: s.category || '-' })));
        }).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleGenerate = async () => {
        setLoading(true);
        setGenerated(true);
        try {
            const storeCode = String(store).split(' – ')[0].trim();
            const [promotions, orders, stores] = await Promise.all([
                storeCode ? getJson('/promotions', { store_code: storeCode }).catch(() => []) : getJson('/promotions').catch(() => []),
                getJson('/orders').catch(() => []),
                getJson('/stores').catch(() => []),
            ]);

            const storeMap = new Map((stores || []).map(s => [s.store_id, s]));
            const today = new Date().toISOString().slice(0, 10);

            // For each promotion, count orders in its period and revenue
            const result = (promotions || []).map(p => {
                const s = storeMap.get(p.store_id) || {};

                // Count orders from the store within the promo period
                const promoOrders = (orders || []).filter(o => {
                    const oDate = String(o.order_date || '').slice(0, 10);
                    if (o.store_id !== p.store_id) return false;
                    if (oDate < p.start_date || oDate > p.end_date) return false;
                    if (dateFrom && oDate < dateFrom) return false;
                    if (dateTo   && oDate > dateTo)   return false;
                    return true;
                });

                const revenue = promoOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);
                const promoProducts = (p.promotion_items || []).length;
                const isActive = today >= String(p.start_date).slice(0,10) && today <= String(p.end_date).slice(0,10);

                return {
                    id:           p.promotion_code,
                    name:         p.name,
                    store:        s.name || '-',
                    startDate:    String(p.start_date || '').slice(0, 10),
                    endDate:      String(p.end_date   || '').slice(0, 10),
                    discountType: p.discount_type,
                    orders:       promoOrders.length,
                    products:     promoProducts,
                    revenue,
                    isActive,
                };
            });

            const totalRevenue    = result.reduce((s, r) => s + r.revenue, 0);
            const activeCampaigns = result.filter(r => r.isActive).length;
            setStats({ totalRevenue, activeCampaigns });
            setRows(result);
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
            <PageHeader title="Promotion Performance" subtitle="Measure campaign revenue and conversion impact" />
            <FilterBar>
                <FilterField label="Store">
                    <LovInput value={store} onLov={() => setLovOpen(true)} placeholder="All stores..." />
                </FilterField>
                <FilterField label="Date From">
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </FilterField>
                <FilterField label="Date To">
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </FilterField>
                <Btn onClick={handleGenerate} disabled={loading}>
                    <TrendingUp className="w-4 h-4" /> {loading ? 'Loading…' : 'Generate'}
                </Btn>
            </FilterBar>
            {generated && !loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard label="Total Promo Revenue" value={`฿${stats.totalRevenue.toLocaleString()}`} icon={<TrendingUp size={18} />} sub="Across all campaigns" color="green" />
                    <StatCard label="Active Campaigns" value={stats.activeCampaigns} icon={<Target size={18} />} sub="Currently running" color="red" />
                </div>
            )}
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-current/60 text-sm">Calculating promotion performance…</div>
                ) : (
                    <Table headers={[
                        { label: 'Campaign' }, { label: 'Store' }, { label: 'Period' }, { label: 'Discount Type' },
                        { label: 'Orders Applied', right: true }, { label: 'Unique Products', right: true }, { label: 'Revenue Generated', right: true },
                    ]}>
                        {rows.length === 0 ? (
                            <tr><td colSpan={7} className="py-10 text-center text-current/50 text-sm">
                                {generated ? 'No promotions found' : 'Set filters and click Generate'}
                            </td></tr>
                        ) : rows.map(p => (
                            <Tr key={p.id}>
                                <Td bold>{p.name}</Td>
                                <Td>{p.store}</Td>
                                <Td className="text-xs">{p.startDate} → {p.endDate}</Td>
                                <Td>{p.discountType}</Td>
                                <Td right bold className="text-emerald-600 dark:text-emerald-400">{p.orders}</Td>
                                <Td right bold>{p.products}</Td>
                                <Td right bold className="text-emerald-700 dark:text-emerald-400">฿{p.revenue.toLocaleString()}</Td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
