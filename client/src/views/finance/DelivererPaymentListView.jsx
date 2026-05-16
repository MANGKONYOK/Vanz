import { Plus, Edit2, Trash2 } from 'lucide-react';
import { PageHeader, Btn, Card, Table, Tr, Td, Badge } from '../../components/ui';

export default function DelivererPaymentListView({ onNavigate, showToast }) {
    return (
        <div className="fade-in space-y-5">
            <PageHeader title="Deliverer Payments" subtitle="Process and view deliverer payments"
                action={<Btn onClick={onNavigate}><Plus className="w-4 h-4" /> Create Payment</Btn>} />
            <Card>
                <Table headers={[{ label: 'Period' }, { label: 'Date' }, { label: 'Deliverer' }, { label: 'Status', center: true }, { label: 'Amount', right: true }, { label: 'Actions', right: true }]}>
                    <Tr>
                        <Td>Mar 2026</Td><Td>2026-03-24</Td><Td bold>Somchai J.</Td><Td center><Badge color="green">Paid</Badge></Td><Td right bold>฿2,450</Td>
                        <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                                <Btn size="sm" variant="secondary" onClick={() => onNavigate()}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                <Btn size="sm" variant="danger" onClick={() => showToast('Payment record deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                            </div>
                        </td>
                    </Tr>
                     <Tr>
                        <Td>Mar 2026</Td><Td>2026-03-22</Td><Td bold>Kittisak P.</Td><Td center><Badge color="green">Paid</Badge></Td><Td right bold>฿1,500</Td>
                        <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                                <Btn size="sm" variant="secondary" onClick={() => onNavigate()}><Edit2 className="w-3 h-3" /> Edit</Btn>
                                <Btn size="sm" variant="danger" onClick={() => showToast('Payment record deleted', 'error')}><Trash2 className="w-3 h-3" /> Delete</Btn>
                            </div>
                        </td>
                    </Tr>
                </Table>
            </Card>
        </div>
    );
}
