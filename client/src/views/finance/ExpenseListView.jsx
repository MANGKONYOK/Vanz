import { Plus } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge } from '../../components/ui';
import { INITIAL_EXPENSE_VOUCHERS } from '../../data/mockData';

export default function ExpenseListView({ onNavigate }) {
    return (
        <div className="fade-in">
            <PageHeader title="Expense Vouchers" subtitle="Manage deliverer reimbursement claims"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Voucher</Btn>} />
            <Card>
                <Table headers={[{ label: 'Voucher ID' }, { label: 'Date' }, { label: 'Deliverer' }, { label: 'Status', center: true }, { label: 'Amount', right: true }]}>
                    {INITIAL_EXPENSE_VOUCHERS.map(v => (
                        <Tr key={v.id}>
                            <Td className="font-semibold text-red-600 mono">{v.id}</Td>
                            <Td>{v.date}</Td>
                            <Td bold>{v.delivererName}</Td>
                            <Td center><Badge color={v.status === 'APPROVED' ? 'green' : v.status === 'REJECTED' ? 'red' : 'amber'}>{v.status}</Badge></Td>
                            <Td right bold>฿{v.total}</Td>
                        </Tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
}
