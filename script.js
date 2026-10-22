
 // 1. Connect to Supabase
const PROJECT_URL = "https://wzjlytqilsjcboqpwldz.supabase.co/";
const PUBLISHABLE_KEY = "sb_publishable_Nyt-q7qFiYGd7aV25sgGuQ_yk-1gHxN";

const client = window.supabase.createClient(
    PROJECT_URL,
    PUBLISHABLE_KEY
);

// Store selected appointment and staff filter
let selectedAppointment = null;
let availableAppointments = [];
let currentStaffFilter = "all";

// Display names for database staff identifiers
function getStaffName(assignedStaff) {
    const staff = (assignedStaff || "").toLowerCase();

    if (staff === "emma") return "Emma";
    if (staff === "sarah") return "Sarah";

    return "Staff assignment unavailable";
}

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

// Load appointments from Supabase
async function loadAppointments() {
    const { data, error } = await client
        .from("appointments")
        .select("*")
        .eq("booked", false)
        .order("date")
        .order("time");

    if (error) {
        console.error("Unable to load appointments:", error);
        alert("Unable to load appointment times. Please refresh the page.");
        return;
    }

    const now = new Date();

    // Remove appointments that have already passed
    availableAppointments = data.filter(slot => {
        if (!slot.date || !slot.time) {
            return false;
        }

        const startTime = slot.time.split(" - ")[0];
        const [year, month, day] = slot.date.split("-");

        const timeParts = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

        if (!timeParts) {
            console.error("Invalid appointment time:", slot.time);
            return false;
        }

        let hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        const meridiem = timeParts[3].toUpperCase();

        if (meridiem === "PM" && hours !== 12) {
            hours += 12;
        }

        if (meridiem === "AM" && hours === 12) {
            hours = 0;
        }

        const appointmentDateTime = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            hours,
            minutes
        );

        return appointmentDateTime > now;
    });

    renderAppointments();
}

// Render appointments using the selected staff filter
function renderAppointments() {
    const container = document.getElementById("dates");
    container.innerHTML = "";

    // Filter by the assigned tech, not by the person booking
    const filteredAppointments = availableAppointments.filter(slot => {
        const staff = (slot.assigned_staff || "").toLowerCase();

        if (currentStaffFilter === "all") {
            return true;
        }

        return staff === currentStaffFilter;
    });

    if (filteredAppointments.length === 0) {
        const message = document.createElement("p");
        message.textContent =
            currentStaffFilter === "all"
                ? "There are currently no available appointments."
                : `There are currently no available appointments for ${getStaffName(currentStaffFilter)}.`;

        container.appendChild(message);
        return;
    }

    // Group appointments by month and date
    const groupedMonths = {};

    filteredAppointments.forEach(slot => {
        const dateObject = new Date(slot.date + "T00:00:00");

        const monthKey = dateObject.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

        if (!groupedMonths[monthKey]) {
            groupedMonths[monthKey] = {};
        }

        if (!groupedMonths[monthKey][slot.date]) {
            groupedMonths[monthKey][slot.date] = [];
        }

        groupedMonths[monthKey][slot.date].push(slot);
    });

    // Create each month
    Object.keys(groupedMonths).forEach(month => {
        const monthSection = document.createElement("div");
        monthSection.className = "month-section";

        const monthHeading = document.createElement("h2");
        monthHeading.className = "month-heading";
        monthHeading.textContent = month;
        monthSection.appendChild(monthHeading);

        const monthGrid = document.createElement("div");
        monthGrid.className = "month-grid";

        // Create each date
        Object.keys(groupedMonths[month]).forEach(date => {
            const daySection = document.createElement("div");
            daySection.className = "day-section";

            const dateObject = new Date(date + "T00:00:00");

            const heading = document.createElement("h3");
            heading.className = "day-heading";

            heading.classList.add(
                dateObject.toLocaleDateString("en-US", {
                    month: "long"
                }).toLowerCase()
            );

            heading.textContent = dateObject.toLocaleDateString("en-US", {
                weekday: "short",
                month: "long",
                day: "numeric"
            });

            daySection.appendChild(heading);

            // Add appointment times
            groupedMonths[month][date].forEach(slot => {
                const option = document.createElement("label");
                option.className = "appointment-option";

                const radio = document.createElement("input");
                radio.type = "radio";
                radio.name = "appointment";
                radio.value = slot.id;

                const details = document.createElement("div");
                details.className = "appointment-option-details";

                const timeText = document.createElement("span");
                timeText.className = "appointment-time";
                timeText.textContent = slot.time;

                const staffText = document.createElement("span");
                const assignedStaff = (slot.assigned_staff || "").toLowerCase();

                staffText.className = "appointment-staff";

                if (assignedStaff === "emma" || assignedStaff === "sarah") {
                    staffText.textContent = "Tech: " + getStaffName(assignedStaff);
                    staffText.classList.add("staff-" + assignedStaff);
                } else {
                    staffText.textContent = getStaffName(assignedStaff);
                    staffText.classList.add("staff-unassigned");
                }

                details.appendChild(timeText);
                details.appendChild(staffText);

                radio.addEventListener("change", () => {
                    if (radio.checked) {
                        selectedAppointment = slot.id;
                        checkFormCompletion();
                    }
                });

                option.appendChild(radio);
                option.appendChild(details);

                daySection.appendChild(option);
            });

            monthGrid.appendChild(daySection);
        });

        monthSection.appendChild(monthGrid);
        container.appendChild(monthSection);
    });
}

