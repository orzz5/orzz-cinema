import { fetchMedia } from './api.js';
import { renderGrid, setupHero, UI } from './ui.js';

/**
 * Main Application Controller
 */
async function initApp() {
    console.log('[Cinema] Initializing app...');

    // Parallel fetch for better performance
    const [trending, topRated, series] = await Promise.all([
        fetchMedia({ startYear: 2024, minAggregateRating: 7, types: 'MOVIE' }),
        fetchMedia({ minAggregateRating: 8.8, types: 'MOVIE' }),
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

    // Basic Search Support
    UI.search.oninput = (e) => {
        const query = e.target.value.toLowerCase();
        // Filtering current lists for instant feedback
        // Full API search can be implemented here
    };
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
