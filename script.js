// URLs for multiple pages to increase load limit

const loadingElement = document.getElementById('loading');
const animeContainer = document.getElementById('anime-container');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const themeToggle = document.getElementById('theme-toggle');
const leaderboardList = document.getElementById('leaderboard-list');

// Modal Elements
const modal = document.getElementById('anime-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');

// Global state for all fetched animes
let allAnimes = [];

// Lookup map to quickly get detailed data by ID without more API calls
const animeLookup = new Map();

const apiUrl1 = 'https://api.jikan.moe/v4/anime?page=1';
const apiUrl2 = 'https://api.jikan.moe/v4/anime?page=2';

async function fetchAnime() {
    try {
        // Fetch first page
        const response1 = await fetch(apiUrl1);
        if (!response1.ok) throw new Error(`HTTP error! Status: ${response1.status}`);
        const data1 = await response1.json();
        
        // Slight delay to be safe with Jikan API rate limit (3 req/sec)
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Fetch second page to increase the load limit
        const response2 = await fetch(apiUrl2);
        if (!response2.ok) throw new Error(`HTTP error! Status: ${response2.status}`);
        const data2 = await response2.json();
        
        // Combine data to double the loaded anime
        allAnimes = [...(data1.data || []), ...(data2.data || [])];
        
        // Add to our lookup Map
        allAnimes.forEach(anime => animeLookup.set(anime.mal_id, anime));
        
        loadingElement.style.display = 'none';
        renderAnimes(); // Initial render
        
    } catch (error) {
        console.error("Failed to fetch anime data:", error);
        loadingElement.innerText = "Error loading anime data. Please try again later.";
        loadingElement.style.color = "red";
    }
}

function renderAnimes() {
    const searchTerm = searchInput.value.toLowerCase();
    const sortOption = sortSelect.value;
    
    // 1. FILTERING: using Array.prototype.filter
    let filteredAnimes = allAnimes.filter(anime => 
        (anime.title || '').toLowerCase().includes(searchTerm)
    );
    
    // 2. SORTING: using Array.prototype.sort
    filteredAnimes.sort((a, b) => {
        if (sortOption === 'score-desc') return (b.score || 0) - (a.score || 0);
        if (sortOption === 'score-asc') return (a.score || 0) - (b.score || 0);
        if (sortOption === 'title-asc') return (a.title || '').localeCompare(b.title || '');
        if (sortOption === 'title-desc') return (b.title || '').localeCompare(a.title || '');
        return 0; // default order based on API
    });
    
    // 3. RENDERING: using Array.prototype.map and Array.prototype.join
    const htmlCards = filteredAnimes.map(anime => {
        const title = anime.title || 'Unknown Title';
        const imageUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '';
        const score = anime.score ? anime.score : 'N/A';
        
        return `
            <div class="anime-card" data-id="${anime.mal_id}">
                <div class="image-container">
                    <span class="floating-badge">⭐ ${score}</span>
                    <button class="favorite-btn" title="Add to Favorites">🤍</button>
                    <img src="${imageUrl}" loading="lazy" alt="${title}">
                </div>
                <div class="card-content">
                    <h3>${title}</h3>
                </div>
            </div>
        `;
    }).join('');
    
    animeContainer.innerHTML = htmlCards;
}

// Searching and Filtering Events
searchInput.addEventListener('input', renderAnimes);

// Sorting Events
sortSelect.addEventListener('change', renderAnimes);

// Dark Mode Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// Modal Logic
function openModal(id) {
    const anime = animeLookup.get(Number(id));
    if (!anime) return;
    
    const title = anime.title || 'Unknown Title';
    const score = anime.score || 'N/A';
    const eps = anime.episodes || 'TBA';
    const year = anime.year || 'Unknown Year';
    const status = anime.status || 'Unknown Status';
    const synopsis = anime.synopsis || 'No synopsis available for this title.';
    const imageUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '';
    
    modalBody.innerHTML = `
        <div class="modal-body-content">
            <img src="${imageUrl}" alt="${title}" class="modal-image">
            <div class="modal-info">
                <h2 class="modal-title">${title}</h2>
                <div class="modal-meta">
                    <span>⭐ ${score}</span>
                    <span>📺 ${eps} Episodes</span>
                    <span>📅 ${year}</span>
                    <span>${status}</span>
                </div>
                <div class="modal-synopsis">${synopsis}</div>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

closeModal.addEventListener('click', () => modal.classList.remove('show'));

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});

// Button Interaction: Event Delegation for "Favorite" buttons AND Card Clicks
animeContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('favorite-btn')) {
        const btn = event.target;
        btn.classList.toggle('active');
        btn.innerText = btn.classList.contains('active') ? '❤️' : '🤍';
        return; // Prevent modal opening
    }
    
    // Open Modal if clicked on card
    const card = event.target.closest('.anime-card');
    if (card) {
        openModal(card.dataset.id);
    }
});

// Fetch Leaderboard logic
async function fetchLeaderboard() {
    try {
        const response = await fetch('https://api.jikan.moe/v4/anime?status=airing&order_by=score&sort=desc&limit=5');
        if (!response.ok) throw new Error('Leaderboard fetch failed');
        const data = await response.json();
        
        const topAiring = data.data || [];
        
        // Add to Lookup map
        topAiring.forEach(anime => animeLookup.set(anime.mal_id, anime));
        
        // Render using higher-order functions
        leaderboardList.innerHTML = topAiring.map((anime, index) => {
            const title = anime.title || 'Unknown';
            const score = anime.score || 'N/A';
            const img = anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url || '';
            
            return `
                <li class="leaderboard-item" title="${title}" data-id="${anime.mal_id}">
                    <span class="rank">#${index + 1}</span>
                    <img src="${img}" loading="lazy" alt="${title}">
                    <div class="leaderboard-info">
                        <h4>${title}</h4>
                        <span class="score">⭐ ${score}</span>
                    </div>
                </li>
            `;
        }).join('');
        
    } catch (error) {
        console.error(error);
        leaderboardList.innerHTML = '<li class="error" style="color:red">Failed to load leaderboard</li>';
    }
}

// Click on leaderboard items
leaderboardList.addEventListener('click', (event) => {
    const item = event.target.closest('.leaderboard-item');
    if (item) {
        openModal(item.dataset.id);
    }
});

// Initial Fetch
fetchAnime();
setTimeout(fetchLeaderboard, 600); // Slight delay to ensure it doesn't collide with the first two Jikan requests
