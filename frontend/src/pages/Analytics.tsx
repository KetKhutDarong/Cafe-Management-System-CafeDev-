import { useState, type ReactNode, useEffect, useRef } from "react";
import { Search, Plus, Filter, MoreVertical, Download, ArrowUpRight, ArrowDownRight, Calendar, BarChart3, PieChart, TrendingUp, Clock, Users, ChevronDown, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import api from "@/services/api";
import { toast } from "sonner";
import { useLanguage } from "@/LanguageContext";
import { useLocation } from "@/LocationContext";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";

const REVENUE_DATA = [
  { name: 'Mon', current: 4000, previous: 3000 },
  { name: 'Tue', current: 3000, previous: 2500 },
  { name: 'Wed', current: 5000, previous: 4000 },
  { name: 'Thu', current: 4500, previous: 3500 },
  { name: 'Fri', current: 6000, previous: 5000 },
  { name: 'Sat', current: 8000, previous: 6000 },
  { name: 'Sun', current: 7000, previous: 5500 },
];

const CATEGORY_DATA = [
  { name: 'Beverages', value: 60, color: '#C47C2B' },
  { name: 'Food', value: 25, color: '#E8A84C' },
  { name: 'Merch', value: 15, color: '#F5E6C8' },
];

interface PopularItemData {
  name: string;
  sold: number;
  revenue: number;
  image: string;
}

export default function Analytics() {
  const { t } = useLanguage();
  const { currentLocation } = useLocation();
  const [timeRange, setTimeRange] = useState('analytics.last7Days');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesData, setSalesData] = useState<any>(null);
  const [popularItems, setPopularItems] = useState<PopularItemData[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true);
        const params: any = { 
          timeRange: timeRange.split('.').pop() // Get 'last7Days', 'thisMonth', etc.
        };
        if (timeRange === 'analytics.custom') {
          params.startDate = startDate;
          params.endDate = endDate;
        }
        if (currentLocation) {
          params.locationId = currentLocation.id || currentLocation._id;
        }
        
        const [salesRes, popularRes, staffRes] = await Promise.all([
          api.get("/reports/sales", { params }),
          api.get("/reports/popular-items", { params }),
          api.get("/reports/staff-performance", { params })
        ]);
        setSalesData(salesRes.data);
        setPopularItems(popularRes.data);
        setStaffPerformance(staffRes.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        if (showLoading) toast.error("Failed to load analytics data");
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Auto-refresh every 5 seconds for real-time feel
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, [currentLocation, timeRange, startDate, endDate]);

  const getDateRangeDisplay = () => {
    if (timeRange === 'analytics.last7Days') {
      const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (timeRange === 'analytics.thisMonth') {
      const start = new Date();
      start.setDate(1);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (timeRange === 'analytics.lastMonth') {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      const end = new Date();
      end.setDate(0);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (timeRange === 'analytics.custom') {
      return `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return t('analytics.dateRange');
  };

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    if (!salesData) return;
    
    // Prepare data
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue', `$${salesData.totalRevenue.toFixed(2)}`],
      ['Total Orders', salesData.totalOrders],
      ['Average Order Value', `$${salesData.avgOrderValue.toFixed(2)}`],
      ['Net Profit', `$${salesData.netProfit.toFixed(2)}`],
    ];

    const categoryData = [
      ['Category', 'Orders %'],
      ...(salesData.categorySales || []).map((cat: any) => [cat.name, `${cat.value}%`]),
    ];

    const itemsData = [
      ['Item Name', 'Quantity Sold', 'Total Revenue'],
      ...popularItems.map(item => [item.name, item.sold, `$${item.revenue.toFixed(2)}`]),
    ];

    // Build CSV content
    const csvRows = [
      ['SALES SUMMARY REPORT'],
      [`Date Range: ${getDateRangeDisplay()}`],
      [],
      ...summaryData,
      [],
      ...categoryData,
      [],
      ...itemsData
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Cafe_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportMenu(false);
    toast.success("CSV Report exported successfully");
  };

  const handleExportExcel = () => {
    if (!salesData) return;
    setIsExporting(true);

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // 1. Summary Sheet
      const summarySheetData = [
        ["SALES SUMMARY REPORT"],
        [`Date Range: ${getDateRangeDisplay()}`],
        [],
        ["Metric", "Value"],
        ["Total Revenue", salesData.totalRevenue],
        ["Total Orders", salesData.totalOrders],
        ["Average Order Value", salesData.avgOrderValue],
        ["Net Profit", salesData.netProfit],
        [],
        ["CATEGORY PERFORMANCE"],
        ["Category", "Percentage"],
        ...(salesData.categorySales || []).map((cat: any) => [cat.name, cat.value / 100]),
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
      
      // Formatting (basic)
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      // 2. Popular Items Sheet
      const itemsSheetData = [
        ["ITEM PERFORMANCE REPORT"],
        [],
        ["Item Name", "Quantity Sold", "Revenue ($)"],
        ...popularItems.map(item => [item.name, item.sold, item.revenue]),
      ];
      const wsItems = XLSX.utils.aoa_to_sheet(itemsSheetData);
      wsItems['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsItems, "Popular Items");

      // 3. Staff Performance Sheet
      const staffSheetData = [
        ["STAFF PERFORMANCE REPORT"],
        [],
        ["Staff Name", "Orders Handled", "Revenue Generated ($)", "Performance Score"],
        ...staffPerformance.map(staff => [staff.name, staff.orders, staff.revenue, staff.performance]),
      ];
      const wsStaff = XLSX.utils.aoa_to_sheet(staffSheetData);
      wsStaff['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsStaff, "Staff Performance");

      // Write file
      XLSX.writeFile(wb, `Cafe_Professional_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setShowExportMenu(false);
      toast.success("Excel Report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel report");
    } finally {
      setIsExporting(false);
    }
  };

  const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return current > 0 ? "+100%" : "0%";
    const diff = ((current - previous) / previous) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%`;
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-background min-h-full transition-colors duration-300">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-1 text-foreground">{t('analytics.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-2xl text-sm font-bold shadow-sm">
            <Calendar size={18} className="text-muted-foreground" />
            <span className="text-foreground">{getDateRangeDisplay()}</span>
          </div>
          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 group"
            >
              <Download size={18} className={cn(isExporting && "animate-bounce")} />
              {t('analytics.export')}
              <ChevronDown size={14} className={cn("transition-transform duration-300", showExportMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-20"
                >
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={handleExportExcel}
                      disabled={isExporting}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Excel Worksheet</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Recommended</p>
                      </div>
                    </button>
                    <button 
                      onClick={handleExportCSV}
                      disabled={isExporting}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">CSV Format</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Standard Text</p>
                      </div>
                    </button>
                    <div className="pt-2 border-t border-border mt-1">
                      <button 
                        onClick={() => { window.print(); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-xl transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Printer size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Print Report</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Physical Copy</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {['analytics.last7Days', 'analytics.thisMonth', 'analytics.lastMonth', 'analytics.custom'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                timeRange === range 
                  ? "bg-foreground text-background shadow-lg" 
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {t(range)}
            </button>
          ))}
        </div>

        {timeRange === 'analytics.custom' && (
          <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-border shadow-sm">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold focus:ring-0 text-foreground"
            />
            <span className="text-muted-foreground">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold focus:ring-0 text-foreground"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title={t('analytics.revenue')} 
          value={`$${salesData?.totalRevenue?.toFixed(2) || '0.00'}`} 
          trend={calculateTrend(salesData?.totalRevenue || 0, salesData?.previous?.totalRevenue || 0)} 
          isPositive={(salesData?.totalRevenue || 0) >= (salesData?.previous?.totalRevenue || 0)} 
          vsText={`$${(salesData?.previous?.totalRevenue || 0).toFixed(2)} ${t('analytics.vsLastPeriod')}`} 
        />
        <StatCard 
          title={t('analytics.orders')} 
          value={salesData?.totalOrders?.toString() || '0'} 
          trend={calculateTrend(salesData?.totalOrders || 0, salesData?.previous?.totalOrders || 0)} 
          isPositive={(salesData?.totalOrders || 0) >= (salesData?.previous?.totalOrders || 0)} 
          vsText={`${salesData?.previous?.totalOrders || 0} ${t('analytics.vsLastPeriod')}`} 
        />
        <StatCard 
          title={t('analytics.avgOrder')} 
          value={`$${salesData?.avgOrderValue?.toFixed(2) || '0.00'}`} 
          trend={calculateTrend(salesData?.avgOrderValue || 0, salesData?.previous?.avgOrderValue || 0)} 
          isPositive={(salesData?.avgOrderValue || 0) >= (salesData?.previous?.avgOrderValue || 0)} 
          vsText={`$${(salesData?.previous?.avgOrderValue || 0).toFixed(2)} ${t('analytics.vsLastPeriod')}`} 
        />
        <StatCard 
          title={t('analytics.netProfit')} 
          value={`$${salesData?.netProfit?.toFixed(2) || '0.00'}`} 
          trend={calculateTrend(salesData?.totalRevenue || 0, salesData?.previous?.totalRevenue || 0)} 
          isPositive={(salesData?.totalRevenue || 0) >= (salesData?.previous?.totalRevenue || 0)} 
          vsText={`Estimated 35% margin`} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
        <div className="xl:col-span-2 bg-card p-6 sm:p-8 rounded-[40px] shadow-sm border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-xl font-display font-bold text-foreground">{t('analytics.revenueTrends')}</h3>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2 text-muted-foreground"><span className="w-3 h-3 rounded-full bg-primary" /> {t('analytics.current')}</div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData?.revenueTrends || []}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                  dy={10}
                  interval={salesData?.revenueTrends?.length > 14 ? Math.floor(salesData.revenueTrends.length / 7) : 0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  stroke="var(--primary)" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorCurrent)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-[40px] shadow-sm border border-border">
          <h3 className="text-xl font-display font-bold mb-8 text-foreground">{t('analytics.categorySales')}</h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={salesData?.categorySales || CATEGORY_DATA}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(salesData?.categorySales || CATEGORY_DATA).map((entry: any, index: number) => (
                    <Cell key={`analytics-pie-cell-${index}-${entry.name || 'entry'}`} fill={entry.color || (index === 0 ? 'var(--primary)' : index === 1 ? 'var(--foreground)' : 'var(--muted)')} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-display font-bold text-foreground">
                {salesData?.totalOrders || '0'}
              </p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('analytics.totalSales')}</p>
            </div>
          </div>
          <div className="space-y-4 mt-8">
            {(salesData?.categorySales || CATEGORY_DATA).map((item: any, idx: number) => (
              <div key={`analytics-cat-stat-${idx}-${item.name || 'cat'}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full")} style={{ backgroundColor: item.color || 'var(--primary)' }} />
                  <span className="text-sm font-medium text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-card p-6 sm:p-8 rounded-[40px] shadow-sm border border-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display font-bold text-foreground">{t('analytics.popularItems')}</h3>
            <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">{t('analytics.viewAll')}</button>
          </div>
          <div className="space-y-6">
            {popularItems.length > 0 ? (
              popularItems.map((item, idx) => (
                <div key={`analytics-pop-item-${idx}-${item.name || 'item'}`} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.sold} {t('analytics.itemsSold')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${item.revenue.toFixed(2)}</p>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{t('analytics.revenue')}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t('analytics.noData')}</p>
            )}
          </div>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-[40px] shadow-sm border border-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display font-bold text-foreground">{t('analytics.performance')}</h3>
            <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">{t('analytics.leaderboard')}</button>
          </div>
          <div className="space-y-6">
            {staffPerformance.length > 0 ? (
              staffPerformance.map((staff, idx) => (
                <div key={`analytics-staff-perf-${idx}-${staff.name || 'staff'}`} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted">
                      <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{staff.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{staff.orders} {t('analytics.ordersProcessed')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${staff.revenue.toFixed(2)}</p>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{t('analytics.revenue')}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t('analytics.noData')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-card p-8 rounded-[40px] shadow-sm border border-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display font-bold text-foreground">{t('analytics.peakHours')}</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('analytics.busiestTimes')}</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData?.peakHours || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                  interval={2}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)'
                  }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="var(--primary)" 
                  radius={[6, 6, 0, 0]} 
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  function StatCard({ title, value, trend, isPositive, vsText }: { title: string, value: string, trend: string, isPositive: boolean, vsText: string }) {
    return (
      <div className="bg-card p-6 rounded-[32px] shadow-sm group hover:shadow-xl transition-all duration-300 border border-border">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold",
            isPositive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          )}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </div>
        </div>
        <p className="text-3xl font-display font-bold text-foreground group-hover:scale-105 transition-transform origin-left">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">{t('analytics.vs')} {vsText}</p>
      </div>
    );
  }
}


