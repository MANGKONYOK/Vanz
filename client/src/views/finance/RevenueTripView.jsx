import { useState, useEffect } from 'react';
import { Plus, Save, Trash2, DollarSign, History, Search } from 'lucide-react';
import { PageHeader, Btn, Card, CardHeader, Table, Tr, Td, StatCard, Input } from '../../components/ui';

const INITIAL_REVENUE_PER_TRIP = [
    { id: 1, date: '2026-01-01', revenue: 40, notes: 'Initial rate' },
    { id: 2, date: '2026-03-01', revenue: 45, notes: 'Q1 adjustment' },
];

export default function RevenueTripView({ showToast }) {
    // 1. Officially saved/applied rates
    const [savedRates, setSavedRates] = useState(() => {
        const stored = localStorage.getItem('revenue_per_trip_rates');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }
        }
        return INITIAL_REVENUE_PER_TRIP;
    });

    // 2. Row input states currently being edited
    const [rates, setRates] = useState(() => {
        const storedEditing = localStorage.getItem('revenue_per_trip_editing_rates');
        if (storedEditing) {
            try {
                return JSON.parse(storedEditing);
            } catch (e) {
                console.error(e);
            }
        }
        // Fallback to saved/applied rates
        const stored = localStorage.getItem('revenue_per_trip_rates');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }
        }
        return INITIAL_REVENUE_PER_TRIP;
    });

    // Save savedRates to localStorage whenever they are applied
    useEffect(() => {
        localStorage.setItem('revenue_per_trip_rates', JSON.stringify(savedRates));
    }, [savedRates]);

    // Save rates editing state to localStorage so they don't lose typed progress on refresh
    useEffect(() => {
        localStorage.setItem('revenue_per_trip_editing_rates', JSON.stringify(rates));
    }, [rates]);

    const [search, setSearch] = useState('');

    const handleUpdateRate = (id, field, value) => {
        setRates(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleAddRate = () => {
        const today = new Date().toISOString().split('T')[0];
        const newRate = {
            id: Date.now(),
            date: today,
            revenue: 0,
            notes: ''
        };
        setRates([newRate, ...rates]);
        showToast('New rate row added (Unsaved Draft)!', 'info');
    };

    const handleDeleteRate = (id) => {
        setRates(prev => prev.filter(r => r.id !== id));
        setSavedRates(prev => prev.filter(r => r.id !== id));
        showToast('Rate record deleted.', 'info');
    };

    const handleSaveRate = (rate) => {
        if (!rate.date) {
            return showToast('Please select a valid date', 'error');
        }
        if (rate.revenue < 0) {
            return showToast('Rate cannot be negative', 'error');
        }
        
        // Save/Apply this specific rate to savedRates
        setSavedRates(prev => {
            const exists = prev.some(r => r.id === rate.id);
            if (exists) {
                return prev.map(r => r.id === rate.id ? rate : r);
            } else {
                return [rate, ...prev];
            }
        });

        showToast(`Rate of ฿${rate.revenue} saved and applied successfully!`, 'success');
    };

    const isRowSaved = (rate) => {
        const saved = savedRates.find(r => r.id === rate.id);
        if (!saved) return false;
        return saved.date === rate.date && saved.revenue === rate.revenue && saved.notes === rate.notes;
    };

    // Filter rates
    const filteredRates = rates.filter(r => 
        r.date.includes(search) || 
        r.notes.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate current rate from SAVED rates only (sorted chronologically, secondary sort by id/timestamp ascending)
    const sortedSavedRates = [...savedRates].sort((a, b) => {
        const dateDiff = new Date(a.date) - new Date(b.date);
        if (dateDiff !== 0) return dateDiff;
        return a.id - b.id; // Newest id/timestamp last
    });
    const currentRate = sortedSavedRates[sortedSavedRates.length - 1];

    // Sort rates for display in descending order (most recent first, secondary sort by id descending)
    const displayRates = [...filteredRates].sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return b.id - a.id; // Newest id/timestamp first
    });

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
                    value={savedRates.length} 
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
                            className="h-10 shadow-sm" 
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
                                    className="font-mono" 
                                />
                            </Td>
                            <Td right>
                                <Input 
                                    type="number" 
                                    value={r.revenue} 
                                    onChange={e => handleUpdateRate(r.id, 'revenue', Number(e.target.value))}
                                    className="text-right font-bold" 
                                    placeholder="0"
                                />
                            </Td>
                            <Td>
                                <Input 
                                    value={r.notes} 
                                    onChange={e => handleUpdateRate(r.id, 'notes', e.target.value)}
                                    placeholder="write..." 
                                />
                            </Td>
                            <Td center>
                                <div className="flex items-center justify-center gap-1.5">
                                    <Btn 
                                        size="sm" 
                                        variant={isRowSaved(r) ? "secondary" : "primary"} 
                                        onClick={() => handleSaveRate(r)}
                                        className={isRowSaved(r) 
                                            ? "hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-650 dark:hover:text-slate-400 transition-colors" 
                                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md border-none"
                                        }
                                        title={isRowSaved(r) ? "Saved (No Changes)" : "Unsaved Changes — Click to Save & Apply"}
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                    </Btn>
                                    <button 
                                        onClick={() => handleDeleteRate(r.id)} 
                                        className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all duration-200"
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
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-gray-300 font-medium">
                                No rate records found.
                            </td>
                        </Tr>
                    )}
                </Table>
            </Card>
        </div>
    );
}
