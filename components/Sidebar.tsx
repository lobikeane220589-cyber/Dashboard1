
import React from 'react';
import { AdAccount, User } from '../types';

interface SidebarProps {
  user: User;
  accounts: AdAccount[];
  selectedAccountId: string;
  onAccountSelect: (id: string) => void;
  onLogout: () => void;
  // Added missing props to satisfy interface requirement in App.tsx
  theme: string;
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, accounts, selectedAccountId, onAccountSelect, onLogout, theme, onToggleTheme }) => {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden lg:flex transition-colors">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fab fa-facebook-f text-white text-lg"></i>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100">AdsInsight</span>
        </div>

        <nav className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2 flex justify-between items-center">
              Рекламные аккаунты
              <i className="fas fa-layer-group text-[10px]"></i>
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => onAccountSelect('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                  selectedAccountId === 'all'
                    ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-100'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <i className={`fas fa-globe text-xs ${selectedAccountId === 'all' ? 'text-white' : 'text-slate-400'}`}></i>
                Все кабинеты
              </button>
              
              <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800 my-2"></div>

              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => onAccountSelect(account.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                    selectedAccountId === account.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <i className={`fas fa-circle text-[8px] ${selectedAccountId === account.id ? 'text-indigo-600' : 'text-slate-300 dark:text-slate-600'}`}></i>
                  {account.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
              Управление
            </h3>
            <div className="space-y-1">
              {/* Added theme toggle button */}
              <button 
                onClick={onToggleTheme}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
              >
                <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3">
                <i className="fas fa-plus"></i>
                Подключить кабинет
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3">
                <i className="fas fa-cog"></i>
                Настройки
              </button>
            </div>
          </div>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4 px-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
        >
          <i className="fas fa-sign-out-alt"></i>
          Выйти
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
