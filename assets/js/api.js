let apiConfig = {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBase: 'https://image.tmdb.org/t/p',
    accessToken: import.meta.env.VITE_ACCESS_KEY || '',
    apiKey: import.meta.env.VITE_API_KEY || ''
};

const getHeaders = () => ({
    'Authorization': `Bearer ${apiConfig.accessToken}`,
    'Content-Type': 'application/json;charset=utf-8'
});

let currentLang = 'en-US';

export async function initApi() {
    if (!apiConfig.accessToken) {
        console.warn('[Cinema] Missing VITE_ACCESS_KEY. API will fail.');
        return false;
    }
    try {
        const res = await fetch(`${apiConfig.baseUrl}/configuration`, { headers: getHeaders() });
        const data = await res.json();
        if (data.images) {
            apiConfig.imageBase = data.images.secure_base_url;
        }
        return true;
    } catch (e) {
        return false;
    }
}

export function setApiLanguage(lang) {
    currentLang = lang === 'es' ? 'es-ES' : 'en-US';
}

async function normalize(item, type = null) {
    const isTV = type === 'tv' || item.media_type === 'tv' || item.first_air_date !== undefined;
    const mediaType = isTV ? 'tv' : 'movie';
    
    let imdbId = item.imdb_id || null;
    if (!imdbId && apiConfig.accessToken) {
        try {
            const extRes = await fetch(`${apiConfig.baseUrl}/${mediaType}/${item.id}/external_ids`, { headers: getHeaders() });
            const extData = await extRes.json();
            imdbId = extData.imdb_id;
        } catch (e) {}
    }

    return {
        id: imdbId || `tmdb-${item.id}`,
        tmdbId: item.id,
        primaryTitle: item.title || item.name,
        type: isTV ? 'TV_SERIES' : 'MOVIE',
        startYear: (item.release_date || item.first_air_date || '').split('-')[0],
        plot: item.overview,
        rating: { aggregateRating: item.vote_average?.toFixed(1) },
        primaryImage: { url: item.poster_path ? `${apiConfig.imageBase}w500${item.poster_path}` : null },
        backdrop: item.backdrop_path ? `${apiConfig.imageBase}original${item.backdrop_path}` : null
    };
}

export async function fetchTrending(type = 'all') {
    try {
        const res = await fetch(`${apiConfig.baseUrl}/trending/${type}/week?language=${currentLang}`, { headers: getHeaders() });
        const data = await res.json();
        return await Promise.all((data.results || []).slice(0, 12).map(item => normalize(item)));
    } catch (e) { return []; }
}

export async function fetchTopRated() {
    try {
        const res = await fetch(`${apiConfig.baseUrl}/movie/top_rated?language=${currentLang}&page=1`, { headers: getHeaders() });
        const data = await res.json();
        return await Promise.all((data.results || []).slice(0, 10).map(item => normalize(item, 'movie')));
    } catch (e) { return []; }
}

export async function fetchSeries() {
    try {
        const res = await fetch(`${apiConfig.baseUrl}/tv/popular?language=${currentLang}&page=1`, { headers: getHeaders() });
        const data = await res.json();
        return await Promise.all((data.results || []).slice(0, 10).map(item => normalize(item, 'tv')));
    } catch (e) { return []; }
}

export async function searchMedia(query) {
    try {
        const res = await fetch(`${apiConfig.baseUrl}/search/multi?query=${encodeURIComponent(query)}&language=${currentLang}`, { headers: getHeaders() });
        const data = await res.json();
        return await Promise.all((data.results || []).filter(i => i.media_type !== 'person').map(item => normalize(item)));
    } catch (e) { return []; }
}

export async function fetchFullDetails(tmdbId, type) {
    const mediaType = type === 'TV_SERIES' ? 'tv' : 'movie';
    try {
        const res = await fetch(`${apiConfig.baseUrl}/${mediaType}/${tmdbId}?append_to_response=videos,credits,external_ids&language=${currentLang}`, { headers: getHeaders() });
        const data = await res.json();
        
        const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        return {
            ...data,
            trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
            imdbId: data.external_ids?.imdb_id || data.imdb_id
        };
    } catch (e) { return null; }
}

export function getEmbedUrl(type, id) {
    return `https://vidplays.fun/embed/${type === 'MOVIE' ? 'movie' : 'tv'}/${id}`;
}
