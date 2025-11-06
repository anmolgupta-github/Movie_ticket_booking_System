// =============================
// 🎬 Homepage Logic (with redirect to movies.html for booking)
// =============================

// ✅ API Constants
const TMDB_API_KEY = "68e2bfbc4d92fe524178126b4066a5d2";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
const IMG_BASE = "https://image.tmdb.org/t/p/w500"; // smaller for grid

// 🎬 Load Upcoming Movie Banner
async function loadUpcomingBanner() {
  const bannerImage = document.getElementById("banner-image");
  const bannerTitle = document.getElementById("banner-title");
  const bannerOverview = document.getElementById("banner-overview");

  try {
    const response = await fetch(
      `${BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );
    if (!response.ok) throw new Error("Failed to fetch from TMDb");

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      bannerTitle.textContent = "No upcoming movies found.";
      return;
    }

    const movie = data.results[0];
    bannerImage.src = `${IMAGE_BASE_URL}${movie.backdrop_path}`;
    bannerTitle.textContent = movie.title;
    bannerOverview.textContent = movie.overview;

    // ✅ Banner Book Now → redirect to movies.html with movie info
    const bannerBtn = document.getElementById("banner-book-btn");
    if (bannerBtn) {
      bannerBtn.onclick = () => {
        localStorage.setItem("selectedMovie", JSON.stringify(movie));
        window.location.href = "movies.html";
      };
    }
  } catch (error) {
    console.error("❌ Error loading upcoming movie:", error);
    bannerTitle.textContent = "Error loading upcoming movie.";
  }
}

// 🍿 Load Popular Movies Grid
async function loadPopularMovies() {
  const grid = document.getElementById("movie-grid");
  if (!grid) return console.error("❌ Movie grid not found!");

  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );
    if (!response.ok) throw new Error("Failed to fetch popular movies");

    const data = await response.json();
    const movies = data.results.slice(0, 12); // 12 movies (4 per row)

    grid.innerHTML = movies
      .map(
        (movie) => `
      <div onclick="showMovieDetail(${JSON.stringify(movie).replace(/"/g, '&quot;')})"
           class="cursor-pointer group bg-gray-900/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-blue-500/40 hover:scale-105 transform transition duration-500 border border-gray-800">
        <div class="relative">
          <img src="${IMG_BASE + movie.poster_path}" 
               alt="${movie.title}" 
               class="w-full h-[400px] object-cover transition-transform duration-500 group-hover:scale-110" />
          <div class="absolute top-3 left-3 bg-black/70 text-yellow-400 text-sm font-semibold px-3 py-1 rounded-full shadow-md">
            ⭐ ${movie.vote_average.toFixed(1)}
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-lg font-bold text-blue-400 mb-2 line-clamp-1">${movie.title}</h3>
          <p class="text-gray-400 text-sm line-clamp-3 mb-3">${movie.overview || "No description available."}</p>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("❌ Error fetching popular movies:", error);
    grid.innerHTML = "<p class='text-center text-gray-400'>Failed to load popular movies.</p>";
  }
}

// 🎥 Show Movie Details
function showMovieDetail(movie) {
  window.currentDetailMovie = movie; // ✅ store selected movie for Book Now redirect

  const section = document.getElementById("movie-detail");
  const backdrop = document.getElementById("detail-backdrop");
  const title = document.getElementById("detail-title");
  const overview = document.getElementById("detail-overview");
  const rating = document.getElementById("detail-rating");
  const poster = document.getElementById("detail-poster");

  backdrop.src = `${IMAGE_BASE_URL}${movie.backdrop_path}`;
  title.textContent = movie.title;
  overview.textContent = movie.overview || "No description available.";
  rating.textContent = `⭐ ${movie.vote_average.toFixed(1)} | ${movie.release_date}`;
  poster.src = `${IMG_BASE}${movie.poster_path}`;

  section.classList.remove("hidden");
  section.classList.add("flex");
}

// ❌ Close Movie Details
document.getElementById("close-detail").addEventListener("click", () => {
  const section = document.getElementById("movie-detail");
  section.classList.add("hidden");
  section.classList.remove("flex");
});

// 🔍 Search Functionality
const searchButton = document.getElementById("search-button");
const searchInput = document.getElementById("search-input");

