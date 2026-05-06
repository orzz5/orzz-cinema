// API Configuration & Fetching Logic
const API_CONFIG = {
    IMDB_API: 'https://api.imdbapi.dev/titles',
    VIDKING_BASE: 'https://www.vidking.net/embed',
    ACCENT_COLOR: 'a855f7'
};

/**
 * Fetch movies or series from the IMDb API with Smart Caching
 */
async function fetchMedia(filters = {}) {
    const cacheKey = `cinema_cache_${JSON.stringify(filters)}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    // Return cached data if it's less than 1 hour old
    if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < 3600000) {
            console.log('[Cinema] Serving from cache:', filters);
            return data;
        }
    }

    let url = API_CONFIG.IMDB_API;
    if (filters.query) url = 'https://api.imdbapi.dev/search/titles';

    const queryParams = new URLSearchParams({ limit: 12, ...filters });
    
    try {
        const response = await fetch(`${url}?${queryParams}`);
        const data = await response.json();
        const results = data.titles || data.results || data || [];
        
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: results
        }));

        return results;
    } catch (error) {
        console.error('[API Error]:', error);
        return [];
    }
}

/**
 * Get the Vidking embed URL for a specific ID
 * @param {string} id - IMDb ID (tt...)
 * @param {boolean} isTV - Whether it's a TV series
 */
function getEmbedUrl(id, isTV = false) {
    if (isTV) {
        // Default to Season 1 Episode 1
        return `${API_CONFIG.VIDKING_BASE}/tv/${id}/1/1?color=${API_CONFIG.ACCENT_COLOR}`;
    }
    return `${API_CONFIG.VIDKING_BASE}/movie/${id}?color=${API_CONFIG.ACCENT_COLOR}`;
}

export { API_CONFIG, fetchMedia, getEmbedUrl };
