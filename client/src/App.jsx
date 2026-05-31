import './App.css';
import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import AppHeader from './components/layout/AppHeader';
import ParticleBackground from './components/ui/ParticleBackground';
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
    const [promotionEditData, setPromotionEditData] = useState(null);
    const [orderEditData, setOrderEditData] = useState(null);
    const [expenseEditData, setExpenseEditData] = useState(null);
    const [paymentEditData, setPaymentEditData] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
    };

    return (
        <div className={`h-screen w-full bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 overflow-hidden overscroll-none transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
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
            <main 
                className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900 bg-grid-pattern relative transition-colors duration-300"
            >
                {/* Custom Canvas Particle Effect */}
                <ParticleBackground isDarkMode={isDarkMode} />

                <AppHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 main-scrollbar relative z-10">
                    <div className="max-w-5xl mx-auto">

                        {currentView === 'dashboard' && <DashboardView onNavigate={setCurrentView} />}

                        {/* Operations */}
                        {currentView === 'customer_order_list' && <CustomerOrderListView showToast={showToast} onNavigate={(data) => { setOrderEditData(data && data.id ? data : null); setCurrentView('customer_order_form'); }} />}
                        {currentView === 'customer_order_form' && <CustomerOrderFormView data={orderEditData} showToast={showToast} onNavigateBack={() => { setOrderEditData(null); setCurrentView('customer_order_list'); }} />}
                        {currentView === 'dispatch_form' && <DelivererDispatchView showToast={showToast} />}

                        {/* Finance */}
                        {currentView === 'expense_list' && <ExpenseListView showToast={showToast} onNavigate={(data) => { setExpenseEditData(data && data.id ? data : null); setCurrentView('expense_form'); }} />}
                        {currentView === 'expense_form' && <ExpenseFormView data={expenseEditData} onNavigateBack={() => { setExpenseEditData(null); setCurrentView('expense_list'); }} showToast={showToast} />}
                        {currentView === 'payment_list' && <DelivererPaymentListView showToast={showToast} onNavigate={(data) => { setPaymentEditData(data && data.id ? data : null); setCurrentView('payment_form'); }} />}
                        {currentView === 'payment_form' && <DelivererPaymentView data={paymentEditData} showToast={showToast} onNavigateBack={() => { setPaymentEditData(null); setCurrentView('payment_list'); }} />}
                        {currentView === 'revenue_trip' && <RevenueTripView showToast={showToast} />}

                        {/* Master Data */}
                        {currentView === 'customer_list' && <CustomerListView showToast={showToast} />}
                        {currentView === 'deliverer_list' && <DelivererListView showToast={showToast} />}
                        {currentView === 'store_list' && <StoreListView showToast={showToast} />}
                        {currentView === 'product_list' && <ProductListView showToast={showToast} />}
                        {currentView === 'promotion_list' && <PromotionListView showToast={showToast} onNavigate={(data) => { setPromotionEditData(data || null); setCurrentView('promotion_form'); }} />}
                        {currentView === 'promotion_form' && <PromotionFormView data={promotionEditData} onNavigateBack={() => { setPromotionEditData(null); setCurrentView('promotion_list'); }} showToast={showToast} />}

                        {/* Simple Reports */}
                        {currentView === 'report_delivered_orders' && <DeliveredOrdersReportView showToast={showToast} />}
                        {currentView === 'report_order_receipt' && <OrderReceiptView showToast={showToast} />}
                        {currentView === 'report_store_products' && <StoreProductsReportView showToast={showToast} />}
                        {currentView === 'report_fav_stores' && <FavStoresReportView showToast={showToast} />}
                        {currentView === 'report_unapproved_vouchers' && <UnapprovedVouchersReportView showToast={showToast} />}
                        {currentView === 'report_deliverer_ranking' && <DelivererRankingReportView showToast={showToast} />}
                        {currentView === 'report_deliverer_history' && <DelivererHistoryReportView showToast={showToast} />}
                        {currentView === 'report_category_products' && <CategoryProductsReportView showToast={showToast} />}

                        {/* Analytics Reports */}
                        {currentView === 'report_top_products' && <ReportTopProductsView showToast={showToast} />}
                        {currentView === 'report_top_deliverers' && <TopDeliverersReportView showToast={showToast} />}
                        {currentView === 'report_expense_summary' && <ExpenseSummaryReportView showToast={showToast} />}
                        {currentView === 'report_promo_perf' && <PromoPerfReportView showToast={showToast} />}


                    </div>
                </div>
            </main>
        </div>
    );
}
