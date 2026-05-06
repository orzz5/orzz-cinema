import { getEmbedUrl } from './api.js';

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
        overview: document.querySelector('#modal-overview')
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
        // The API returns primaryImage as an object with a url property
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
 * Open the video player modal
 */
export function openPlayer(item) {
    UI.modal.title.textContent = item.primaryTitle;
    UI.modal.year.textContent = item.startYear;
    UI.modal.rating.textContent = `⭐ ${item.rating?.aggregateRating || 'N/A'}`;
    UI.modal.overview.textContent = item.plot || 'No description available.';

    const isTV = item.type === 'TV_SERIES';
    let embedUrl = `https://www.vidking.net/embed/movie/${item.id}?color=${API_CONFIG.ACCENT_COLOR}`;
    
    if (isTV) {
        // Fallback for TV Series because Vidking requires TMDB IDs for series
        // vidsrc.me supports IMDb IDs (tt...) directly for TV shows
        embedUrl = `https://vidsrc.me/embed/tv?imdb=${item.id}&sea=1&epi=1`;
    }

    UI.modal.video.innerHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
    UI.modal.el.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the player modal
 */
export function closePlayer() {
    UI.modal.el.classList.remove('active');
    UI.modal.video.innerHTML = '';
    document.body.style.overflow = 'auto';
}

// Global UI Events
UI.modal.close.onclick = closePlayer;
window.onclick = (e) => { if (e.target == UI.modal.el) closePlayer(); };

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) UI.header.classList.add('scrolled');
    else UI.header.classList.remove('scrolled');
});
