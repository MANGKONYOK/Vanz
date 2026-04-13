import { FileText, DollarSign, BarChart3, Calculator } from 'lucide-react';
import { PageHeader, Btn, Card, StatCard, FilterBar, FilterField, Input } from '../../../components/ui';
import { INITIAL_EXPENSE_VOUCHERS } from '../../../data/mockData';

export default function ExpenseSummaryReportView() {
    const count = INITIAL_EXPENSE_VOUCHERS.length;
    const sum = INITIAL_EXPENSE_VOUCHERS.reduce((acc, v) => acc + v.total, 0);
    const avg = count > 0 ? sum / count : 0;

    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Expense Summary" subtitle="Analyze total value and average of expense vouchers" />
            <FilterBar>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <Btn><Calculator className="w-4 h-4" /> Calculate</Btn>
            </FilterBar>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Vouchers (COUNT)" value={count} icon={<FileText size={18} />} sub="Vouchers in period" color="blue" />
                <StatCard label="Total Value (SUM)" value={`฿${sum.toLocaleString()}`} icon={<DollarSign size={18} />} sub="Across all vouchers" color="red" />
                <StatCard label="Average Value (AVG)" value={`฿${avg.toFixed(2)}`} icon={<BarChart3 size={18} />} sub="Per voucher" color="green" />
            </div>
            <Card className="p-5">
                <h3 className="font-bold text-slate-900 mb-3">Breakdown by Status & Categories</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 p-4 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-xs font-bold text-amber-600 uppercase">Submitted</p>
                        <p className="text-2xl font-black text-amber-700 mt-1">฿470</p>
                        <p className="text-xs text-amber-500">2 vouchers</p>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase">Approved</p>
                        <p className="text-2xl font-black text-emerald-700 mt-1">฿45</p>
                        <p className="text-xs text-emerald-500">1 voucher</p>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-bold text-slate-600 uppercase">Top Expense</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">Fuel</p>
                        <p className="text-xs text-slate-500">฿320 (62% of total)</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
