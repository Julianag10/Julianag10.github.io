// 1. Select the new quote button using a querySelector. Assign it to a new variable.
// 2. Write an event listener to check if the button is clicked. When the button is clicked, run a function called "getQuote".
let newTriviaBtn = document.querySelector("#js-new-quote").addEventListener('click', getQuote);

let answerBtn = document.querySelector("#js-tweet").addEventListener('click', newAnswer);

let current = {
    question: "",
    answer:""
}
// 4. Add a new variable that holds the API endpoint: https://trivia.cyberwisp.com/getrandomchristmasquestion
const endpoint = "https://trivia.cyberwisp.com/getrandomchristmasquestion";

// 3. Write the function declaration, and check the button click works by returning a message in the console everytime the button is clicked.
async function getQuote(){
    console.log("new quote button clicked");
    
    try {
        // 5. use the fetch method to get a random quote from that endpoint.
        const response = await fetch(endpoint);

        // 5b.If it fails, output an error message to the console AND via alert
        if (!response.ok){
            throw Error(response.statusText);
        }
        // 5a. If successful, output the quote to the console
        const quoteJson = await response.json();
        // console.log(quoteJson);

        //displayTrivia(quoteJson); // displays the list of json:[object Object]
        displayQuote(quoteJson["question"]);

        // update function so that it puts 
        current.question = quoteJson["question"];
        current.answer = quoteJson["answer"];
        console.log(current.question);
        console.log(current.answer);

        

    } catch (err) {
        console.log(err);
        alert('failed to get new trivia');
    }
}

// 6. Write a second function called "displayQuote" that will display the text of a fetched quote in the HTML element with an id of js-quote-text.
function displayQuote(quote){
    const quoteText = document.querySelector("#js-quote-text");
    const answerText = document.querySelector("#js-answer-text");
    quoteText.textContent = quote;

    // current.answer = "" unitl newTriviaBtn is clicked
    // -> so it shows old answer wiht every new quote
    // reset the question every time newTriviaBtn
    answerText.textContent = "";
}


function newAnswer(){
    // how to maintain 1piece of json from endpoint (use it for both quetion and answer functions)
    const answerText = document.querySelector("#js-answer-text");
    answerText.textContent = current.answer;
    // current.answer = "" unitl newTriviaBtn is clicked
    // -> so it shows old answer wiht every new quote

}

getQuote();
