import './App.css';
import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';
import {
    DashboardView,
    CustomerOrderListView, CustomerOrderFormView, DelivererDispatchView,
    ExpenseListView, ExpenseFormView, DelivererPaymentListView, DelivererPaymentView, RevenueTripView,
    CustomerListView, DelivererListView, StoreListView, ProductListView, PromotionListView, PromotionFormView,
    DeliveredOrdersReportView, OrderReceiptView, StoreProductsReportView, FavStoresReportView,
    UnapprovedVouchersReportView, DelivererRankingReportView, DelivererHistoryReportView, CategoryProductsReportView,
    ReportTopProductsView, TopDeliverersReportView, ExpenseSummaryReportView, PromoPerfReportView,
} from './views';

export default function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard');
    const [expandedNav, setExpandedNav] = useState({ simple: true, analytics: true });
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
    };

    return (
        <div className="h-screen w-full bg-slate-50 flex font-sans text-slate-800 overflow-hidden overscroll-none">
            {/* Toast */}
            {toast.visible && (
                <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border toast-in ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <span className="text-sm font-semibold">{toast.message}</span>
                </div>
            )}

            {/* Sidebar */}
            <Sidebar
                isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
                currentView={currentView} setCurrentView={setCurrentView}
                expandedNav={expandedNav} setExpandedNav={setExpandedNav}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative">
                <AppHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 main-scrollbar">
                    <div className="max-w-5xl mx-auto">

                        {currentView === 'dashboard' && <DashboardView onNavigate={setCurrentView} />}

                        {/* Operations */}
                        {currentView === 'customer_order_list' && <CustomerOrderListView showToast={showToast} onNavigate={(data) => setCurrentView('customer_order_form')} />}
                        {currentView === 'customer_order_form' && <CustomerOrderFormView showToast={showToast} onNavigateBack={() => setCurrentView('customer_order_list')} />}
                        {currentView === 'dispatch_form' && <DelivererDispatchView showToast={showToast} />}

                        {/* Finance */}
                        {currentView === 'expense_list' && <ExpenseListView onNavigate={() => setCurrentView('expense_form')} />}
                        {currentView === 'expense_form' && <ExpenseFormView onNavigateBack={() => setCurrentView('expense_list')} showToast={showToast} />}
                        {currentView === 'payment_list' && <DelivererPaymentListView showToast={showToast} onNavigate={() => setCurrentView('payment_form')} />}
                        {currentView === 'payment_form' && <DelivererPaymentView showToast={showToast} onNavigateBack={() => setCurrentView('payment_list')} />}
                        {currentView === 'revenue_trip' && <RevenueTripView showToast={showToast} />}

                        {/* Master Data */}
                        {currentView === 'customer_list' && <CustomerListView showToast={showToast} />}
                        {currentView === 'deliverer_list' && <DelivererListView showToast={showToast} />}
                        {currentView === 'store_list' && <StoreListView showToast={showToast} />}
                        {currentView === 'product_list' && <ProductListView showToast={showToast} />}
                        {currentView === 'promotion_list' && <PromotionListView onNavigate={() => setCurrentView('promotion_form')} />}
                        {currentView === 'promotion_form' && <PromotionFormView onNavigateBack={() => setCurrentView('promotion_list')} showToast={showToast} />}

                        {/* Simple Reports */}
                        {currentView === 'report_delivered_orders' && <DeliveredOrdersReportView />}
                        {currentView === 'report_order_receipt' && <OrderReceiptView />}
                        {currentView === 'report_store_products' && <StoreProductsReportView />}
                        {currentView === 'report_fav_stores' && <FavStoresReportView />}
                        {currentView === 'report_unapproved_vouchers' && <UnapprovedVouchersReportView />}
                        {currentView === 'report_deliverer_ranking' && <DelivererRankingReportView />}
                        {currentView === 'report_deliverer_history' && <DelivererHistoryReportView />}
                        {currentView === 'report_category_products' && <CategoryProductsReportView />}

                        {/* Analytics Reports */}
                        {currentView === 'report_top_products' && <ReportTopProductsView />}
                        {currentView === 'report_top_deliverers' && <TopDeliverersReportView />}
                        {currentView === 'report_expense_summary' && <ExpenseSummaryReportView />}
                        {currentView === 'report_promo_perf' && <PromoPerfReportView />}

                    </div>
                </div>
            </main>
        </div>
    );
}
