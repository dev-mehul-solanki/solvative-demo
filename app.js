const searchBox = document.getElementById('search-box');
const resultsBody = document.getElementById('results-body');
const spinner = document.getElementById('spinner');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');
const limitInput = document.getElementById('limit-input');
const limitWarning = document.getElementById("limit-warning");
const searchWarning = document.getElementById("search-warning");

const API_KEY = '65e81aa47fmsh480f1c6f04bd104p1c4752jsna2b6a5f876bc';
const API_URL = 'https://wft-geo-db.p.rapidapi.com/v1/geo/cities';

let currentPage = 1;
let totalResults = 0;
let currentQuery = '';
let limit = 5;

async function fetchCities(query, page = 1, limit = 5) {
    const cacheKey = `${query}-${page}-${limit}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) return JSON.parse(cachedData);

    try {
        spinner.classList.remove('hidden');
        const response = await fetch(`${API_URL}?namePrefix=${query}&offset=${(page - 1) * limit}&limit=${limit}`, {
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'wft-geo-db.p.rapidapi.com'
            }
        });
        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
    } catch (error) {
        console.log('ERROR', error);
    }
    finally {
        spinner.classList.add('hidden');
    }
}

function renderTable(cities) {
    resultsBody.innerHTML = cities.length
        ? cities.map((city, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${city.city}</td>
          <td>
          <div class="flag-container">
            <img src="https://flagsapi.com/${city.countryCode}/shiny/32.png" alt="${city.country}">
            ${city.country}
            </div>
          </td>
        </tr>`).join('')
        : '<tr><td colspan="3">No result found</td></tr>';
}

let debounceTimer;
searchBox.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentQuery = searchBox.value.trim();
        if (currentQuery) searchCities();
        else resultsBody.innerHTML = '<tr><td colspan="3">Start searching</td></tr>';
    }, 500);
});

async function searchCities() {
    const data = await fetchCities(currentQuery, currentPage, limit);
    totalResults = data.metadata.totalCount;
    renderTable(data.data);
    updatePagination();
}

function updatePagination() {
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage * limit >= totalResults;
    pageInfo.textContent = `Page ${currentPage}`;
}

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        searchCities();
    }
});

nextBtn.addEventListener('click', () => {
    currentPage++;
    searchCities();
});

limitInput.addEventListener('input', (e) => {
    limit = parseInt(limitInput.value, 10);

    if (isNaN(limit) || limit < 1) {
        // limitInput.value = 1;
        showWarning("Minimum value is 1.", limitWarning);
    } else if (limit > 10) {
        // limitInput.value = 10;
        showWarning("Maximum value is 10.", limitWarning);
    } else {
        hideWarning(limitWarning);
        searchCities();
    }
});

function showWarning(message, id) {
    id.textContent = message;
    id.style.display = "inline";
}

function hideWarning(id) {
    id.style.display = "none";
}
