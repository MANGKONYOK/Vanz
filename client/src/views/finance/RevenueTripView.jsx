import { useState } from 'react';
import { Plus, Save, Trash2, DollarSign, History, Search } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, StatCard, Input } from '../../components/ui';
import { MOCK_REVENUE_PER_TRIP } from '../../data/mockData';

export default function RevenueTripView({ showToast }) {
    const [rates, setRates] = useState(MOCK_REVENUE_PER_TRIP);
    const [search, setSearch] = useState('');

    const handleUpdateRate = (id, field, value) => {
        setRates(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleAddRate = () => {
        const today = new Date().toISOString().split('T')[0];
        const newRate = {
            id: Date.now(),
            date: today,
            revenue: 45, // Default to a standard rate
            notes: 'New Rate Adjustment'
        };
        setRates([newRate, ...rates]);
        showToast('New rate row added!', 'success');
    };

    const handleDeleteRate = (id) => {
        setRates(prev => prev.filter(r => r.id !== id));
        showToast('Rate record deleted.', 'info');
    };

    const handleSaveRate = (rate) => {
        if (!rate.date) {
            return showToast('Please select a valid date', 'error');
        }
        if (rate.revenue < 0) {
            return showToast('Rate cannot be negative', 'error');
        }
        showToast(`Rate of ฿${rate.revenue} saved successfully!`, 'success');
    };

    // Filter rates
    const filteredRates = rates.filter(r => 
        r.date.includes(search) || 
        r.notes.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate current rate by sorting chronologically
    const sortedRates = [...rates].sort((a, b) => new Date(a.date) - new Date(b.date));
    const currentRate = sortedRates[sortedRates.length - 1];

    // Sort rates for display in descending order (most recent first)
    const displayRates = [...filteredRates].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="fade-in space-y-5">
            <PageHeader 
                title="Revenue Per Trip" 
                subtitle="Track delivery fee rate changes over time"
                action={
                    <Btn onClick={handleAddRate}>
                        <Plus className="w-4 h-4" /> Add Rate
                    </Btn>
                } 
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <StatCard 
                    label="Current Rate" 
                    value={currentRate ? `฿${currentRate.revenue}` : '฿0'} 
                    icon={<DollarSign size={18} />} 
                    sub={currentRate ? `Effective ${currentRate.date}` : 'No effective rate'} 
                    color="green" 
                />
                <StatCard 
                    label="Rate Changes" 
                    value={rates.length} 
                    icon={<History size={18} />} 
                    sub="Total adjustments" 
                    color="blue" 
                />
            </div>

            <Card className="overflow-hidden">
                <CardHeader 
                    search={
                        <Input 
                            icon={Search} 
                            placeholder="Search date, notes..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            className="bg-white border-slate-200 h-10 shadow-sm" 
                        />
                    }
                />
                <Table 
                    headers={[
                        { label: <>Effective Date <span className="text-red-500 ml-0.5">*</span></>, width: '25%' }, 
                        { label: <>Rate Per Trip <span className="text-red-500 ml-0.5">*</span></>, right: true, width: '25%' }, 
                        { label: 'Notes', width: '35%' }, 
                        { label: 'Actions', center: true, width: '15%' }
                    ]}
                    minWidth="600px"
                >
                    {displayRates.map((r) => (
                        <Tr key={r.id}>
                            <Td>
                                <Input 
                                    type="date" 
                                    value={r.date} 
                                    onChange={e => handleUpdateRate(r.id, 'date', e.target.value)}
                                    className="font-mono bg-white border-slate-200 focus:border-red-400" 
                                />
                            </Td>
                            <Td right>
                                <Input 
                                    type="number" 
                                    value={r.revenue} 
                                    onChange={e => handleUpdateRate(r.id, 'revenue', Number(e.target.value))}
                                    className="text-right font-bold bg-white border-slate-200 focus:border-red-400" 
                                    placeholder="0"
                                />
                            </Td>
                            <Td>
                                <Input 
                                    value={r.notes} 
                                    onChange={e => handleUpdateRate(r.id, 'notes', e.target.value)}
                                    placeholder="e.g. Q2 adjustment" 
                                    className="bg-white border-slate-200 focus:border-red-400"
                                />
                            </Td>
                            <Td center>
                                <div className="flex items-center justify-center gap-1.5">
                                    <Btn 
                                        size="sm" 
                                        variant="secondary" 
                                        onClick={() => handleSaveRate(r)}
                                        className="hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                                        title="Save Rate"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                    </Btn>
                                    <button 
                                        onClick={() => handleDeleteRate(r.id)} 
                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                        title="Delete Rate"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                    {displayRates.length === 0 && (
                        <Tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-medium">
                                No rate records found.
                            </td>
                        </Tr>
                    )}
                </Table>
            </Card>
        </div>
    );
}
