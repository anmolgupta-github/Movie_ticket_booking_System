// =============================
// 🎬 Movie Booking Frontend JS (FINAL WORKING VERSION)
// =============================

const TMDB_API_KEY = "68e2bfbc4d92fe524178126b4066a5d2";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
const API_BASE = "http://localhost:3000/api"; // ✅ backend must run here

let selectedSeats = new Set();
window.featuredMovie = null;
window.selectedMovie = null;

// ✅ Load featured movie
async function loadFeatured() {
  const res = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
  const data = await res.json();
  const movie = data.results[Math.floor(Math.random() * data.results.length)];
  window.featuredMovie = movie;
  document.getElementById("featured-image").src = `${IMAGE_BASE_URL}${movie.backdrop_path}`;
  document.getElementById("featured-title").textContent = movie.title;
  document.getElementById("featured-overview").textContent = movie.overview;
}

// ✅ Load movie category rows
async function loadCategory(endpoint, containerId) {
  const container = document.querySelector(`#${containerId} .scroll-container`);
  const res = await fetch(`${BASE_URL}/movie/${endpoint}?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
  const data = await res.json();
  container.innerHTML = data.results
    .slice(0, 15)
    .map(
      (movie) => `
      <div onclick='showMovieDetail(${JSON.stringify(movie).replace(/"/g, "&quot;")})'
           class="min-w-[180px] cursor-pointer bg-gray-900 rounded-xl overflow-hidden hover:scale-105 transform transition duration-300 shadow-lg">
        <img src="${IMG_BASE + movie.poster_path}" alt="${movie.title}" class="w-full h-[260px] object-cover" />
        <p class="p-2 text-sm text-center text-gray-300">${movie.title}</p>
      </div>`
    )
    .join("");
}

// ✅ Show movie detail
function showMovieDetail(movie) {
  window.selectedMovie = movie;
  document.getElementById("detail-backdrop").src = `${IMAGE_BASE_URL}${movie.backdrop_path}`;
  document.getElementById("detail-title").textContent = movie.title;
  document.getElementById("detail-overview").textContent = movie.overview || "No description available.";
  document.getElementById("detail-rating").textContent = `⭐ ${movie.vote_average.toFixed(1)} | ${movie.release_date}`;
  document.getElementById("detail-poster").src = `${IMG_BASE}${movie.poster_path}`;
  document.getElementById("movie-detail").classList.remove("hidden");
}

document.getElementById("close-detail").onclick = () =>
  document.getElementById("movie-detail").classList.add("hidden");

// ✅ Open booking modal
function openBookingModal(movie) {
  if (!movie) return showInlineMessage("Error loading movie", "error");
  window.selectedMovie = movie;

  document.getElementById("booking-title").textContent = `Book: ${movie.title}`;
  document.getElementById("booking-modal").classList.remove("hidden");

  document.getElementById("theatre-select").innerHTML = `<option value="">Select Theatre</option>`;
  document.getElementById("show-select").innerHTML = `<option value="">Select Show Time</option>`;
  document.getElementById("seat-grid").innerHTML = "";
  selectedSeats.clear();

  loadTheatres();
}

document.getElementById("close-booking").onclick = () =>
  document.getElementById("booking-modal").classList.add("hidden");

// ✅ Load theatres from backend
async function loadTheatres() {
  try {
    const res = await fetch(`${API_BASE}/theatres`);
    const theatres = await res.json();
    const select = document.getElementById("theatre-select");

    select.innerHTML =
      `<option value="">Select Theatre</option>` +
      theatres.map((t) => `<option value="${t.theatre_id}">${t.name}</option>`).join("");

    select.onchange = (e) => {
      const theatre_id = e.target.value;
      if (theatre_id) loadShows(theatre_id);
    };
  } catch (err) {
    console.error("Error loading theatres:", err);
    showInlineMessage("⚠️ Failed to load theatres", "error");
  }
}

// ✅ Load showtimes
async function loadShows(theatre_id) {
  const tmdb_id = (window.selectedMovie || window.featuredMovie)?.id;
  try {
    const res = await fetch(`${API_BASE}/theatres/shows/${theatre_id}?tmdb_id=${tmdb_id}`);
    let shows = await res.json();

    if (!shows.length) {
      shows = [
        { show_id: 1, show_time: new Date(Date.now() + 2 * 3600000), ticket_price: 250 },
        { show_id: 2, show_time: new Date(Date.now() + 5 * 3600000), ticket_price: 300 },
        { show_id: 3, show_time: new Date(Date.now() + 8 * 3600000), ticket_price: 350 },
      ];
    }

    const select = document.getElementById("show-select");
    select.innerHTML =
      `<option value="">Select Show Time</option>` +
      shows
        .map(
          (s) =>
            `<option value="${s.show_id}">
            ${new Date(s.show_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ₹${s.ticket_price}
            </option>`
        )
        .join("");

    generateSeats(25);
  } catch (err) {
    console.error("Error loading shows:", err);
    showInlineMessage("⚠️ Failed to load showtimes", "error");
  }
}

// ✅ Generate seat grid
function generateSeats(count) {
  const grid = document.getElementById("seat-grid");
  selectedSeats = new Set();
  grid.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className =
      "h-9 text-sm rounded-md px-2 bg-gray-700 text-white hover:bg-blue-600 transition border border-gray-600";
    btn.onclick = () => {
      if (selectedSeats.has(i)) {
        selectedSeats.delete(i);
        btn.classList.remove("bg-blue-600");
        btn.classList.add("bg-gray-700");
      } else {
        selectedSeats.add(i);
        btn.classList.remove("bg-gray-700");
        btn.classList.add("bg-blue-600");
      }
    };
    grid.appendChild(btn);
  }
}

// ✅ Confirm Booking (with inline message)
async function confirmBooking() {
  const token = localStorage.getItem("token");
  if (!token) return showInlineMessage("Please login first!", "error");

  const user = JSON.parse(atob(token.split(".")[1]));
  const user_id = user.id;
  const theatre_id = document.getElementById("theatre-select").value;
  const show_id = document.getElementById("show-select").value;
  const seats = [...selectedSeats];

  if (!theatre_id || !show_id || !seats.length)
    return showInlineMessage("⚠️ Please select theatre, showtime, and seats.", "error");

  const body = {
    user_id,
    tmdb_id: (window.selectedMovie || window.featuredMovie).id,
    theatre_id,
    show_id,
    selected_seats: seats,
  };

  try {
    const res = await fetch(`${API_BASE}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Invalid JSON:", text);
      return showInlineMessage("Server returned invalid response.", "error");
    }

    if (data.success) {
      showInlineMessage("🎟️ Booking Confirmed!", "success");
      setTimeout(() => (window.location.href = "mybookings.html"), 1500);
    } else {
      showInlineMessage(data.message || "❌ Booking failed!", "error");
    }
  } catch (err) {
    console.error("Booking Error:", err);
    showInlineMessage("Server error. Try again!", "error");
  }
}

// ✅ Inline message (below confirm button)
function showInlineMessage(msg, type = "info") {
  let box = document.getElementById("booking-msg");
  if (!box) {
    box = document.createElement("div");
    box.id = "booking-msg";
    const confirmBtn = document.getElementById("confirm-booking");
    confirmBtn.insertAdjacentElement("afterend", box);
  }
  box.textContent = msg;
  box.className =
    "text-center mt-3 font-medium " +
    (type === "success" ? "text-green-400" : type === "error" ? "text-red-400" : "text-gray-400");
}

// ✅ Initialize
window.addEventListener("DOMContentLoaded", () => {
  loadFeatured();
  loadCategory("popular", "popular");
  loadCategory("now_playing", "now-playing");
  loadCategory("top_rated", "top-rated");
  loadCategory("upcoming", "upcoming");

  const confirmBtn = document.getElementById("confirm-booking");
  if (confirmBtn) confirmBtn.addEventListener("click", confirmBooking);
});
// ✅ Auto-open booking modal if redirected from homepage
window.addEventListener("DOMContentLoaded", () => {
  const storedMovie = localStorage.getItem("selectedMovie");
  if (storedMovie) {
    try {
      const movie = JSON.parse(storedMovie);
      localStorage.removeItem("selectedMovie"); // clear after use
      openBookingModal(movie); // open modal directly
    } catch (err) {
      console.error("Failed to parse selected movie:", err);
    }
  }
});
