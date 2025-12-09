// DOM ELEMENTS
const appBox = document.querySelector(".app")
const quoteElement = document.getElementById("js-quote-text");
const startBtn = document.getElementById("js-start-btn");
const trumpBtn = document.getElementById("js-trump-btn");
const dwightBtn = document.getElementById("js-dwight-btn");
const livesContainer = document.getElementById("lives");



const endpoint ="https://api.whatdoestrumpthink.com/api/v1/quotes/random";
// returns JSON structured like this:
// {
//   "message": "Your Quote",
//   "nlp_attributes": {
//     "quote_structure": "Natural Language Processing Stats"
//   }
// }


// States
let lives = 3;
const hearts = document.querySelectorAll(".heart");

let currentQuote = {
    text: "",
    source: ""
};

function displayLives() {
    hearts.forEach((heart, index) => {
        if(index < lives){
            heart.src = "img/pixelHeart.png"; 
            heart.alt = "life " + (index + 1);
        } else {
            heart.src = "img/EmptyPixelHeart.png";
            heart.alt = "lost life " + (index + 1);
        }
    });
}


async function getTrumpOrDwight() {
    try{
        if (Math.random() < 0.5) {
            // reponse is an HTTP Response object, not the data yet.
            // It contains metadata like status code, headers, etc
            const responseTrump = await fetch(endpoint);

            // turn HTTP response object into parsed json text
            const trumpJson = await responseTrump.json();

            currentQuote = {text: trumpJson.message, source: "trump"};

        } else{
            // get local randome dwithg quote
            const responseDwight = await fetch("dwight.json");
            const dwightJson = await responseDwight.json(); // parse JSON
            const quotes = dwightJson.quotes;   // access the json array
            const quotesRandom = quotes[Math.floor(Math.random() * quotes.length)]; // pick a random quote
            currentQuote = { text: quotesRandom, source: "dwight" };
        }

    } catch (err) {
        console.log(err);
        alert('failed to get new trivia');
    }

    // putting the curretn quote into html quote element
    quoteElement.innerText = currentQuote.text;
}



function guess(choice) {
    if (choice === currentQuote.source) {
        // alert("Correct ");
        getTrumpOrDwight();
    } else {
        lives--;
        displayLives();
        alert("Wrong");
        // add pop up animation that shows trump eating a heart 

        if (lives <= 0) {
            alert("Gameover! Refresh to play again.");
            trumpBtn.classList.add("disabled");
            dwightBtn.classList.add("disabled");
            return; 
            //show trump building a wall becauaes trump won
        }
        // load next quote after a short delay so popup is visible
        //setTimeout(getTrumpOrDwight, 1500);
        getTrumpOrDwight();
    }
    // showFunnyPic(choice);
    
}

// const images = [
//   "trump1.jpg",
//   "trump2.jpg",
//   "trump3.jpg"
// ];


// // update funtion to shoe a trump happy face if it was correct or a trummp sad face if it was wrong
// function showFunnyPic(choice) {
//   let img = images[Math.floor(Math.random() * images.length)];
//   document.getElementById("funny-pic").src = img;
//   document.getElementById("funny-pic").style.display = "block";
// }


startBtn.addEventListener('click', async () => {
    // Load first quote
    await getTrumpOrDwight(); 

    // Hide start button, show choice buttons
    startBtn.classList.add("hidden");
    trumpBtn.classList.remove("hidden");
    dwightBtn.classList.remove("hidden");
    livesContainer.classList.remove("hidden");

    displayLives(); 

    appBox.classList.add("active");
});

trumpBtn.addEventListener('click', () => guess("trump"));
dwightBtn.addEventListener('click', () => guess("dwight"));



