async function loadContent() {
  const response = await fetch('/api/content');
  const content = await response.json();

  const container = document.getElementById('catalog');
  container.innerHTML = content
    .map(
      (item) => `
      <article class="card">
        <img src="${item.image}" alt="${item.title}" />
        <div class="card-content">
          <h3>${item.title}</h3>
          <p>${item.genre} • ${item.year} • ${item.rating}</p>
        </div>
      </article>
    `
    )
    .join('');
}

loadContent().catch((err) => {
  console.error('Failed to load catalog', err);
});