// Connect the All Staff / Emma / Sarah filter buttons
document.querySelectorAll('input[name="staffFilter"]').forEach(radio => {
    radio.addEventListener("change", () => {
        if (!radio.checked) return;

        currentStaffFilter = radio.value;

        // Clear a previous selection when changing staff filters
        selectedAppointment = null;

        renderAppointments();
        checkFormCompletion();
    });
});

// Submit appointment
async function submitAppointment() {
    if (selectedAppointment === null) {
        alert("Please select an appointment.");
        return;
    }

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const whatTech = document.getElementById("whatTech").value.trim();

    const staffInitials = document
        .getElementById("staffInitials")
        .value
        .trim()
        .toUpperCase();

    // Get reason for appointment
    const learn = document.getElementById("learn").checked;
    const need = document.getElementById("need").checked;
    const newDevice = document.getElementById("new").checked;
    const help = document.getElementById("help").checked;
    const other = document.getElementById("other").checked;
    const describeProblem = document
        .getElementById("describeProblem")
        .value
        .trim();

    if (!name || !email || !phone) {
        alert("Please fill out your name and phone number. Please write NULL for email if you do not have one.");
        return;
    }

    // Get the selected slot, including its actual staff assignment
    const { data: appointmentData, error: appointmentFetchError } = await client
        .from("appointments")
        .select("date, time, assigned_staff, booked, cancelled")
        .eq("id", selectedAppointment)
        .single();

    if (appointmentFetchError || !appointmentData) {
        console.error("APPOINTMENT FETCH ERROR:", appointmentFetchError);
        alert("Unable to find the selected appointment. Please refresh and try again.");
        return;
    }

    if (
    appointmentData.booked ||
    !appointmentData.assigned_staff
) {
        alert("This appointment is no longer available or has no staff assignment. Please refresh and choose another time.");
        await loadAppointments();
        return;
    }

    const assignedStaff = appointmentData.assigned_staff.toLowerCase();

    if (assignedStaff !== "emma" && assignedStaff !== "sarah") {
        alert("This appointment has an invalid staff assignment. Please contact the library.");
        return;
    }

   // Save booking to the selected slot
const { data: updatedAppointments, error } = await client
    .from("appointments")
    .update({
        booked: true,
        cancelled: false,
        appointment_confirmed: false,
        staff_initials: staffInitials || null
    })
    .eq("id", selectedAppointment)
    .eq("booked", false)
    .select("id");
 
    if (error) {
        console.error("BOOKING ERROR:", error);
        alert("Unable to book this appointment. Please refresh and try again.");
        return;
    }

    if (!updatedAppointments || updatedAppointments.length === 0) {
        alert("This appointment may have just been booked by someone else. Please refresh and choose another time.");
        await loadAppointments();
        return;
    }

    // Save user information
    const { error: userError } = await client
        .from("user_info")
        .insert([{
            appointment_id: selectedAppointment,
            name: name,
            phone_number: phone,
            email: email,
            what_tech: whatTech
        }]);

    if (userError) {
        console.error("USER INFO ERROR:", userError);
        alert("The appointment was reserved, but saving your information failed. Please contact the library.");
        return;
    }

    // Save reason for appointment
    const { error: reasonError } = await client
        .from("why_appointment")
        .insert([{
            appointment_id: selectedAppointment,
            learn: learn,
            need: need,
            new: newDevice,
            help: help,
            other: other,
            describe_problem: describeProblem
        }]);

    if (reasonError) {
        console.error("REASON ERROR:", reasonError);
        alert("The appointment was reserved, but saving the reason failed. Please contact the library.");
        return;
    }

    // Send email notification, including the assigned tech
    const { data: emailData, error: emailError } = await client.functions.invoke(
        "clever-endpoint",
        {
            body: {
                date: appointmentData.date,
                time: appointmentData.time,
                assigned_staff: getStaffName(assignedStaff),
                name: name,
                email: email,
                phone: phone,
                what_tech: whatTech,
                reason: describeProblem
            }
        }
    );

    if (emailError) {
        console.error("EMAIL ERROR:", emailError);
        alert("Your appointment was saved, but the email notification could not be sent. Please contact the library.");
        return;
    }

    console.log("Appointment email sent successfully:", emailData);

    window.location.href = "submitted.html";
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

    if (name && email && phone && selectedAppointment !== null && agreement.checked) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

document.addEventListener("input", checkFormCompletion);
agreement.addEventListener("change", checkFormCompletion);

// Start page
loadAppointments();

// Staff login
document.getElementById("adminLogin").addEventListener("click", () => {
    window.location.href = "admin-login.html";
});
