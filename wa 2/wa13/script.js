const API_KEY = "F6o9puLR32_YRDUy73B922Off3NkEwxFqxYP-Xoiw7I-n2H-";

let allArticles = [];
let mode = localStorage.getItem("mode") || "algorithmic";
let topic = localStorage.getItem("topic") || "all";
let visibleCount = 8;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("topic-filter").value = topic;
    document.getElementById("topic-filter").addEventListener("change", onTopicChange);

    document.getElementById("mode-algorithmic").addEventListener("click", () => setMode("algorithmic"));
    document.getElementById("mode-balanced").addEventListener("click", () => setMode("balanced"));

    updateModeButtons();
    fetchNews();
});

/* Fetch News */
async function fetchNews() {
    const container = document.getElementById("js-news-feed");
    container.innerHTML = "<p class='loading-text'>Loading news...</p>";
    container.classList.add("bubble-effect");
    setTimeout(() => container.classList.remove("bubble-effect"), 600);

    const effectiveTopic = mode === "algorithmic" ? topic : "all";

    const url = effectiveTopic === "all"
        ? `https://api.currentsapi.services/v1/latest-news?language=en&apiKey=${API_KEY}`
        : `https://api.currentsapi.services/v1/latest-news?category=${effectiveTopic}&language=en&apiKey=${API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        allArticles = data.news;

        if (mode === "balanced") allArticles = shuffle([...allArticles]);
        renderArticles(allArticles);
        updateBiasMeter(effectiveTopic);
        updateCritiqueBanner();

    } catch {
        container.innerHTML = "<p class='error-text'>Failed to load news.</p>";
    }
}

/* Render Articles */
function renderArticles(list, showAll = false) {
    const container = document.getElementById("js-news-feed");
    const hiddenCtrl = document.getElementById("hidden-controls");

    container.innerHTML = "";
    hiddenCtrl.innerHTML = "";

    list.forEach((article, i) => {
        const isVisible = mode === "balanced" || showAll || i < visibleCount;
        if (!isVisible) return;

        const div = document.createElement("article");
        div.classList.add("article");

        if (showAll && i >= visibleCount && mode === "algorithmic")
            div.classList.add("hidden-article");

        div.innerHTML = `
            ${getImageHTML(article)}
            <h3>${article.title}</h3>
            <p class="meta">${article.author || "Unknown source"}</p>
            <p>${article.description || ""}</p>

            <p class="system-note">
                <strong>System note:</strong> ${getSystemNote(article, i, showAll)}
            </p>

            <a href="${article.url}" target="_blank">Read more</a>
        `;

        container.appendChild(div);
    });

    if (mode === "algorithmic" && !showAll && list.length > visibleCount) {
        hiddenCtrl.innerHTML = `
            <p class="hidden-explainer">
                These stories were hidden by algorithmic ranking.
            </p>
            <button id="show-hidden" class="reveal-btn">
                Reveal Hidden Articles (${list.length - visibleCount})
            </button>
        `;
        document.getElementById("show-hidden").onclick = () =>
            renderArticles(allArticles, true);
    }
}

/* Helpers */
function getImageHTML(article) {
    return article.image?.startsWith("http")
        ? `<img src="${article.image}" class="article-image" alt="Image for ${article.title}">`
        : `<div class="no-image">No Image</div>`;
}

function getSystemNote(article, index, showAll) {
    if (mode === "balanced") return "Displayed to promote a more diverse, less optimized feed.";

    if (!showAll && index < visibleCount) return "Prioritized by the algorithm based on predicted engagement.";
    return "Hidden initially due to low predicted engagement.";
}

function onTopicChange(e) {
    topic = e.target.value;
    localStorage.setItem("topic", topic);
    fetchNews();
}

function setMode(m) {
    mode = m;
    localStorage.setItem("mode", m);
    updateModeButtons();
    fetchNews();
}

function updateModeButtons() {
    document.getElementById("mode-algorithmic").classList.toggle("active", mode === "algorithmic");
    document.getElementById("mode-balanced").classList.toggle("active", mode === "balanced");

    document.getElementById("topic-filter").disabled = mode === "balanced";
}

function updateBiasMeter(topic) {
    const meter = document.getElementById("bias-meter");
    if (mode === "balanced") {
        meter.textContent = "Bias Meter: Reduced — showing diversified mix.";
        return;
    }

    const messages = {
        politics: "High — political filters amplify echo chambers.",
        entertainment: "Medium — entertainment often overshadows civic issues.",
        sports: "Low–Medium — still narrows focus.",
        business: "Medium — corporate-heavy coverage.",
        health: "Medium — emphasizes individual issues over systemic ones.",
        science: "Lower — fewer partisan effects.",
        all: "Mixed — algorithm still optimizes for engagement."
    };

    meter.textContent = "Bias Meter: " + (messages[topic] || "Neutral");
}

function updateCritiqueBanner() {
    const banner = document.getElementById("critique-banner");

    if (mode === "balanced") {
        banner.textContent =
            "Balanced Mode: an alternative vision that avoids algorithmic ranking and supports viewpoint diversity.";
        return;
    }

    banner.textContent =
        "Algorithmic Mode: illustrates how curation hides stories and narrows perspective.";
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
