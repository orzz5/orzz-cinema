import { initApi, fetchTrending, fetchTopRated, fetchSeries, searchMedia, setApiLanguage } from './api.js';
import { renderGrid, setupHero, UI } from './ui.js';
import { setLanguage, t } from './i18n.js';

async function initApp() {
    const apiReady = await initApi();
    
    if (!apiReady) {
        document.body.innerHTML += `
            <div style="position:fixed; bottom:20px; left:20px; background:#ef4444; color:white; padding:15px; border-radius:8px; z-index:9999;">
                <b>API ERROR:</b> Check your Vercel Environment Variables (VITE_ACCESS_KEY).
            </div>
        `;
    }

    const loadData = async () => {
        const [trending, topRated, series] = await Promise.all([
            fetchTrending('movie'),
            fetchTopRated(),
            fetchSeries()
        ]);

        renderGrid(trending, UI.grids.trending);
        renderGrid(topRated, UI.grids.topRated);
        renderGrid(series, UI.grids.series);

        if (trending.length > 0) {
            setupHero(trending[0]);
        }
    };

    await loadData();

    const performSearch = async () => {
        const query = UI.search.value.trim();
        if (query.length < 2) return;
        
        const trendingTitle = UI.grids.trending.parentElement.querySelector('h2');
        if (trendingTitle) trendingTitle.textContent = `${t('results') || 'Results'}: ${query}`;
        
        UI.grids.trending.innerHTML = '<div class="skeleton-card"></div>'.repeat(5);

        const results = await searchMedia(query);
        renderGrid(results, UI.grids.trending);
        
        UI.grids.trending.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    UI.search.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
    document.querySelector('#search-btn').onclick = performSearch;

    const changeLanguage = async (lang) => {
        setLanguage(lang);
        setApiLanguage(lang);
        await loadData(); // Reload content in new language
    };

    const enBtn = document.querySelector('#lang-en');
    const esBtn = document.querySelector('#lang-es');
    
    if (enBtn) enBtn.onclick = () => changeLanguage('en');
    if (esBtn) esBtn.onclick = () => changeLanguage('es');
    
    setLanguage('en');
    setApiLanguage('en');
}

document.addEventListener('DOMContentLoaded', initApp);
