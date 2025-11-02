// fetch API, render articles, manage personalization logic

// 40da5e621c7a4d2cb2dca811789d68f7

const endpoint = "https://newsapi.org/v2/top-headlines?country=us&apiKey=40da5e621c7a4d2cb2dca811789d68f7";
// example JSON response, array of articls
// {
// "status": "ok",
// "totalResults": 35,
// -"articles": [
// -{
// -"source": {
// "id": null,
// "name": "CBS Sports"
// },
// "author": "Bryan DeArdo",
// "title": "Steelers vs. Colts live updates: Score, highlights and analysis - CBS Sports",
// "description": "Live coverage, highlights and score updates from Sunday's Week 9 matchup",
// "url": "https://www.cbssports.com/nfl/news/steelers-colts-live-updates-score-analysis-highlights/live/",
// "urlToImage": "https://sportshub.cbsistatic.com/i/r/2025/11/02/082e8352-fec5-49b2-acbd-7d0e53a0dec8/thumbnail/1200x675/14b602fd758e1222288a07bd2d78a925/daniel-jones.jpg",
// "publishedAt": "2025-11-02T20:46:21Z",
// "content": "Two forced turnovers helped the Steelers take a 17-7 halftime lead over the visiting Colts in a Week 9 matchup between two first-place teams. \r\nIndianapolis led 7-0 and was in Pittsburgh territory be… [+978 chars]"
// },
// -{
// ....
// ...
// }

let allArticles = [];

// handles the API call
async function fetchNews(){
    // send a request to that URL. The request returns data in JSON
    try{
        const res = await fetch(endpoint);

        if(!res.ok){
            throw Error(res.status);
        }

        const data = await res.json();
        // renderNews(data.articles);
        allArticles = data.articles;
        applyFilter();

    } catch(err){
        console.log("there was an error :( ", err)
        alert(err);
    }
}

function applyFilter(){
    //ries to retrieve the user’s previously saved filter choice
    const selected = localStorage.getItem("topicPref") || "all";
    document.getElementById("topic-filter").value = selected;

    // If the user chose “All Topics”, we skip filtering and just use allArticles
    const filtered = selected === "all" ? allArticles : allArticles.filter( a => 
        // Otherwise, we call .filter() on the allArticles array to return only those that match the selected topic.
        //.filter() creates a new array containing only the articles that meet your condition (below)
        a.title.toLowerCase().includes(selected) ||
        a.description?.toLowerCase().includes(selected)

    );
    
    renderNews(filtered);
}

// handles looping through that array and inserting the titles into HTML.
function renderNews(articles) {
  const container = document.getElementById("js-news-feed");
  container.innerHTML = ""; // clear old content

  articles.forEach(article => {
    const div = document.createElement("div");
    div.classList.add("article");

    div.innerHTML = `
        ${article.urlToImage && article.urlToImage.startsWith("http")
            ? `<img src="${article.urlToImage}" alt="Article image" class="article-image">`
            : `<div class="no-image">No image available</div>`}
        <h3>${article.title}</h3>
        <p>${article.description || "No description available."}</p>
        <a href="${article.url}" target="_blank">Read more</a>
    `;

    container.appendChild(div);
  });
}

// save user preference + re-filter
document.getElementById("topic-filter").addEventListener("change", e => {
  localStorage.setItem("topicPref", e.target.value);
  applyFilter();
});

window.addEventListener("DOMContentLoaded", fetchNews);