import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge } from '../../components/ui';
import { getJson, deleteJson, getApiErrorMessage } from '../../api/http';

const TYPE_LABEL = { PERCENTAGE: 'Percentage', FIXED_AMOUNT: 'Fixed Amount' };

export default function PromotionListView({ onNavigate, showToast }) {
    const [rows,    setRows]    = useState([]);
    const [loading, setLoading] = useState(false);
    const [tick,    setTick]    = useState(0);

    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/promotions').catch(() => []),
            getJson('/stores').catch(() => []),
        ]).then(([promotions, stores]) => {
            if (cancelled) return;
            const storeMap = new Map((stores || []).map(s => [s.store_id, s]));
            setRows((promotions || []).map(p => {
                const store = storeMap.get(p.store_id) || {};
                const today = new Date().toISOString().slice(0, 10);
                const status = today >= p.start_date && today <= p.end_date ? 'ACTIVE' : today < p.start_date ? 'UPCOMING' : 'EXPIRED';
                return {
                    id:           p.promotion_code,
                    promotionId:  p.promotion_id,
                    name:         p.name,
                    store:        store.name || `Store#${p.store_id}`,
                    startDate:    String(p.start_date || '').slice(0, 10),
                    endDate:      String(p.end_date   || '').slice(0, 10),
                    discountType: TYPE_LABEL[p.discount_type] || p.discount_type,
                    status,
                };
            }));
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load promotions'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async (row) => {
        if (!window.confirm(`Delete promotion ${row.id} — ${row.name}?`)) return;
        try {
            await deleteJson(`/promotions/${row.id}`);
            showToast?.(`Promotion ${row.id} deleted`);
            refresh();
        } catch (e) {
            showToast?.(getApiErrorMessage(e, 'Delete failed'), 'error');
        }
    };

    const STATUS_COLOR = { ACTIVE: 'green', UPCOMING: 'blue', EXPIRED: 'gray' };

    return (
        <div className="fade-in">
            <PageHeader title="Promotions" subtitle="Manage store promotional campaigns"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Promotion</Btn>} />
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-slate-500 text-sm">Loading promotions…</div>
                ) : (
                    <Table headers={[
                        { label: 'Code' }, { label: 'Campaign Name' }, { label: 'Store' },
                        { label: 'Period' }, { label: 'Type' }, { label: 'Status', center: true }, { label: '' },
                    ]}>
                        {rows.length === 0 ? (
                            <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">No promotions found</td></tr>
                        ) : rows.map(p => (
                            <Tr key={p.id}>
                                <Td mono className="text-xs">{p.id}</Td>
                                <Td bold>{p.name}</Td>
                                <Td>{p.store}</Td>
                                <Td className="text-xs">{p.startDate} → {p.endDate}</Td>
                                <Td>{p.discountType}</Td>
                                <Td center><Badge color={STATUS_COLOR[p.status] || 'gray'}>{p.status}</Badge></Td>
                                <td className="px-4 py-3 text-right">
                                    <Btn size="sm" variant="danger" onClick={() => handleDelete(p)}>
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </Btn>
                                </td>
                            </Tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}
