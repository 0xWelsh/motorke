const fs = require('fs');
let file = fs.readFileSync('src/components/CarForm.js', 'utf8');

// I also need to make sure dutyPaid state is tracked. 
// Oh wait, dutyPaid state isn't tracked in React state, it's just a default checkmark in the formData?!
// data.dutyPaid = data.dutyPaid === "on";

// If I don't want to add state for everything, I'll just change the text to be clear.
