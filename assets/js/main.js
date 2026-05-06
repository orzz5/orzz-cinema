import { fetchMedia } from './api.js';
import { renderGrid, setupHero, UI } from './ui.js';

/**
 * Main Application Controller
 */
async function initApp() {
    console.log('[Cinema] Initializing app...');

    // Parallel fetch for better performance (Start from 2023 for better streaming sources)
    const [trending, topRated, series] = await Promise.all([
        fetchMedia({ startYear: 2023, types: 'MOVIE' }),
        fetchMedia({ minAggregateRating: 8.5, types: 'MOVIE' }),
        fetchMedia({ minAggregateRating: 8, types: 'TV_SERIES' })
    ]);

    // Initial Render
    renderGrid(trending, UI.grids.trending);
    renderGrid(topRated, UI.grids.topRated);
    renderGrid(series, UI.grids.series);

    // Setup Hero with top trending
    if (trending.length > 0) {
        setupHero(trending[0]);
    }

    // --- Search Implementation ---
    const performSearch = async () => {
        const query = UI.search.value.trim();
        if (query.length < 2) return;
        
        console.log(`[Cinema] Searching for: ${query}`);
        // Visual feedback
        UI.grids.trending.parentElement.querySelector('h2').textContent = `Search Results: ${query}`;
        UI.grids.trending.innerHTML = '<div class="skeleton-card"></div>'.repeat(5);

        const results = await fetchMedia({ title: query });
        renderGrid(results, UI.grids.trending);
        
        // Scroll to results
        UI.grids.trending.scrollIntoView({ behavior: 'smooth' });
    };

    UI.search.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
    document.querySelector('#search-btn').onclick = performSearch;
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
