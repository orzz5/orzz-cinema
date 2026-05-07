import { initApi, fetchTrending, fetchNowPlaying, fetchUpcoming, fetchAiringToday } from './api.js';
import { UI, renderGrid, setupHero } from './ui.js';

async function init() {
    // Show skeletons immediately for instant feedback
    renderSkeletons();
    
    const apiReady = await initApi();
    if (!apiReady) return;

    // Load trending first to populate the Hero section
    const trending = await fetchTrending();
    if (trending.length > 0) {
        setupHero(trending[0]);
        renderGrid(trending, UI.grids.trending);
    }

    // Load everything else in parallel for maximum speed
    const [nowPlaying, airingToday, upcoming] = await Promise.all([
        fetchNowPlaying(),
        fetchAiringToday(),
        fetchUpcoming()
    ]);

    renderGrid(nowPlaying, UI.grids.nowPlaying);
    renderGrid(airingToday, UI.grids.airingToday);
    renderGrid(upcoming, UI.grids.upcoming);
}

function renderSkeletons() {
    const skeletonHTML = Array(6).fill('<div class="skeleton skeleton-card"></div>').join('');
    Object.values(UI.grids).forEach(grid => {
        if (grid) grid.innerHTML = skeletonHTML;
    });
}

// Optimized search with debounce to save API resources
let searchTimeout;
UI.search.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        // Restore grids if search cleared (cached data will make this instant)
        init();
        return;
    }

    searchTimeout = setTimeout(async () => {
        const results = await import('./api.js').then(api => api.searchMedia(query));
        // Clear all grids and show results in trending
        Object.values(UI.grids).forEach(g => g.innerHTML = '');
        UI.grids.trending.parentElement.querySelector('h2').textContent = `Search results for: "${query}"`;
        renderGrid(results, UI.grids.trending);
    }, 500);
});

document.addEventListener('DOMContentLoaded', init);
