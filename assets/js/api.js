let apiConfig = {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBase: 'https://image.tmdb.org/t/p',
    accessToken: import.meta.env.VITE_ACCESS_KEY || '',
    apiKey: import.meta.env.VITE_API_KEY || ''
};

const getHeaders = () => ({
    'Authorization': `Bearer ${apiConfig.accessToken}`,
    'accept': 'application/json',
    'Content-Type': 'application/json;charset=utf-8'
});

const DEFAULT_LANG = 'en-US';

export async function initApi() {
    if (!apiConfig.accessToken) return false;
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

async function normalize(item, type = null) {
    const isTV = type === 'tv' || 
                 item.media_type === 'tv' || 
                 item.first_air_date !== undefined || 
                 item.name !== undefined && item.title === undefined;
                 
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
        const url = `${apiConfig.baseUrl}/trending/${type}/week?language=${DEFAULT_LANG}&include_image_language=en,null`;
        const res = await fetch(url, { headers: getHeaders() });
        const data = await res.json();
        return await Promise.all((data.results || []).slice(0, 12).map(item => normalize(item)));
    } catch (e) { return []; }
}

export async function fetchNowPlaying() {
    try {
        const url = `${apiConfig.baseUrl}/movie/now_playing?language=${DEFAULT_LANG}&page=1`;
        const res = await fetch(url, { headers: getHeaders() });
        const data = await res.json();
        return await Promise.all((data.results || []).slice(0, 10).map(item => normalize(item, 'movie')));
    } catch (e) { return []; }
}

export async function fetchUpcoming() {
    try {
        const url = `${apiConfig.baseUrl}/movie/upcoming?language=${DEFAULT_LANG}&page=1`;
        const res = await fetch(url, { headers: getHeaders() });
        const data = await res.json();
        return await Promise.all((data.results || []).slice(0, 10).map(item => normalize(item, 'movie')));
    } catch (e) { return []; }
}

export async function fetchAiringToday() {
    try {
        const url = `${apiConfig.baseUrl}/tv/airing_today?language=${DEFAULT_LANG}&page=1`;
        const res = await fetch(url, { headers: getHeaders() });
        const data = await res.json();
        return await Promise.all((data.results || []).slice(0, 10).map(item => normalize(item, 'tv')));
    } catch (e) { return []; }
}

export async function searchMedia(query) {
    try {
        const url = `${apiConfig.baseUrl}/search/multi?query=${encodeURIComponent(query)}&language=${DEFAULT_LANG}&include_image_language=en,null`;
        const res = await fetch(url, { headers: getHeaders() });
        const data = await res.json();
        return await Promise.all((data.results || []).filter(i => i.media_type !== 'person').map(item => normalize(item)));
    } catch (e) { return []; }
}

export async function fetchFullDetails(tmdbId, type) {
    const mediaType = type === 'TV_SERIES' ? 'tv' : 'movie';
    try {
        const url = `${apiConfig.baseUrl}/${mediaType}/${tmdbId}?append_to_response=videos,images,credits,recommendations,external_ids&language=${DEFAULT_LANG}&include_image_language=en,null`;
        const res = await fetch(url, { headers: getHeaders() });
        const data = await res.json();
        
        const trailer = data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        const cast = (data.credits?.cast || []).slice(0, 8).map(c => ({
            name: c.name,
            character: c.character,
            profile: c.profile_path ? `${apiConfig.imageBase}w185${c.profile_path}` : null
        }));

        const recommendations = await Promise.all((data.recommendations?.results || []).slice(0, 6).map(item => normalize(item, mediaType)));

        return {
            ...data,
            trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
            imdbId: data.external_ids?.imdb_id || data.imdb_id,
            cast,
            recommendations,
            type: (data.first_air_date || data.name) ? 'TV_SERIES' : 'MOVIE'
        };
    } catch (e) { return null; }
}

export async function fetchSeason(tvId, seasonNum) {
    try {
        const res = await fetch(`${apiConfig.baseUrl}/tv/${tvId}/season/${seasonNum}?language=${DEFAULT_LANG}`, { headers: getHeaders() });
        const data = await res.json();
        return (data.episodes || []).map(e => ({
            name: e.name,
            episodeNumber: e.episode_number,
            overview: e.overview,
            still: e.still_path ? `${apiConfig.imageBase}w300${e.still_path}` : null
        }));
    } catch (e) { return []; }
}

export function getEmbedUrl(type, id) {
    return `https://vidplays.fun/embed/${type === 'MOVIE' ? 'movie' : 'tv'}/${id}`;
}
