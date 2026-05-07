export const API_CONFIG = {
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    ACCESS_KEY: import.meta.env.VITE_ACCESS_KEY || '',
    API_KEY: import.meta.env.VITE_API_KEY || '',
    ACCENT_COLOR: 'a855f7'
};

const HEADERS = {
    'Authorization': `Bearer ${API_CONFIG.ACCESS_KEY}`,
    'Content-Type': 'application/json;charset=utf-8'
};

const cache = {
    get: (key) => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    },
    set: (key, data) => {
        const expiry = Date.now() + 3600000;
        localStorage.setItem(key, JSON.stringify({ data, expiry }));
    }
};

async function normalize(item, type = null) {
    const isTV = type === 'tv' || item.media_type === 'tv' || item.first_air_date !== undefined;
    
    let imdbId = item.imdb_id || null;
    if (!imdbId) {
        try {
            const extRes = await fetch(`${API_CONFIG.BASE_URL}/${isTV ? 'tv' : 'movie'}/${item.id}/external_ids`, { headers: HEADERS });
            const extData = await extRes.json();
            imdbId = extData.imdb_id;
        } catch (e) {
            console.error("Error fetching IMDb ID:", e);
        }
    }

    return {
        id: imdbId || `tmdb-${item.id}`,
        tmdbId: item.id,
        primaryTitle: item.title || item.name,
        type: isTV ? 'TV_SERIES' : 'MOVIE',
        startYear: (item.release_date || item.first_air_date || '').split('-')[0],
        plot: item.overview,
        rating: { aggregateRating: item.vote_average?.toFixed(1) },
        primaryImage: { url: item.poster_path ? `${API_CONFIG.IMAGE_BASE_URL}/w500${item.poster_path}` : null },
        backdrop: item.backdrop_path ? `${API_CONFIG.IMAGE_BASE_URL}/original${item.backdrop_path}` : null
    };
}

export async function fetchTrending(type = 'all') {
    const cached = cache.get(`trending_${type}`);
    if (cached) return cached;

    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/trending/${type}/week?language=en-US`, { headers: HEADERS });
        const data = await res.json();
        const results = await Promise.all(data.results.slice(0, 12).map(item => normalize(item)));
        cache.set(`trending_${type}`, results);
        return results;
    } catch (error) {
        console.error('Error fetching trending:', error);
        return [];
    }
}

export async function searchMedia(query) {
    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=en-US`, { headers: HEADERS });
        const data = await res.json();
        return await Promise.all(data.results.filter(i => i.media_type !== 'person').map(item => normalize(item)));
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

export async function fetchTopRated() {
    const cached = cache.get('top_rated');
    if (cached) return cached;

    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/movie/top_rated?language=en-US&page=1`, { headers: HEADERS });
        const data = await res.json();
        const results = await Promise.all(data.results.slice(0, 10).map(item => normalize(item, 'movie')));
        cache.set('top_rated', results);
        return results;
    } catch (error) {
        console.error('Error fetching top rated:', error);
        return [];
    }
}

export async function fetchSeries() {
    const cached = cache.get('popular_series');
    if (cached) return cached;

    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/tv/popular?language=en-US&page=1`, { headers: HEADERS });
        const data = await res.json();
        const results = await Promise.all(data.results.slice(0, 10).map(item => normalize(item, 'tv')));
        cache.set('popular_series', results);
        return results;
    } catch (error) {
        console.error('Error fetching series:', error);
        return [];
    }
}

export async function fetchTrailer(tmdbId, type) {
    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/${type === 'MOVIE' ? 'movie' : 'tv'}/${tmdbId}/videos?language=en-US`, { headers: HEADERS });
        const data = await res.json();
        const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    } catch (e) {
        return null;
    }
}

export function getEmbedUrl(type, id) {
    return `https://vidplays.fun/embed/${type === 'MOVIE' ? 'movie' : 'tv'}/${id}`;
}
