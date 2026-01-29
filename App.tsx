
import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import { AdAccount, Campaign, TimeRange, User, CustomDateRange } from './types';
import { mockAccounts, mockCampaigns } from './mockData';
import { facebookService } from './facebookService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [realAccounts, setRealAccounts] = useState<AdAccount[]>([]);
  const [realCampaigns, setRealCampaigns] = useState<Campaign[]>([]);
  const [theme, setTheme] = useState(localStorage.getItem('ads_theme') || 'light');

  // Состояния фильтров
  const [selectedAccountId, setSelectedAccountId] = useState(localStorage.getItem('ads_selected_account_id') || 'all');
  const [selectedCampaignId, setSelectedCampaignId] = useState(localStorage.getItem('ads_selected_campaign_id') || 'all');
  const [timeRange, setTimeRange] = useState<TimeRange>((localStorage.getItem('ads_time_range') as TimeRange) || TimeRange.LAST_30);
  
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [customRange, setCustomRange] = useState<CustomDateRange>(
    localStorage.getItem('ads_custom_range') ? JSON.parse(localStorage.getItem('ads_custom_range')!) : {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today
    }
  );

  // Синхронизация темы
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ads_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Синхронизация с localStorage
  useEffect(() => { localStorage.setItem('ads_selected_account_id', selectedAccountId); }, [selectedAccountId]);
  useEffect(() => { localStorage.setItem('ads_selected_campaign_id', selectedCampaignId); }, [selectedCampaignId]);
  useEffect(() => { localStorage.setItem('ads_time_range', timeRange); }, [timeRange]);
  useEffect(() => { localStorage.setItem('ads_custom_range', JSON.stringify(customRange)); }, [customRange]);

  // Загрузка аккаунтов
  const fetchAccounts = async (token?: string) => {
    try {
      const accounts = await facebookService.getAdAccounts();
      if (accounts && accounts.length > 0) {
        setRealAccounts(accounts);
      } else {
        console.warn("No accounts found for this token");
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    }
  };

  // Проверка сессии при загрузке
  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('ads_insight_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        if (user.fbAccessToken) {
          await fetchAccounts();
        }
      }
      setIsAuthLoading(false);
    };
    init();
  }, []);

  // Загрузка кампаний при смене аккаунта
  useEffect(() => {
    if (currentUser?.fbAccessToken && selectedAccountId !== 'all') {
      facebookService.getCampaigns(selectedAccountId).then(setRealCampaigns).catch(console.error);
    }
  }, [selectedAccountId, currentUser]);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ads_insight_user', JSON.stringify(user));
    // Если есть токен, сразу подгружаем аккаунты
    if (user.fbAccessToken) {
      await fetchAccounts();
    }
  };

  const handleFBLogin = async () => {
    try {
      const token = await facebookService.login();
      const user: User = {
        id: 'fb_' + Date.now(),
        name: 'Facebook User',
        email: 'fb-connected@adsinsight.io',
        fbAccessToken: token
      };
      await handleLogin(user);
    } catch (err: any) {
      alert(err?.message || err || 'Ошибка авторизации Facebook');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ads_insight_user');
    localStorage.removeItem('ads_selected_account_id');
    localStorage.removeItem('ads_selected_campaign_id');
    localStorage.removeItem('ads_time_range');
    localStorage.removeItem('ads_custom_range');
    
    setRealAccounts([]);
    setRealCampaigns([]);
    setSelectedAccountId('all');
    setSelectedCampaignId('all');
    setTimeRange(TimeRange.LAST_30);
    setCustomRange({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today
    });
  };

  const activeAccounts = currentUser?.fbAccessToken ? realAccounts : mockAccounts;
  const activeCampaigns = currentUser?.fbAccessToken 
    ? (selectedAccountId === 'all' ? [] : realCampaigns) 
    : (selectedAccountId === 'all' ? mockCampaigns : mockCampaigns.filter(c => c.accountId === selectedAccountId));

  const currentAccountName = useMemo(() => {
    if (selectedAccountId === 'all') return 'Все аккаунты';
    return activeAccounts.find(a => a.id === selectedAccountId)?.name || 'Выбранный кабинет';
  }, [selectedAccountId, activeAccounts]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Загрузка сессии...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={handleLogin} onFBLogin={handleFBLogin} />;
  }

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Sidebar 
          user={currentUser}
          accounts={activeAccounts}
          selectedAccountId={selectedAccountId}
          onAccountSelect={setSelectedAccountId}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        
        <main className="flex-1 p-6 md:p-10 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  {currentAccountName} 
                  {currentUser.fbAccessToken && (
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] rounded-full uppercase font-bold border border-emerald-200 dark:border-emerald-800 animate-pulse">
                      Live
                    </span>
                  )}
                </h1>
                <p className="text-slate-400 text-sm">Обзор результативности маркетинга</p>
              </div>
            </header>

            <Dashboard 
              accounts={activeAccounts}
              selectedAccountId={selectedAccountId}
              onAccountChange={setSelectedAccountId}
              campaigns={activeCampaigns}
              selectedCampaignId={selectedCampaignId}
              onCampaignChange={setSelectedCampaignId}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
              isLive={!!currentUser.fbAccessToken}
            />
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
