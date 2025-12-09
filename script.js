// Minimal comments; core logic only
const API_URL = 'http://localhost:3000/movies';

const movieListDiv = document.getElementById('movie-list');
const searchInput = document.getElementById('search-input');
const form = document.getElementById('add-movie-form');

let allMovies = []; // full unfiltered list

// Render list of movies
function renderMovies(moviesToDisplay) {
  movieListDiv.innerHTML = '';
  if (!moviesToDisplay || moviesToDisplay.length === 0) {
    movieListDiv.innerHTML = '<p>No movies found matching your criteria.</p>';
    return;
  }

  moviesToDisplay.forEach(movie => {
    const el = document.createElement('div');
    el.className = 'movie-item';
    el.innerHTML = `
      <div class="movie-info">
        <p style="margin:0"><strong>${escapeHtml(movie.title)}</strong> (${movie.year}) - ${escapeHtml(movie.genre || '')}</p>
      </div>
      <div class="movie-actions">
        <button data-action="edit" data-id="${movie.id}">Edit</button>
        <button data-action="delete" data-id="${movie.id}">Delete</button>
      </div>
    `;
    movieListDiv.appendChild(el);
  });
}

// Fetch all movies (READ)
function fetchMovies() {
  fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(movies => {
      allMovies = movies;
      renderMovies(allMovies);
    })
    .catch(err => {
      console.error('Error fetching movies:', err);
      movieListDiv.innerHTML = '<p style="color:darkred">Failed to load movies. Is JSON Server running?</p>';
    });
}

fetchMovies();

// Search filter (client-side)
searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value.trim().toLowerCase();
  if (!searchTerm) {
    renderMovies(allMovies);
    return;
  }
  const filtered = allMovies.filter(m => {
    const t = (m.title || '').toLowerCase();
    const g = (m.genre || '').toLowerCase();
    return t.includes(searchTerm) || g.includes(searchTerm);
  });
  renderMovies(filtered);
});

// Add movie (CREATE)
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const genre = document.getElementById('genre').value.trim();
  const yearVal = document.getElementById('year').value;
  const year = parseInt(yearVal, 10);

  if (!title || !year || Number.isNaN(year)) {
    alert('Please provide valid title and year.');
    return;
  }
  const newMovie = { 
  id: Date.now(),   // 
  title, 
  genre, 
  year 
};


  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newMovie)
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to add movie');
      return res.json();
    })
    .then(added => {
      form.reset();
      fetchMovies();
    })
    .catch(err => {
      console.error('Error adding movie:', err);
      alert('Error adding movie. See console for details.');
    });
});

// Delegate edit/delete button clicks
movieListDiv.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!action || !id) return;

  if (action === 'delete') {
    if (!confirm('Delete this movie?')) return;
    deleteMovie(id);
  } else if (action === 'edit') {
    const movie = allMovies.find(m => String(m.id) === String(id));
    if (!movie) {
      alert('Movie not found.');
      return;
    }
    editMoviePrompt(movie);
  }
});

// Prompt user to edit and send update (PUT)
function editMoviePrompt(movie) {
  const newTitle = prompt('Enter new Title:', movie.title);
  if (newTitle === null) return; // user cancelled
  const newYearStr = prompt('Enter new Year:', movie.year);
  if (newYearStr === null) return;
  const newGenre = prompt('Enter new Genre:', movie.genre || '');

  const year = parseInt(newYearStr, 10);
  if (!newTitle.trim() || Number.isNaN(year)) {
    alert('Invalid title or year.');
    return;
  }

  const updatedMovie = { id: movie.id, title: newTitle.trim(), year, genre: (newGenre || '').trim() };

  updateMovie(movie.id, updatedMovie);
}

// PUT /movies/:id
function updateMovie(movieId, updatedMovieData) {
  fetch(`${API_URL}/${movieId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedMovieData)
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update movie');
      return res.json();
    })
    .then(() => fetchMovies())
    .catch(err => {
      console.error('Error updating movie:', err);
      alert('Error updating movie. See console for details.');
    });
}

// DELETE /movies/:id
function deleteMovie(movieId) {
  fetch(`${API_URL}/${movieId}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error('Failed to delete movie');
      fetchMovies();
    })
    .catch(err => {
      console.error('Error deleting movie:', err);
      alert('Error deleting movie. See console for details.');
    });
}

// Small helper to escape HTML to avoid XSS if user types markup
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
