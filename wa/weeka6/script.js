
//-----------------------FORM SUBMIT -----------------------

//Wait until HTML is full yloaded before runnning 
document.addEventListener("DOMContentLoaded", ()=>{
    const form = document.getElementById("volunteerForm");
    const messages = document.getElementById("formMessages");

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