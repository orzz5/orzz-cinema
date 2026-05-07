import { initApi, fetchTrending, fetchNowPlaying, fetchUpcoming, fetchAiringToday, searchMedia } from './api.js';
import { renderGrid, setupHero, UI } from './ui.js';

async function initApp() {
    const apiReady = await initApi();
    
    if (!apiReady) {
        document.body.innerHTML += `
            <div style="position:fixed; bottom:20px; left:20px; background:#ef4444; color:white; padding:15px; border-radius:8px; z-index:9999; font-weight:bold; box-shadow:0 0 20px rgba(0,0,0,0.5);">
                <i class="fas fa-exclamation-triangle"></i> API ERROR: Missing VITE_ACCESS_KEY
            </div>
        `;
    }

    const loadData = async () => {
        const [trending, nowPlaying, airingToday, upcoming] = await Promise.all([
            fetchTrending('movie'),
            fetchNowPlaying(),
            fetchAiringToday(),
            fetchUpcoming()
        ]);

        renderGrid(trending, UI.grids.trending);
        renderGrid(nowPlaying, UI.grids.nowPlaying);
        renderGrid(airingToday, UI.grids.airingToday);
        renderGrid(upcoming, UI.grids.upcoming);

        if (trending.length > 0) {
            setupHero(trending[0]);
        }
    };

    await loadData();

    const performSearch = async () => {
        const query = UI.search.value.trim();
        if (query.length < 2) return;
        
        UI.grids.trending.innerHTML = '<div class="skeleton-card"></div>'.repeat(6);
        const results = await searchMedia(query);
        renderGrid(results, UI.grids.trending);
        UI.grids.trending.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    UI.search.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
    document.querySelector('#search-btn').onclick = performSearch;
}

document.addEventListener('DOMContentLoaded', initApp);
