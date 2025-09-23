import React, { useState, useMemo } from 'react';
import { Order, Sale, Product, Category } from '../types';
import DashboardCard from '../components/DashboardCard';
import SalesChart from '../components/SalesChart';
import { ChartBarIcon, ShoppingCartIcon, PackageIcon, UsersIcon } from '../components/icons';
import { formatCurrency } from '../format';

interface ReportsPageProps {
    orders: Order[];
    products: Product[];
    categories: Category[];
}

type Timeframe = 'today' | 'week' | 'month' | 'year';

const ReportsPage: React.FC<ReportsPageProps> = ({ orders, products, categories }) => {
    const [timeframe, setTimeframe] = useState<Timeframe>('month');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [productFilter, setProductFilter] = useState('all');

    const filteredOrders = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let startDate: Date;

        switch (timeframe) {
            case 'today':
                startDate = today;
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay());
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1);
                break;
        }

        return orders.filter(order => {
            const orderDate = new Date(order.date);
            if (orderDate < startDate) return false;

            const hasMatchingItem = order.items.some(item => {
                const categoryMatch = categoryFilter === 'all' || item.categoryId === categoryFilter;
                const productMatch = productFilter === 'all' || item.productId === productFilter;
                return categoryMatch && productMatch;
            });

            return hasMatchingItem;
        });
    }, [orders, timeframe, categoryFilter, productFilter]);
    
    const { totalRevenue, totalSales, totalItemsSold } = useMemo(() => {
        return filteredOrders.reduce((acc, order) => {
            acc.totalRevenue += order.total;
            acc.totalSales += 1;
            acc.totalItemsSold += order.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0);
            return acc;
        }, { totalRevenue: 0, totalSales: 0, totalItemsSold: 0 });
    }, [filteredOrders]);


    const chartData = useMemo(() => {
        const formatters: { [key in Timeframe]: (date: Date) => string } = {
            today: date => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            week: date => date.toLocaleDateString([], { weekday: 'short' }),
            month: date => date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
            year: date => date.toLocaleDateString([], { month: 'short' }),
        };

        const aggregationMap = new Map<string, number>();

        filteredOrders.forEach(order => {
            const key = formatters[timeframe](new Date(order.date));
            aggregationMap.set(key, (aggregationMap.get(key) || 0) + order.total);
        });

        return Array.from(aggregationMap.entries()).map(([date, amount]) => ({ date, amount })).reverse();
    }, [filteredOrders, timeframe]);

    const getFilterTitle = () => {
        let title = '';
        if (productFilter !== 'all') {
            title = products.find(p => p.id === productFilter)?.name || '';
        } else if (categoryFilter !== 'all') {
            title = categories.find(c => c.id === categoryFilter)?.name || '';
        } else {
            title = 'Overall';
        }

        const timeframeText = timeframe.charAt(0).toUpperCase() + timeframe.slice(1);
        return `${timeframeText} Sales Trend for ${title}`;
    };

    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
                <p className="text-gray-400">View your business performance and sales data.</p>
            </header>

            {/* Filters Bar */}
            <div className="bg-gray-800 p-4 rounded-xl shadow-lg mb-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-1 bg-gray-700 p-1 rounded-lg">
                    {(['today', 'week', 'month', 'year'] as Timeframe[]).map(t => (
                        <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timeframe === t ? 'bg-sky-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                           {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setProductFilter('all'); }} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm">
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm" disabled={categoryFilter === 'all'}>
                    <option value="all">All Products in Category</option>
                    {products.filter(p => p.categoryId === categoryFilter).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <DashboardCard 
                    icon={ChartBarIcon}
                    title="Total Revenue"
                    value={formatCurrency(totalRevenue)}
                    change={`For selected period`}
                    changeType="increase"
                />
                <DashboardCard 
                    icon={ShoppingCartIcon}
                    title="Total Sales"
                    value={totalSales.toLocaleString('en-US')}
                    change={`For selected period`}
                    changeType="increase"
                />
                <DashboardCard 
                    icon={PackageIcon}
                    title="Items Sold"
                    value={totalItemsSold.toLocaleString('en-US')}
                    change={`For selected period`}
                    changeType="increase"
                />
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-white mb-4">{getFilterTitle()}</h2>
                {chartData.length > 0 ? <SalesChart data={chartData} /> : <div className="h-[300px] flex items-center justify-center text-gray-500">No sales data for the selected period.</div>}
            </div>
        </main>
    );
};

export default ReportsPage;