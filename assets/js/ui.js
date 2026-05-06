import { getEmbedUrl, API_CONFIG } from './api.js';
import { translations, t } from './i18n.js';

// State Management
let currentItem = null;
let currentServer = 'vidplays';
let currentAudio = 'en-US';
let currentSub = 'en-US';

// UI Registry
export const UI = {
    header: document.querySelector('#main-header'),
    search: document.querySelector('#movie-search'),
    grids: {
        trending: document.querySelector('#trending-grid'),
        topRated: document.querySelector('#top-rated-grid'),
        series: document.querySelector('#series-grid')
    },
    modal: {
        el: document.querySelector('#player-modal'),
        close: document.querySelector('.close-modal'),
        video: document.querySelector('.video-container'),
        title: document.querySelector('#modal-title'),
        year: document.querySelector('#modal-year'),
        rating: document.querySelector('#modal-rating'),
        overview: document.querySelector('#modal-overview'),
        serverBtns: document.querySelectorAll('.server-btn'),
        audioBtns: document.querySelectorAll('#audio-options .lang-btn'),
        subBtns: document.querySelectorAll('#sub-options .lang-btn')
    },
    hero: {
        section: document.querySelector('#hero'),
        title: document.querySelector('#hero-title'),
        desc: document.querySelector('#hero-desc'),
        playBtn: document.querySelector('#hero-play')
    }
};

/**
 * Render a list of media items into a container
 */
export function renderGrid(items, container) {
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

/**
 * Setup the Hero section with a featured item
 */
export function setupHero(item) {
    if (item.primaryImage?.url) {
        UI.hero.section.style.backgroundImage = `url('${item.primaryImage.url}')`;
    }
    UI.hero.title.textContent = item.primaryTitle;
    UI.hero.desc.textContent = item.plot || 'Discover the best movies and series on Cinema.';
    UI.hero.playBtn.onclick = () => openPlayer(item);
}

/**
 * Update the player source based on selected server and languages
 */
export function switchServer(serverType) {
    if (!currentItem) return;

    currentServer = serverType;
    const rawId = currentItem.id.replace('tt', '');
    const id = `tt${rawId}`;
    const isTV = currentItem.type === 'TV_SERIES';
    const releaseYear = parseInt(currentItem.startYear);
    const currentYear = new Date().getFullYear();

    // Check if unreleased
    if (releaseYear > currentYear) {
        const lang = document.querySelector('#lang-en').classList.contains('active') ? 'en' : 'es';
        const msg = translations[lang];
        UI.modal.video.innerHTML = `
            <div class="coming-soon-msg">
                <i class="fas fa-calendar-alt"></i>
                <h2>${msg.coming_soon} (${releaseYear})</h2>
                <p>${msg.coming_soon_desc}</p>
            </div>
        `;
        return;
    }

    let url = '';
    
    // ISO Mapping for Vidplays
    const audioCode = currentAudio === 'es' ? 'es-ES' : 'en-US';
    const subCode = currentSub === 'es' ? 'es-ES' : 'en-US';

    const audioParam = `&audio_lang=${audioCode}`;
    const subParam = currentSub === 'none' ? '&subtitle_lang=none' : `&subtitle_lang=${subCode}`;

    switch(serverType) {
        case 'vidplays':
            // Added ?type=tv and explicit s/e to prevent 500 errors
            url = isTV 
                ? `https://vidplays.fun/embed/tv/${id}/1/1?type=tv&season=1&episode=1${audioParam}${subParam}` 
                : `https://vidplays.fun/embed/movie/${id}?type=movie${audioParam}${subParam}`;
            break;
        case 'vidking':
            url = isTV ? `https://vidsrc.me/embed/tv?imdb=${id}&sea=1&epi=1` : `https://vidking.net/embed/movie/${id}?color=${API_CONFIG.ACCENT_COLOR}`;
            break;
        case 'vidsrc_to':
            url = isTV ? `https://vidsrc.to/embed/tv/${id}/1/1` : `https://vidsrc.to/embed/movie/${id}`;
            break;
        case 'vidsrc_me':
            url = isTV ? `https://vidsrc.me/embed/tv?imdb=${id}&sea=1&epi=1` : `https://vidsrc.me/embed/movie?imdb=${id}`;
            break;
    }

    UI.modal.video.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
    
    // Update server button active state
    UI.modal.serverBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.server === serverType);
    });

    // Update audio/sub button active states
    UI.modal.audioBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentAudio));
    UI.modal.subBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentSub));
}

/**
 * Open the video player modal
 */
export function openPlayer(item) {
    currentItem = item;
    UI.modal.title.textContent = item.primaryTitle;
    UI.modal.year.textContent = item.startYear;
    UI.modal.rating.textContent = `⭐ ${item.rating?.aggregateRating || 'N/A'}`;
    UI.modal.overview.textContent = item.plot || 'No description available.';

    // Default to current selection
    switchServer(currentServer);

    UI.modal.el.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the player modal
 */
export function closePlayer() {
    currentItem = null;
    UI.modal.el.classList.remove('active');
    UI.modal.video.innerHTML = '';
    document.body.style.overflow = 'auto';
}

// Global UI Events
UI.modal.close.onclick = closePlayer;
window.onclick = (e) => { if (e.target == UI.modal.el) closePlayer(); };

// Server button events
UI.modal.serverBtns.forEach(btn => {
    btn.onclick = () => switchServer(btn.dataset.server);
});

// Audio button events
UI.modal.audioBtns.forEach(btn => {
    btn.onclick = () => {
        currentAudio = btn.dataset.lang;
        switchServer(currentServer);
    };
});

// Subtitle button events
UI.modal.subBtns.forEach(btn => {
    btn.onclick = () => {
        currentSub = btn.dataset.lang;
        switchServer(currentServer);
    };
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) UI.header.classList.add('scrolled');
    else UI.header.classList.remove('scrolled');
});
