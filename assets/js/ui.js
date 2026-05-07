import { getEmbedUrl, API_CONFIG, fetchTrailer } from './api.js';
import { translations, t } from './i18n.js';

let currentItem = null;
let currentServer = 'vidplays';
let currentAudio = 'en';
let currentSub = 'en';
let customSubUrl = '';

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
        type: document.querySelector('#modal-type'),
        overview: document.querySelector('#modal-overview'),
        serverBtns: document.querySelectorAll('.server-btn'),
        audioBtns: document.querySelectorAll('#audio-options .lang-btn'),
        subBtns: document.querySelectorAll('#sub-options .lang-btn'),
        subInput: document.querySelector('#custom-sub-url'),
        subApply: document.querySelector('#apply-sub-btn'),
        trailerBtn: document.querySelector('#watch-trailer-btn')
    },
    hero: {
        section: document.querySelector('#hero'),
        title: document.querySelector('#hero-title'),
        desc: document.querySelector('#hero-desc'),
        playBtn: document.querySelector('#hero-play')
    }
};

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

export function setupHero(item) {
    if (item.backdrop) {
        UI.hero.section.style.backgroundImage = `url('${item.backdrop}')`;
    } else if (item.primaryImage?.url) {
        UI.hero.section.style.backgroundImage = `url('${item.primaryImage.url}')`;
    }
    UI.hero.title.textContent = item.primaryTitle;
    UI.hero.desc.textContent = item.plot || 'Discover the best movies and series on Cinema.';
    UI.hero.playBtn.onclick = () => openPlayer(item);
}

export function switchServer(serverType) {
    if (!currentItem) return;

    currentServer = serverType;
    const id = currentItem.id;
    const isTV = currentItem.type === 'TV_SERIES';
    const releaseYear = parseInt(currentItem.startYear);
    const currentYear = new Date().getFullYear();

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
    
    const audioCode = currentAudio === 'es' ? 'es-ES' : 'en-US';
    const subCode = currentSub === 'es' ? 'es-ES' : 'en-US';

    const audioParam = `&audio_lang=${audioCode}&audio=${currentAudio}`;
    const subParam = currentSub === 'none' ? '&sub=0&subtitle_lang=none' : `&sub=1&subtitle_lang=${subCode}`;
    
    let opensubs = '';
    if (customSubUrl) {
        opensubs = `&opensubs=${encodeURIComponent(customSubUrl)}|Custom`;
    }

    switch(serverType) {
        case 'vidplays':
            url = isTV 
                ? `https://vidplays.fun/embed/tv/${id}/1/1?type=tv&s=1&e=1${audioParam}${subParam}${opensubs}` 
                : `https://vidplays.fun/embed/movie/${id}?type=movie${audioParam}${subParam}${opensubs}`;
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
    
    UI.modal.serverBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.server === serverType);
    });

    UI.modal.audioBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentAudio));
    UI.modal.subBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentSub));
}

export function openPlayer(item) {
    currentItem = item;
    UI.modal.title.textContent = item.primaryTitle;
    UI.modal.year.textContent = item.startYear;
    UI.modal.rating.textContent = `⭐ ${item.rating?.aggregateRating || 'N/A'}`;
    UI.modal.type.textContent = item.type === 'TV_SERIES' ? 'Series' : 'Movie';
    UI.modal.overview.textContent = item.plot || 'No description available.';

    customSubUrl = '';
    UI.modal.subInput.value = '';

    switchServer(currentServer);

    UI.modal.trailerBtn.onclick = async () => {
        const trailerUrl = await fetchTrailer(item.tmdbId, item.type);
        if (trailerUrl) {
            UI.modal.video.innerHTML = `<iframe src="${trailerUrl}" allowfullscreen></iframe>`;
        } else {
            alert('Trailer not available for this title.');
        }
    };

    UI.modal.el.classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function closePlayer() {
    currentItem = null;
    UI.modal.el.classList.remove('active');
    UI.modal.video.innerHTML = '';
    document.body.style.overflow = 'auto';
}

UI.modal.close.onclick = closePlayer;
window.onclick = (e) => { if (e.target == UI.modal.el) closePlayer(); };

UI.modal.serverBtns.forEach(btn => {
    btn.onclick = () => switchServer(btn.dataset.server);
});

UI.modal.audioBtns.forEach(btn => {
    btn.onclick = () => {
        currentAudio = btn.dataset.lang;
        switchServer(currentServer);
    };
});

UI.modal.subBtns.forEach(btn => {
    btn.onclick = () => {
        currentSub = btn.dataset.lang;
        switchServer(currentServer);
    };
});

UI.modal.subApply.onclick = () => {
    customSubUrl = UI.modal.subInput.value.trim();
    if (customSubUrl) {
        switchServer(currentServer);
    }
};

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) UI.header.classList.add('scrolled');
    else UI.header.classList.remove('scrolled');
});
