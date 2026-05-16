import { useState } from 'react';
import { Plus, Save, DollarSign, History, Search } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, StatCard, Input } from '../../components/ui';
import { MOCK_REVENUE_PER_TRIP } from '../../data/mockData';

export default function RevenueTripView({ showToast }) {
    const [rates, setRates] = useState(MOCK_REVENUE_PER_TRIP);
    const [search, setSearch] = useState('');

    const filteredRates = rates.filter(r => 
        r.date.includes(search) || 
        r.notes.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Revenue Per Trip" subtitle="Track delivery fee rate changes over time"
                action={<Btn onClick={() => setRates([{ id: Date.now(), date: '2026-03-23', revenue: 0, notes: '' }, ...rates])}><Plus className="w-4 h-4" /> Add Rate</Btn>} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <StatCard label="Current Rate" value={`฿${rates[rates.length - 1]?.revenue || 0}`} icon={<DollarSign size={18} />} sub={`Effective ${rates[rates.length - 1]?.date}`} color="green" />
                <StatCard label="Rate Changes" value={rates.length} icon={<History size={18} />} sub="Total adjustments" color="blue" />
            </div>
            <Card className="overflow-hidden">
                <CardHeader 
                    search={<Input icon={Search} placeholder="Search date, notes..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white border-slate-200 h-10 shadow-sm" />}
                />
                <Table headers={[{ label: 'Effective Date' }, { label: 'Rate Per Trip', right: true }, { label: 'Notes' }, { label: '', right: true }]}>
                    {filteredRates.map((r, i) => (
                        <Tr key={r.id}>
                            <td className="px-4 py-3"><input type="date" defaultValue={r.date} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 mono" /></td>
                            <td className="px-4 py-3 text-right"><input type="number" defaultValue={r.revenue} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 text-right w-24 font-bold" /></td>
                            <td className="px-4 py-3"><input defaultValue={r.notes} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-red-400 w-full" placeholder="Notes..." /></td>
                            <td className="px-4 py-3 text-right"><Btn size="sm" onClick={() => showToast('Rate saved!')}><Save className="w-3.5 h-3.5" /></Btn></td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
