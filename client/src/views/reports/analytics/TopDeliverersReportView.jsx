import { useState, useEffect } from 'react';
import { Award, Star } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, RankBadge, FilterBar, FilterField, Input } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function TopDeliverersReportView({ showToast }) {
    const [rows,     setRows]     = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [topN,     setTopN]     = useState(10);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo,   setDateTo]   = useState('');
    const [generated, setGenerated] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setGenerated(true);
        try {
            const [deliveries, deliverers, profiles, payments] = await Promise.all([
                getJson('/deliveries').catch(() => []),
                getJson('/deliverers').catch(() => []),
                getJson('/profiles').catch(() => []),
                getJson('/payments').catch(() => []),
            ]);

            const profileMap  = new Map(profiles.map(p => [p.profile_id, p]));
            const delivererMap = new Map(deliverers.map(d => [d.deliverer_id, d]));

            // Count deliveries per deliverer within date range
            const deliveryCount = {};
            for (const d of (deliveries || [])) {
                const dateStr = String(d.delivery_time || d.pickup_time || '').slice(0, 10);
                if (dateFrom && dateStr < dateFrom) continue;
                if (dateTo   && dateStr > dateTo)   continue;
                deliveryCount[d.deliverer_id] = (deliveryCount[d.deliverer_id] || 0) + 1;
            }

            // Sum earnings per deliverer from payment items
            const earningsByDeliverer = {};
            for (const pay of (payments || [])) {
                // Find the deliverer via delivery
                const delivery = (deliveries || []).find(d => d.delivery_id === pay.delivery_id);
                if (!delivery) continue;
                const did = delivery.deliverer_id;
                const earned = (pay.payment_items || []).reduce((s, i) =>
                    s + Number(i.delivery_fee || 0) + Number(i.bonus || 0) + Number(i.adjustment_amount || 0), 0);
                earningsByDeliverer[did] = (earningsByDeliverer[did] || 0) + earned;
            }

            const ranked = Object.entries(deliveryCount)
                .map(([did, count]) => {
                    const d    = delivererMap.get(Number(did)) || {};
                    const prof = profileMap.get(d.profile_id) || {};
                    return {
                        id:        Number(did),
                        name:      prof.full_name || d.deliverer_code || `Deliverer#${did}`,
                        type:      d.vehicle_type || '—',
                        deliveries: count,
                        earnings:  earningsByDeliverer[Number(did)] || 0,
                        rating:    Number(d.rating || 0),
                    };
                })
                .sort((a, b) => b.deliveries - a.deliveries)
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
            <PageHeader title="Top Deliverers" subtitle="Analyze top deliverers with the most deliveries" />
            <FilterBar>
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
                    <Award className="w-4 h-4" /> {loading ? 'Loading…' : 'Generate'}
                </Btn>
            </FilterBar>
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 dark:text-gray-300 text-sm">Calculating top deliverers…</div>
                ) : (
                    <Table headers={[
                        { label: 'Rank', center: true }, { label: 'Deliverer' }, { label: 'Vehicle' },
                        { label: 'Deliveries', right: true }, { label: 'Total Earnings', right: true }, { label: 'Rating', right: true },
                    ]}>
                        {rows.length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-slate-500 dark:text-gray-300 text-sm">
                                {generated ? 'No delivery data found' : 'Set filters and click Generate'}
                            </td></tr>
                        ) : rows.map(d => (
                            <Tr key={d.id}>
                                <Td center><RankBadge rank={d.rank} /></Td>
                                <Td bold>{d.name}</Td>
                                <Td>{d.type}</Td>
                                <Td right bold>{d.deliveries}</Td>
                                <Td right bold className="text-emerald-600 dark:text-emerald-400">฿{d.earnings.toLocaleString()}</Td>
                                <td className="px-4 py-3 text-right">
                                    <span className="flex items-center justify-end gap-1 font-bold text-amber-600 dark:text-amber-400">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />{d.rating.toFixed(1)}
                                    </span>
                                </td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
