import { Search, AlertCircle } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge, StatCard, FilterBar, FilterField, Input, Select } from '../../../components/ui';
import { INITIAL_EXPENSE_VOUCHERS } from '../../../data/mockData';

export default function UnapprovedVouchersReportView() {
    const unapproved = INITIAL_EXPENSE_VOUCHERS.filter(v => v.status === 'SUBMITTED' || v.status === 'DRAFT');
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Unapproved Vouchers" subtitle="Review and manage pending expense vouchers" />
            <FilterBar>
                <FilterField label="Date From"><Input type="date" defaultValue="2026-03-01" /></FilterField>
                <FilterField label="Date To"><Input type="date" defaultValue="2026-03-23" /></FilterField>
                <FilterField label="Total Amount"><Input type="number" placeholder="Amount" /></FilterField>
                <FilterField label="Status">
                    <Select><option value="">All</option><option value="SUBMITTED">Submitted</option><option value="DRAFT">Draft</option></Select>
                </FilterField>
                <Btn><Search className="w-4 h-4" /> Search</Btn>
            </FilterBar>
            <div className="mb-3">
                <StatCard label="Unapproved Vouchers" value={unapproved.length} icon={<AlertCircle size={18} />} sub="Awaiting approval" color="amber" />
            </div>
            <Card>
                <Table headers={[{ label: 'Voucher ID' }, { label: 'Deliverer' }, { label: 'Voucher Date' }, { label: 'Expense Items' }, { label: 'Total Amount', right: true }, { label: 'Status', center: true }]}>
                    {unapproved.map(v => (
                        <Tr key={v.id}>
                            <Td bold mono className="text-xs">{v.id}</Td>
                            <Td>{v.delivererName}</Td><Td>{v.date}</Td>
                            <Td><Badge color="gray">{v.items}</Badge></Td>
                            <Td right bold>฿{v.total}</Td>
                            <Td center><Badge color="amber">{v.status}</Badge></Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
