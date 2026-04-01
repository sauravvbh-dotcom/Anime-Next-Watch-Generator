const apiUrl = 'https://api.jikan.moe/v4/anime';

const loadingElement = document.getElementById('loading');
const animeContainer = document.getElementById('anime-container');

async function fetchAnime() {
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        const animeList = data.data;
        
        loadingElement.style.display = 'none';
        displayAnimeCards(animeList);
        
    } catch (error) {
        console.error("Failed to fetch anime data:", error);
        loadingElement.innerText = "Error loading anime data. Please try again later.";
        loadingElement.style.color = "red";
    }
}

function displayAnimeCards(animes) {
    animes.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        
        const title = anime.title;
        const imageUrl = anime.images.jpg.large_image_url;
        const score = anime.score ? anime.score : 'N/A';
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${title}">
            <div class="card-content">
                <h3>${title}</h3>
                <span class="rating">⭐ ${score}</span>
            </div>
        `;
        
        animeContainer.appendChild(card);
    });
}

fetchAnime();
