
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  onFBLogin: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'TOKEN';

const Auth: React.FC<AuthProps> = ({ onLogin, onFBLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [showGuide, setShowGuide] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInsecure, setIsInsecure] = useState(false);

  useEffect(() => {
    // Проверка протокола
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      setIsInsecure(true);
    }
  }, []);

  const getUsersFromDB = () => {
    const stored = localStorage.getItem('ads_insight_users_db');
    return stored ? JSON.parse(stored) : [];
  };

  const saveUserToDB = (user: any) => {
    const users = getUsersFromDB();
    users.push(user);
    localStorage.setItem('ads_insight_users_db', JSON.stringify(users));
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setLoading(true);
    
    const user: User = {
      id: 'token_user_' + Date.now(),
      name: 'Developer Mode',
      email: 'manual-token@adsinsight.io',
      fbAccessToken: manualToken.trim()
    };
    
    setTimeout(() => {
      onLogin(user);
      setLoading(false);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const users = getUsersFromDB();
      if (mode === 'REGISTER') {
        if (users.some((u: any) => u.email === email)) {
          setError('Пользователь с такой почтой уже зарегистрирован.');
          setLoading(false);
        } else {
          const newUser = { id: 'user_' + Date.now(), email, password, name };
          saveUserToDB(newUser);
          onLogin({ id: newUser.id, email: newUser.email, name: newUser.name });
        }
      } else {
        const user = users.find((u: any) => u.email === email && u.password === password);
        if (user) {
          onLogin({ id: user.id, email: user.email, name: user.name });
        } else {
          setError('Неверный Email или пароль.');
          setLoading(false);
        }
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800 transition-all relative overflow-hidden">
        
        {/* Инструкция (Overlay) */}
        {showGuide && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 p-8 overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">Настройка Meta API (2025)</h3>
              <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 font-bold">1</span>
                <p><span className="font-bold text-slate-800 dark:text-slate-200">ID:</span> Скопируйте <span className="underline">App ID</span> из настроек Meta и вставьте его в <span className="font-mono text-xs">index.html</span>.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 font-bold">2</span>
                <p><span className="font-bold text-slate-800 dark:text-slate-200">Маркер:</span> Если у вас уже есть токен из <span className="italic">Graph API Explorer</span>, выберите вариант "Вход по токену" ниже.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 font-bold">3</span>
                <p><span className="font-bold text-slate-800 dark:text-slate-200">Безопасность:</span> Facebook Login требует <span className="font-bold text-indigo-600">HTTPS</span>. Если вы используете HTTP, используйте "Вход по токену".</p>
              </div>
            </div>
            <button 
              onClick={() => setShowGuide(false)}
              className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Понятно
            </button>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-xl shadow-indigo-100 dark:shadow-none animate-pulse">
            <i className="fab fa-facebook-f text-white text-3xl"></i>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">AdsInsight</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Аналитика Facebook Marketing API</p>
        </div>

        {isInsecure && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase flex items-center gap-2">
              <i className="fas fa-shield-alt"></i> Внимание: HTTP Соединение
            </p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
              Facebook SDK блокирует Login на незащищенных сайтах. Пожалуйста, используйте <b>Вход по токену</b>.
            </p>
          </div>
        )}

        {mode !== 'TOKEN' ? (
          <>
            <button 
              onClick={onFBLogin}
              disabled={isInsecure}
              className={`w-full mb-4 font-bold py-4 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-lg active:scale-[0.98] ${
                isInsecure 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-blue-100 dark:shadow-none'
              }`}
            >
              <i className="fab fa-facebook text-2xl"></i>
              Войти через Facebook
            </button>

            <div className="flex justify-center gap-4 mb-6">
              <button 
                onClick={() => setShowGuide(true)}
                className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                <i className="fas fa-question-circle"></i> Инструкция
              </button>
              <span className="text-slate-300">|</span>
              <button 
                onClick={() => setMode('TOKEN')}
                className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                <i className="fas fa-key"></i> Вход по токену
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleManualTokenSubmit} className="mb-6 animate-in fade-in zoom-in duration-300">
            <label className="block text-[10px] uppercase font-black text-slate-400 mb-2 px-1 tracking-widest">Ваш маркер доступа (Token)</label>
            <textarea 
              placeholder="Вставьте ваш токен EAAB..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-mono mb-3 focus:ring-2 focus:ring-emerald-500 outline-none h-24 dark:text-emerald-400"
              required
            />
            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-emerald-100 dark:shadow-none"
              >
                Применить маркер
              </button>
              <button 
                type="button"
                onClick={() => setMode('LOGIN')}
                className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 transition-all"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
            </div>
          </form>
        )}

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-bold tracking-widest">Или демо-вход</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <input 
              type="text" placeholder="Имя" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            />
          )}
          <input 
            type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
          />
          <input 
            type="password" placeholder="Пароль" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
          />
          
          {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-wide">{error}</p>}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-70 active:scale-[0.98]"
          >
            {loading ? 'Загрузка...' : (mode === 'LOGIN' ? 'Войти' : 'Создать')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400 font-medium">
          {mode === 'LOGIN' ? 'Нет аккаунта?' : 'Есть аккаунт?'} 
          <button onClick={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="ml-2 text-indigo-600 font-bold hover:underline">
            {mode === 'LOGIN' ? 'Регистрация' : 'Вход'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
