const { useState, useEffect } = React;

const DATE_KEY = 'vencimientos_fecha';
const OLD_PRODUCTS_KEY = 'vencimientos_productos';
const THEME_KEY = 'vencimientos_tema';

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const loadExpiryDate = () => {
    try {
        const saved = localStorage.getItem(DATE_KEY);
        if (saved && isValidDate(saved)) return saved;
        const old = JSON.parse(localStorage.getItem(OLD_PRODUCTS_KEY) || 'null');
        if (Array.isArray(old) && old[0] && isValidDate(old[0].expiryDate || '')) {
            return old[0].expiryDate;
        }
    } catch (e) {}
    return '';
};

const loadTheme = () => {
    try {
        return localStorage.getItem(THEME_KEY) || 'dark';
    } catch (e) {
        return 'dark';
    }
};

const calculateDays = (expiryDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [year, month, day] = expiryDate.split('-').map(Number);
    const expiry = new Date(year, month - 1, day);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

const getStatus = (days) => {
    if (days < 0) return { text: 'VENCIDO', pill: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30', ring: '#ef4444' };
    if (days === 0) return { text: 'VENCE HOY', pill: 'bg-red-600 text-white border-red-600', ring: '#dc2626' };
    if (days <= 30) return { text: 'URGENTE', pill: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30', ring: '#f43f5e' };
    if (days <= 60) return { text: 'ADVERTENCIA', pill: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30', ring: '#f59e0b' };
    if (days <= 90) return { text: 'PRECAUCIÓN', pill: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30', ring: '#fb923c' };
    return { text: 'NORMAL', pill: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30', ring: '#10b981' };
};

const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// Iconos SVG
const Sun = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
);

const Moon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
);

const TimerIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="13" r="8"></circle>
        <path d="M12 9v4l2 2"></path>
        <path d="M9 2h6"></path>
    </svg>
);

const CalendarIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const ProgressRing = ({ pct, color, days }) => {
    const radius = 84;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - pct / 100);
    const expired = days < 0;
    return (
        <div className="relative w-[210px] h-[210px] mx-auto">
            <svg width="210" height="210" viewBox="0 0 210 210">
                <circle cx="105" cy="105" r={radius} fill="none"
                    className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="12" />
                <circle cx="105" cy="105" r={radius} fill="none"
                    stroke={color} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    transform="rotate(-90 105 105)" className="ring-progress" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-extrabold leading-none tracking-tight ${expired ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-50'}`}>
                    {expired ? 0 : days}
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1 font-medium">
                    {expired ? 'vencido' : days === 1 ? 'día' : 'días'}
                </span>
            </div>
        </div>
    );
};

const ExpiryCalculator = () => {
    const [expiryDate, setExpiryDate] = useState(loadExpiryDate);
    const [theme, setTheme] = useState(loadTheme);

    useEffect(() => {
        localStorage.setItem(DATE_KEY, expiryDate);
    }, [expiryDate]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    let result = null;
    if (isValidDate(expiryDate)) {
        const daysRemaining = calculateDays(expiryDate);
        const status = getStatus(daysRemaining);
        const pct = Math.max(0, Math.min(100, (daysRemaining / 120) * 100));
        const absDays = Math.abs(daysRemaining);
        result = (
            <div key={expiryDate} className="fade-in mt-8">
                <ProgressRing pct={pct} color={status.ring} days={daysRemaining} />
                <div className="flex justify-center mt-6">
                    <span className={`inline-flex px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide ${status.pill}`}>
                        {status.text}
                    </span>
                </div>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                    {daysRemaining > 0 && <>Vence el <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(expiryDate)}</span></>}
                    {daysRemaining === 0 && <>Hoy es la fecha de vencimiento</>}
                    {daysRemaining < 0 && <>Venció el <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(expiryDate)}</span> · hace {absDays} {absDays === 1 ? 'día' : 'días'}</>}
                </p>
            </div>
        );
    }

    return (
        <div className="app-bg flex flex-col">
            <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-slate-950/60 border-b border-slate-200/70 dark:border-slate-800/70 transition-colors">
                <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <TimerIcon />
                        </div>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
                            Vencimientos
                        </h1>
                    </div>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        className="w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center transition-colors
                            bg-transparent border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100
                            dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
                    >
                        {theme === 'dark' ? <Sun /> : <Moon />}
                    </button>
                </div>
            </header>

            <main className="flex-1 flex items-start justify-center p-4 pt-8 sm:pt-14">
                <div className="w-full max-w-md fade-in rounded-3xl border shadow-xl shadow-slate-900/5 dark:shadow-black/40
                    bg-white border-slate-200
                    dark:bg-slate-900/70 dark:border-slate-800 dark:backdrop-blur p-6 sm:p-8">
                    <label htmlFor="fecha-vencimiento"
                        className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
                        <CalendarIcon /> ¿Cuándo vence?
                    </label>
                    <input
                        id="fecha-vencimiento"
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl border text-lg font-semibold
                            bg-slate-50 border-slate-200 text-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none
                            dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-100 dark:focus:border-emerald-500 transition-colors"
                    />

                    {result || (
                        <div className="mt-8 py-10 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400 px-6">
                                Elegí una fecha para ver cuántos días quedan
                            </p>
                        </div>
                    )}
                </div>
            </main>

            <footer className="pb-6 pt-2 text-center text-xs text-slate-400 dark:text-slate-600">
                Tu fecha queda guardada en este dispositivo
            </footer>
        </div>
    );
};

ReactDOM.render(<ExpiryCalculator />, document.getElementById('root'));
