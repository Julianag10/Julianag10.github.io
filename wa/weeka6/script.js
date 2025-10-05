
//-----------------------FORM SUBMIT -----------------------

//Wait until HTML is full yloaded before runnning 
document.addEventListener("DOMContentLoaded", ()=>{
    const form = document.getElementById("volunteerForm");
    const messages = document.getElementById("formMessages");
    
    //Listens for when from is submitted
    // function(event) -> annoynous function, a function without a name
    // function -> runs when event happens
    // event -> is the event object, describing wha tjust happend ( int this case form submitted)
    form.addEventListener("submit", function(event) {
        event.preventDefault();

        //creates an empty array to hold erro messages
        //later check if array is empty or not to decide success vs failure
        let errors =[];

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const program = document.getElementById("program").value;

        if (name === "") {
            //appedns message to errors array
            errors.push("Name is required.");
        }

        if (email === "" || !/\S+@\S+\.\S+/.test(email)) {
            errors.push("A valid email is required.");
        }

        if (program === "") {
            errors.push("Please select a program.");
        }

        if (errors.length > 0) {
            // if there are errors in array, show errors
            messages.innerHTML = errors.map(err => `<p class="error">${err}</p>`).join("");

        } else {
            messages.innerHTML = `<p class="success">Thank you for signing up, ${name}! We’ll be in touch soon.</p>`;
            form.reset();
        }
      
    });
});


//-----------------------HAMBURGER -----------------------

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

// Listens for when When hamburger is clicked
navToggle.addEventListener('click', () => {
    // when click on hamburger toggle .show class
    navMenu.classList.toggle('show');
    // visual feedbakc to hamburger
    navToggle.classList.toggle('active');    

    // aria-expanded="true/false" tells screen readers whether the menu is open.
    // Update aria-expanded
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', !expanded);

    

    // If opening the menu, focus the first link
    if(!expanded){
        //finds the first linkn inside the nav menu
        const firstLink = navMenu.querySelector('a');
        //.focus() moves keyboard cursos to onto that link
        firstLink.focus();
    }
    
});

// makes sure keyboar users can also open/close the menu
// e is the event object
navToggle.addEventListener('keydown', (e) =>{
    if(e.key === 'Enter' || e.key ===' '){
        e.preventDefault(); // stop page from scrolling on space
        navToggle.click(); // reudse click handler
    }
});

// close menu when clicking outisde
document.addEventListener('click', (e) => {
    // e.target is the thing you actually clicked on
    // navMenu.contains(e.target) is true if you clicked inside teh menu
    if(!navMenu.contains(e.target) && !navToggle.contains(e.target)){
        navMenu.classList.remove('show');
        //tells screen readers that the menu is closed 
        navToggle.setAttribute('aria-expanded', false);

        //removes the active cladd from hamburger, so the button looks normal again
        navToggle.classList.remove('active');
    }

});

