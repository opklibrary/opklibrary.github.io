// 1. Connect to Supabase
const PROJECT_URL = "https://wzjlytqilsjcboqpwldz.supabase.co/";
const PUBLISHABLE_KEY = "sb_publishable_Nyt-q7qFiYGd7aV25sgGuQ_yk-1gHxN";

const client = window.supabase.createClient(
    PROJECT_URL,
    PUBLISHABLE_KEY
);


// Store selected appointment
let selectedAppointment = null;


// Format dates for display
function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}


// Load appointments
async function loadAppointments() {

    const { data, error } = await client
        .from("appointments")
        .select("*")
        .order("date")
        .order("time");

    if (error) {
        console.error(error);
        return;
    }

    const container = document.getElementById("dates");
    container.innerHTML = "";

    // Group appointments by date
    const groupedDates = {};

    data.forEach(slot => {

        if (!groupedDates[slot.date]) {
            groupedDates[slot.date] = [];
        }

        groupedDates[slot.date].push(slot);

    });


    // Create each day's section
    Object.keys(groupedDates).forEach(date => {

        const daySection = document.createElement("div");
        daySection.className = "day-section";

        const heading = document.createElement("h3");
        heading.textContent = formatDate(date);

        daySection.appendChild(heading);


        groupedDates[date].forEach(slot => {

            const option = document.createElement("label");
            option.className = "appointment-option";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "appointment";
            radio.value = slot.id;

            const labelText = document.createElement("span");
            labelText.textContent = slot.time;

            if (slot.booked) {

                radio.disabled = true;
                labelText.textContent += " (Booked)";

            } else {

                radio.addEventListener("change", () => {

                    if (radio.checked) {
                        selectedAppointment = slot.id;
                        console.log("Selected:", selectedAppointment);
                        checkFormCompletion();
                    }

                });

            }

            option.appendChild(radio);
            option.appendChild(labelText);

            daySection.appendChild(option);

        });

        container.appendChild(daySection);

    });

}


// Submit appointment
async function submitAppointment() {

    if (selectedAppointment === null) {
        alert("Please select an appointment.");
        return;
    }

    // Get user information
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const whatTech = document.getElementById("whatTech").value.trim();

    // Check required fields
    if (!name || !email || !phone) {
        alert("Please fill out your name, email, and phone number.");
        return;
    }

    const { error } = await client
        .from("appointments")
        .update({ booked: true })
        .eq("id", selectedAppointment);

    if (error) {
        console.error(error);
        return;
    }

    // Save user information
    const { error: userError } = await client
        .from("user_info")
        .insert([
            {
                appointment_id: selectedAppointment,
                name: name,
                phone_number: phone,
                email: email,
                what_tech: whatTech
            }
        ]);
    
    if (userError) {
        console.error(userError);
        alert("Unable to save user information.");
        return;
    }

    alert("Appointment submitted!");

    selectedAppointment = null;

    loadAppointments();

}


// Button connection
document
    .getElementById("submitAppointment")
    .onclick = submitAppointment;

// Enable submit button only when form is complete
const submitButton = document.getElementById("submitAppointment");
const agreement = document.getElementById("agreement");

function checkFormCompletion() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (name && email && phone && selectedAppointment && agreement.checked) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

document.addEventListener("input", checkFormCompletion);
agreement.addEventListener("change", checkFormCompletion);



// Start page
loadAppointments();
