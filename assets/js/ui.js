import { getEmbedUrl, fetchFullDetails, fetchSeason } from './api.js';

let currentItem = null;
let currentServer = 'vidplays';
let currentS = 1;
let currentE = 1;
let currentAudio = 'en';
let isSwitching = false;

const langMap = {
    'en': { tmdb: 'en-US', vidsrc: 'en' },
    'es': { tmdb: 'es-ES', vidsrc: 'es' },
    'fr': { tmdb: 'fr-FR', vidsrc: 'fr' },
    'pt': { tmdb: 'pt-PT', vidsrc: 'pt' },
    'it': { tmdb: 'it-IT', vidsrc: 'it' }
};

export const UI = {
    header: document.querySelector('#main-header'),
    search: document.querySelector('#movie-search'),
    grids: {
        trending: document.querySelector('#trending-grid'),
        nowPlaying: document.querySelector('#now-playing-grid'),
        airingToday: document.querySelector('#airing-today-grid'),
        upcoming: document.querySelector('#upcoming-grid')
    },
    modal: {
        el: document.querySelector('#player-modal'),
        close: document.querySelector('.close-modal'),
        video: document.querySelector('.video-container'),
        title: document.querySelector('#modal-title'),
        year: document.querySelector('#modal-year'),
        rating: document.querySelector('#modal-rating'),
        type: document.querySelector('#modal-type'),
        overview: document.querySelector('#modal-overview'),
        serverBtns: document.querySelectorAll('.server-btn'),
        langBtns: document.querySelectorAll('.lang-btn'),
        trailerBtn: document.querySelector('#watch-trailer-btn'),
        cast: document.querySelector('#modal-cast'),
        recommendations: document.querySelector('#modal-recommendations'),
        tvControls: document.querySelector('#tv-controls'),
        seasonSelect: document.querySelector('#season-select'),
        episodesGrid: document.querySelector('#episodes-grid')
    },
    hero: {
        section: document.querySelector('#hero'),
        title: document.querySelector('#hero-title'),
        desc: document.querySelector('#hero-desc'),
        playBtn: document.querySelector('#hero-play')
    }
};

export function renderGrid(items, container) {
    if (!container) return;
    container.innerHTML = '';
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="error-msg">No content found.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        const poster = item.primaryImage?.url || `https://via.placeholder.com/300x450/12091d/a855f7?text=${item.primaryTitle}`;
        
        card.innerHTML = `
            <img src="${poster}" alt="${item.primaryTitle}" class="movie-poster" loading="lazy">
            <div class="movie-info">
                <h3>${item.primaryTitle}</h3>
                <p>${item.startYear || ''} • ⭐ ${item.rating?.aggregateRating || 'N/A'}</p>
            </div>
        `;
        card.onclick = () => openPlayer(item);
        container.appendChild(card);
    });
}

export function setupHero(item) {
    if (item.backdrop) {
        UI.hero.section.style.backgroundImage = `url('${item.backdrop}')`;
    }
    UI.hero.title.textContent = item.primaryTitle;
    UI.hero.desc.textContent = item.plot || 'Experience the best cinema content here.';
    UI.hero.playBtn.onclick = () => openPlayer(item);
}

export function switchServer(serverType, force = false) {
    if (!currentItem || (isSwitching && !force)) return;
    currentServer = serverType;
    
    UI.modal.video.innerHTML = '<div class="loading-spinner">Syncing Stream...</div>';
    
    const id = currentItem.imdbId || currentItem.id;
    const isTV = currentItem.type === 'TV_SERIES';
    const lang = langMap[currentAudio] || langMap.en;
    
    // Clean, high-compatibility parameters
    let params = `&audio=${lang.vidsrc}&audio_lang=${lang.tmdb}`;
    
    // Only force subtitles for non-English languages to avoid the "Japanese Default" bug
    if (currentAudio !== 'en') {
        params += `&sub_lang=${lang.vidsrc}&sub=${lang.vidsrc}`;
    }
    
    let url = '';
    switch(serverType) {
        case 'vidplays':
            url = isTV ? `https://vidplays.fun/embed/tv/${id}/${currentS}/${currentE}?type=tv&s=${currentS}&e=${currentE}${params}` : `https://vidplays.fun/embed/movie/${id}?type=movie${params}`;
            break;
        case 'vidsrc_to':
            url = isTV ? `https://vidsrc.to/embed/tv/${id}/${currentS}/${currentE}?${params}` : `https://vidsrc.to/embed/movie/${id}?${params}`;
            break;
        case 'vidking':
            url = isTV ? `https://vidking.net/embed/tv/${id}/${currentS}/${currentE}?color=a855f7` : `https://vidking.net/embed/movie/${id}?color=a855f7`;
            break;
        case 'vidsrc_me':
            url = isTV ? `https://vidsrc.me/embed/tv?imdb=${id}&sea=${currentS}&epi=${currentE}${params}` : `https://vidsrc.me/embed/movie?imdb=${id}${params}`;
            break;
    }

    setTimeout(() => {
        UI.modal.video.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
    }, 300);
    
    UI.modal.serverBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.server === serverType));
    UI.modal.langBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentAudio));
}

