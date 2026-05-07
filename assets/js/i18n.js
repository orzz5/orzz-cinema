export const translations = {
    en: {
        home: "Home",
        movies: "Movies",
        series: "Series",
        search_placeholder: "Search movies, series...",
        featured: "Featured",
        watch_now: "Watch Now",
        more_info: "More Info",
        trending: "Trending Now",
        top_rated: "Top Rated",
        popular_series: "Popular Series",
        view_all: "View All",
        results: "Results",
        no_content: "No content found.",
        loading: "Loading...",
        server: "Server",
        coming_soon: "Coming Soon",
        coming_soon_desc: "This content has not been released yet. Check back later!"
    },
    es: {
        home: "Inicio",
        movies: "Películas",
        series: "Series",
        search_placeholder: "Buscar películas, series...",
        featured: "Destacado",
        watch_now: "Ver Ahora",
        more_info: "Más Info",
        trending: "Tendencias",
        top_rated: "Mejor Valoradas",
        popular_series: "Series Populares",
        view_all: "Ver Todo",
        results: "Resultados",
        no_content: "No se encontró contenido.",
        loading: "Cargando...",
        server: "Servidor",
        coming_soon: "Próximamente",
        coming_soon_desc: "Este contenido aún no ha sido estrenado. ¡Vuelve más tarde!"
    }
};

let currentLang = 'en';

export function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Update placeholders
    const searchInput = document.querySelector('#movie-search');
    if (searchInput) {
        searchInput.placeholder = translations[lang].search_placeholder;
    }
    
    // Update active state in switcher
    const switcherBtns = document.querySelectorAll('.lang-switcher button');
    switcherBtns.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.querySelector(`#lang-${lang}`);
    if (activeBtn) activeBtn.classList.add('active');
}

export function t(key) {
    return translations[currentLang][key] || key;
}
