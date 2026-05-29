import { useState, useEffect } from 'react';
import { Search, Star } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, RankBadge, FilterBar, FilterField, Input, Select, LovInput, LovModal } from '../../../components/ui';
import { getJson, getApiErrorMessage } from '../../../api/http';

export default function DelivererRankingReportView({ showToast }) {
    const [rows,       setRows]       = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [lovOpen,    setLovOpen]    = useState(false);
    const [deliverer,  setDeliverer]  = useState('');
    const [vehicleFilter, setVehicleFilter] = useState('');
    const [minRating,  setMinRating]  = useState('');
    const [lovData,    setLovData]    = useState([]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getJson('/deliverers').catch(() => []),
            getJson('/profiles').catch(() => []),
        ]).then(([deliverers, profiles]) => {
            if (cancelled) return;
            const profileMap = new Map(profiles.map(p => [p.profile_id, p]));
            const mapped = (deliverers || []).map(d => {
                const prof = profileMap.get(d.profile_id) || {};
                return {
                    id:      d.deliverer_code,
                    name:    prof.full_name || d.deliverer_code,
                    type:    d.vehicle_type || '—',
                    rating:  Number(d.rating || 0),
                    status:  d.current_status || '—',
                };
            });
            setLovData(mapped);
            setRows(mapped);
        }).catch(e => {
            if (!cancelled) showToast?.(getApiErrorMessage(e, 'Failed to load deliverers'), 'error');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = rows
        .filter(d => {
            if (deliverer) {
                const code = String(deliverer).split(' – ')[0].trim();
                if (d.id !== code) return false;
            }
            if (vehicleFilter && d.type !== vehicleFilter) return false;
            if (minRating && d.rating < Number(minRating)) return false;
            return true;
        })
        .sort((a, b) => b.rating - a.rating);

    const vehicleTypes = [...new Set(rows.map(d => d.type).filter(Boolean))];

    return (
        <div className="fade-in space-y-5">
            <LovModal isOpen={lovOpen} onClose={() => setLovOpen(false)} title="Deliverer"
                columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Vehicle' }]}
                data={lovData}
                onSelect={r => { setDeliverer(`${r.id} – ${r.name}`); setLovOpen(false); }} />
            <PageHeader title="Deliverer Ranking" subtitle="Rank deliverers based on their average rating" />
            <FilterBar>
                <FilterField label="Deliverer">
                    <LovInput value={deliverer} onLov={() => setLovOpen(true)} placeholder="Select deliverer..." />
                </FilterField>
                <FilterField label="Vehicle Type">
                    <Select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}>
                        <option value="">All Types</option>
                        {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                </FilterField>
                <FilterField label="Min Rating">
                    <Input type="number" step="0.1" min="0" max="5" placeholder="e.g. 4.0"
                        value={minRating} onChange={e => setMinRating(e.target.value)} />
                </FilterField>
                <Btn onClick={() => { setDeliverer(''); setVehicleFilter(''); setMinRating(''); }}>
                    <Search className="w-4 h-4" /> Reset
                </Btn>
            </FilterBar>
            <Card>
                {loading ? (
                    <div className="py-12 text-center text-current/60 text-sm">Loading deliverers…</div>
                ) : (
                    <Table headers={[
                        { label: 'Rank', center: true }, { label: 'Deliverer Name' }, { label: 'Vehicle Type' },
                        { label: 'Status' }, { label: 'Rating', right: true },
                    ]}>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} className="py-10 text-center text-current/50 text-sm">No deliverers found</td></tr>
                        ) : filtered.map((d, i) => (
                            <Tr key={d.id}>
                                <Td center><RankBadge rank={i + 1} /></Td>
                                <Td bold>{d.name}</Td>
                                <Td>{d.type}</Td>
                                <Td><span className="text-xs font-semibold text-current/60">{d.status}</span></Td>
                                <td className="px-4 py-3 text-right">
                                    <span className="flex items-center justify-end gap-1 font-bold text-amber-600">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />{d.rating.toFixed(1)}
                                        <div className="ml-2 h-2 rounded-full bg-amber-100 w-24">
                                            <div className="h-2 rounded-full bg-amber-400" style={{ width: `${(d.rating / 5) * 100}%` }} />
                                        </div>
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