async function renderEpisodes(tvId, seasonNum) {
    UI.modal.episodesGrid.innerHTML = '<div class="loading-spinner">Loading Episodes...</div>';
    const episodes = await fetchSeason(tvId, seasonNum, langMap[currentAudio].tmdb);
    UI.modal.episodesGrid.innerHTML = '';
    
    episodes.forEach(ep => {
        const card = document.createElement('div');
        card.className = `episode-card ${ep.episodeNumber === currentE ? 'active' : ''}`;
        const still = ep.still || 'https://via.placeholder.com/300x169/12091d/a855f7?text=Episode';
        
        card.innerHTML = `
            <div class="episode-still-container">
                <img src="${still}" alt="${ep.name}" class="episode-still">
                <div class="episode-play-overlay"><i class="fas fa-play"></i></div>
            </div>
            <div class="episode-info">
                <h5>${ep.episodeNumber}. ${ep.name}</h5>
                <span>S${seasonNum} E${ep.episodeNumber}</span>
            </div>
        `;
        
        card.onclick = () => {
            currentE = ep.episodeNumber;
            document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            switchServer(currentServer);
        };
        UI.modal.episodesGrid.appendChild(card);
    });
}

export async function openPlayer(item) {
    currentItem = item;
    UI.modal.title.textContent = item.primaryTitle;
    UI.modal.year.textContent = item.startYear;
    UI.modal.rating.textContent = `⭐ ${item.rating?.aggregateRating || 'N/A'}`;
    UI.modal.overview.textContent = 'Initializing localized experience...';
    UI.modal.video.innerHTML = '<div class="loading-spinner">Locating Source...</div>';
    UI.modal.cast.innerHTML = '';
    UI.modal.recommendations.innerHTML = '';
    UI.modal.tvControls.style.display = 'none';
    currentS = 1;
    currentE = 1;

    UI.modal.el.classList.add('active');
    UI.modal.el.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';

    await refreshModalContent(item);
}

async function refreshModalContent(item) {
    if (isSwitching || !item) return;
    isSwitching = true;
    UI.modal.el.style.opacity = '0.7';
    
    try {
        const lang = langMap[currentAudio] || langMap.en;
        const fullData = await fetchFullDetails(item.tmdbId, item.type, lang.tmdb);
        
        if (fullData) {
            const verifiedType = fullData.type || item.type;
            currentItem = { ...item, ...fullData, type: verifiedType };
            
            switchServer(currentServer, true);

            UI.modal.title.textContent = fullData.title || fullData.name || item.primaryTitle;
            UI.modal.overview.textContent = fullData.overview || item.plot;
            UI.modal.type.textContent = verifiedType === 'TV_SERIES' ? 'Series' : 'Movie';

            if (verifiedType === 'TV_SERIES') {
                UI.modal.tvControls.style.display = 'block';
                UI.modal.seasonSelect.innerHTML = (fullData.seasons || [])
                    .filter(s => s.season_number > 0)
                    .map(s => `<option value="${s.season_number}" ${s.season_number === currentS ? 'selected' : ''}>${s.name}</option>`)
                    .join('');
                
                UI.modal.seasonSelect.onchange = (e) => {
                    currentS = parseInt(e.target.value);
                    currentE = 1;
                    renderEpisodes(item.tmdbId, currentS);
                };
                renderEpisodes(item.tmdbId, currentS);
            }

            UI.modal.cast.innerHTML = '';
            fullData.cast.forEach(actor => {
                const card = document.createElement('div');
                card.className = 'cast-card';
                const profile = actor.profile || 'https://via.placeholder.com/130x130/12091d/a855f7?text=No+Photo';
                card.innerHTML = `
                    <img src="${profile}" alt="${actor.name}" class="cast-img">
                    <span class="cast-name">${actor.name}</span>
                    <span class="cast-role">${actor.character}</span>
                `;
                UI.modal.cast.appendChild(card);
            });

            UI.modal.recommendations.innerHTML = '';
            renderGrid(fullData.recommendations, UI.modal.recommendations);

            const availableLangs = (fullData.translations || []).map(t => t.iso_639_1);
            UI.modal.langBtns.forEach(btn => {
                const langCode = btn.dataset.lang;
                if (langCode === 'en') return;
                const isAvailable = availableLangs.includes(langCode);
                btn.classList.toggle('disabled', !isAvailable);
            });

            UI.modal.trailerBtn.onclick = () => {
                UI.modal.video.innerHTML = fullData.trailerUrl 
                    ? `<iframe src="${fullData.trailerUrl}" allowfullscreen></iframe>`
                    : '<div class="error-msg">Trailer not available.</div>';
            };
        }
    } catch (e) {
        console.error("Translation Error:", e);
    } finally {
        isSwitching = false;
        UI.modal.el.style.opacity = '1';
    }
}

export function closePlayer() {
    currentItem = null;
    UI.modal.el.classList.remove('active');
    UI.modal.video.innerHTML = '';
    document.body.style.overflow = 'auto';
}

UI.modal.close.onclick = closePlayer;
window.onclick = (e) => { if (e.target == UI.modal.el) closePlayer(); };

UI.modal.serverBtns.forEach(btn => btn.onclick = () => switchServer(btn.dataset.server));
UI.modal.langBtns.forEach(btn => {
    btn.onclick = async () => {
        if (currentAudio === btn.dataset.lang || isSwitching || !currentItem) return;
        currentAudio = btn.dataset.lang;
        await refreshModalContent(currentItem);
    };
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) UI.header.classList.add('scrolled');
    else UI.header.classList.remove('scrolled');
});
