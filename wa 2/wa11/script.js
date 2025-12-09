// fetch API, render articles, manage personalization logic

const API_KEY = "F6o9puLR32_YRDUy73B922Off3NkEwxFqxYP-Xoiw7I-n2H-";
let allArticles = [];

// Fetch and display news
async function fetchNews() {
  const container = document.getElementById("js-news-feed");
  container.innerHTML = "<p class='loading-text'>Loading news...</p>";

  const selected = localStorage.getItem("topicPref") || "all";

  // Currents API supports category filtering directly in the URL
  const url = selected === "all"
    ? `https://api.currentsapi.services/v1/latest-news?language=en&apiKey=${API_KEY}`
    : `https://api.currentsapi.services/v1/latest-news?category=${selected}&language=en&apiKey=${API_KEY}`;

  // Timeout in case the API is slow
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("The request took too long to respond.")), 8000)
  );

  try {
    const res = await Promise.race([fetch(url), timeout]);
    if (!res.ok) throw new Error(`API returned status ${res.status}`);

    const data = await res.json();
    allArticles = data.news;

    if (!allArticles || allArticles.length === 0) {
      container.innerHTML = "<p class='error-text'>No news articles found. Try again later.</p>";
      return;
    }

    renderNews(allArticles);

  } catch (err) {
    console.error("There was an error fetching news:", err);
    container.innerHTML = `
      <div class="error-text">
        <p>⚠️ Sorry, we couldn’t load the latest news right now.</p>
        <p><em>${err.message}</em></p>
        <button id="retry">Try Again</button>
      </div>
    `;
    document.getElementById("retry").addEventListener("click", fetchNews);
  }
}

// Render articles
function renderNews(articles) {
  const container = document.getElementById("js-news-feed");
  container.innerHTML = ""; // Clear old content

  articles.forEach(article => {
    const div = document.createElement("div");
    div.classList.add("article");

    div.innerHTML = `
      ${article.image && article.image.startsWith("http")
        ? `<img src="${article.image}" alt="Article image" class="article-image">`
        : `<div class="no-image">No image available</div>`}

      <h3>${article.title}</h3>
      <p><em>${article.author || "Unknown source"}</em></p>
      <p>${article.description || "No description available."}</p>
      <a href="${article.url}" target="_blank">Read more</a>
      <hr>
    `;

    container.appendChild(div);
  });
}

// Save topic preference + reload feed
document.getElementById("topic-filter").addEventListener("change", e => {
  localStorage.setItem("topicPref", e.target.value);
  fetchNews();
});

window.addEventListener("DOMContentLoaded", fetchNews);
