// API Configuration & Fetching Logic
const API_CONFIG = {
    IMDB_API: 'https://api.imdbapi.dev/titles',
    VIDKING_BASE: 'https://www.vidking.net/embed',
    ACCENT_COLOR: 'a855f7'
};

/**
 * Fetch movies or series from the IMDb API
 * @param {Object} filters - Search filters (startYear, minAggregateRating, types, etc.)
 */
async function fetchMedia(filters = {}) {
    const queryParams = new URLSearchParams({
        limit: 12,
        ...filters
    });
    
    try {
        const response = await fetch(`${API_CONFIG.IMDB_API}?${queryParams}`);
        const data = await response.json();
        // The API returns { titles: [...] }
        return data.titles || data.results || data || [];
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
