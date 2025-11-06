// =============================
// 🔎 Movie Search Logic (with Book Now → movies.html redirect)
// =============================

const TMDB_API_KEY = "68e2bfbc4d92fe524178126b4066a5d2";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

const queryParams = new URLSearchParams(window.location.search);
const query = queryParams.get("query");
document.getElementById("search-query").textContent = query
  ? `Results for "${query}"`
  : "No search term provided.";

async function searchMovies() {
  if (!query) return;

  const grid = document.getElementById("movie-grid");
  grid.innerHTML = `<p class='text-gray-400 text-center col-span-full'>Loading...</p>`;

  try {
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
        query
      )}&page=1`
    );
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      grid.innerHTML = `<p class='text-gray-400 text-center col-span-full'>No results found for "${query}".</p>`;
      return;
    }

    grid.innerHTML = data.results
      .slice(0, 16)
      .map(
        (movie) => `
        <div onclick='showMovieDetail(${JSON.stringify(movie).replace(/"/g, "&quot;")})' 
             class="cursor-pointer bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:scale-105 transform transition duration-300">
          <img src="${IMG_BASE + movie.poster_path}" 
               alt="${movie.title}" 
               class="w-full h-[350px] object-cover" />
          <div class="p-3">
            <p class="text-gray-200 font-semibold truncate">${movie.title}</p>
            <p class="text-sm text-yellow-400 mt-1">⭐ ${movie.vote_average.toFixed(1)}</p>
          </div>
        </div>
      `
      )
      .join("");
  } catch (error) {
    console.error("❌ Error searching movies:", error);
    grid.innerHTML = `<p class='text-center text-red-400'>Failed to fetch search results.</p>`;
  }
}

// 🎥 Show Movie Details
function showMovieDetail(movie) {
  window.selectedMovie = movie; // ✅ store for Book Now redirect

  document.getElementById("detail-backdrop").src = `${IMAGE_BASE_URL}${movie.backdrop_path}`;
  document.getElementById("detail-title").textContent = movie.title;
  document.getElementById("detail-rating").textContent = `⭐ ${movie.vote_average.toFixed(1)} | ${movie.release_date}`;
  document.getElementById("detail-overview").textContent =
    movie.overview || "No description available.";
  document.getElementById("detail-poster").src = `${IMG_BASE}${movie.poster_path}`;

  document.getElementById("movie-detail").classList.remove("hidden");
}

// ❌ Close Detail
document.getElementById("close-detail").addEventListener("click", () => {
  document.getElementById("movie-detail").classList.add("hidden");
});

// ✅ Book Now → Redirect to movies.html
document.addEventListener("DOMContentLoaded", () => {
  const bookBtn = document.getElementById("detail-book-btn");
  if (bookBtn) {
    bookBtn.addEventListener("click", () => {
      if (window.selectedMovie) {
        localStorage.setItem("selectedMovie", JSON.stringify(window.selectedMovie));
      }
      window.location.href = "movies.html";
    });
  }
});

// 🚀 Start Search
window.addEventListener("DOMContentLoaded", searchMovies);