function redirectToSearch() {
  const query = searchInput.value.trim();
  if (query) {
    window.location.href = `search.html?query=${encodeURIComponent(query)}`;
  }
}

if (searchButton && searchInput) {
  searchButton.addEventListener("click", redirectToSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") redirectToSearch();
  });
}

// 🔐 JWT Authentication & Responsive Profile Dropdown
document.addEventListener("DOMContentLoaded", () => {
  const signInBtn = document.getElementById("signInBtn");
  if (!signInBtn) return;

  // Handle Sign In Click
  signInBtn.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  // ✅ If User Logged In
  const token = localStorage.getItem("token");
  if (token) {
    signInBtn.remove(); // Hide sign-in button

    const navRight = document.querySelector("nav > div:last-child");
    const profileContainer = document.createElement("div");
    profileContainer.className = "relative flex items-center space-x-3";

    profileContainer.innerHTML = `
      <!-- 👋 Greeting -->
      <span id="userGreeting" class="hidden sm:block text-gray-300 font-medium text-sm sm:text-base">
        Hi, <span id="userFirstName" class="text-blue-400 font-semibold">User</span> 👋
      </span>

      <!-- 👤 Avatar -->
      <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
           alt="User Avatar"
           class="w-10 h-10 rounded-full border border-gray-500 cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
           id="userAvatar">

      <!-- 🧾 User Info Card -->
      <div id="userDropdown"
           class="hidden absolute right-0 top-12 bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl shadow-2xl w-64 p-4 text-sm text-gray-300 z-50 opacity-0 scale-95 transform transition-all duration-300 ease-out">
        <div class="flex flex-col items-center mb-3">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
               class="w-16 h-16 rounded-full mb-2 border border-gray-600">
          <h3 id="userName" class="text-lg font-bold text-white"></h3>
          <p id="userEmail" class="text-gray-400 text-xs"></p>
        </div>
        <hr class="border-gray-700 mb-3">
        <button id="logoutBtn"
                class="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition">
          Logout
        </button>
      </div>
    `;

    navRight.appendChild(profileContainer);

    // Decode JWT to get user info
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userName = payload.name || "Unknown User";
    const userEmail = payload.email || "No Email Found";
    const firstName = userName.split(" ")[0] || "User";

    // Update UI
    document.getElementById("userFirstName").textContent = firstName;
    document.getElementById("userName").textContent = userName;
    document.getElementById("userEmail").textContent = userEmail;

    // Dropdown Animation Toggle
    const avatar = document.getElementById("userAvatar");
    const dropdown = document.getElementById("userDropdown");

    avatar.addEventListener("click", () => {
      if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        setTimeout(() => {
          dropdown.classList.add("opacity-100", "scale-100");
          dropdown.classList.remove("opacity-0", "scale-95");
        }, 10);
      } else {
        dropdown.classList.remove("opacity-100", "scale-100");
        dropdown.classList.add("opacity-0", "scale-95");
        setTimeout(() => dropdown.classList.add("hidden"), 300);
      }
    });

    // Close dropdown if clicked outside
    document.addEventListener("click", (e) => {
      if (!profileContainer.contains(e.target)) {
        dropdown.classList.remove("opacity-100", "scale-100");
        dropdown.classList.add("opacity-0", "scale-95");
        setTimeout(() => dropdown.classList.add("hidden"), 300);
      }
    });

    // Logout functionality
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.reload();
    });
  }
});

// ✅ Navbar Navigation
moviepage.addEventListener("click", () => {
  window.location.href = "movies.html";
});
bookingpage.addEventListener("click", () => {
  window.location.href = "mybookings.html";
});

// ✅ Detail Book Now → redirect to movies.html with movie info
document.addEventListener("DOMContentLoaded", () => {
  const detailBtn = document.getElementById("detail-book-btn");
  if (detailBtn) {
    detailBtn.addEventListener("click", () => {
      if (window.currentDetailMovie) {
        localStorage.setItem("selectedMovie", JSON.stringify(window.currentDetailMovie));
      }
      window.location.href = "movies.html";
    });
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

// 🚀 Initialize on Load
window.addEventListener("DOMContentLoaded", () => {
  loadUpcomingBanner();
  loadPopularMovies();
});
