import { getEmbedUrl, fetchFullDetails } from './api.js';

let currentItem = null;
let currentServer = 'vidplays';

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
        trailerBtn: document.querySelector('#watch-trailer-btn'),
        cast: document.querySelector('#modal-cast'),
        recommendations: document.querySelector('#modal-recommendations')
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

export function switchServer(serverType) {
    if (!currentItem) return;
    currentServer = serverType;
    
    const id = currentItem.imdbId || currentItem.id;
    const isTV = currentItem.type === 'TV_SERIES';
    let url = '';

    switch(serverType) {
        case 'vidplays':
            url = isTV ? `https://vidplays.fun/embed/tv/${id}/1/1?type=tv&s=1&e=1` : `https://vidplays.fun/embed/movie/${id}?type=movie`;
            break;
        case 'vidking':
            url = isTV ? `https://vidsrc.me/embed/tv?imdb=${id}&sea=1&epi=1` : `https://vidking.net/embed/movie/${id}?color=a855f7`;
            break;
        case 'vidsrc_to':
            url = isTV ? `https://vidsrc.to/embed/tv/${id}/1/1` : `https://vidsrc.to/embed/movie/${id}`;
            break;
        case 'vidsrc_me':
            url = isTV ? `https://vidsrc.me/embed/tv?imdb=${id}&sea=1&epi=1` : `https://vidsrc.me/embed/movie?imdb=${id}`;
            break;
    }

    UI.modal.video.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
    UI.modal.serverBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.server === serverType));
}

export async function openPlayer(item) {
    UI.modal.title.textContent = item.primaryTitle;
    UI.modal.year.textContent = item.startYear;
    UI.modal.rating.textContent = `⭐ ${item.rating?.aggregateRating || 'N/A'}`;
    UI.modal.type.textContent = item.type === 'TV_SERIES' ? 'Series' : 'Movie';
    UI.modal.overview.textContent = 'Syncing high-quality stream...';
    UI.modal.video.innerHTML = '<div class="loading-spinner">Locating Source...</div>';
    UI.modal.cast.innerHTML = '';
    UI.modal.recommendations.innerHTML = '';

    UI.modal.el.classList.add('active');
    UI.modal.el.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';

    const fullData = await fetchFullDetails(item.tmdbId, item.type);
    if (fullData) {
        currentItem = { ...item, ...fullData };
        UI.modal.overview.textContent = fullData.overview || item.plot;
        
        // Render Cast
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

        // Render Recommendations
        renderGrid(fullData.recommendations, UI.modal.recommendations);

        switchServer(currentServer);

        UI.modal.trailerBtn.onclick = () => {
            if (fullData.trailerUrl) {
                UI.modal.video.innerHTML = `<iframe src="${fullData.trailerUrl}" allowfullscreen></iframe>`;
            } else {
                alert('Trailer not available for this title.');
            }
        };
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

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) UI.header.classList.add('scrolled');
    else UI.header.classList.remove('scrolled');
});
