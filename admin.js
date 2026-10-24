// =========================
// SUPABASE CONNECTION
// =========================

const PROJECT_URL = "https://wzjlytqilsjcboqpwldz.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_Nyt-q7qFiYGd7aV25sgGuQ_yk-1gHxN";

const client = window.supabase.createClient(
    PROJECT_URL,
    PUBLISHABLE_KEY
);

// =========================
// LOAD ALL APPOINTMENTS
// =========================

let allAppointments = [];
let currentView = "upcoming";

// Remove punctuation and make text lowercase
function normalize(text) {
    return (text || "")
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

// =========================
// CHECK IF STAFF IS LOGGED IN
// =========================

async function checkLogin() {

    const {
        data: { session }
    } = await client.auth.getSession();

    if (!session) {
        window.location.href = "admin-login.html";
        return;
    }

    console.log("Logged in as:", session.user.email);
}

checkLogin();

// =========================
// LOAD BOOKED APPOINTMENTS
// =========================

async function loadAppointments() {

    const { data, error } = await client
        .from("appointments")
        .select(`
            id,
            date,
            time,
            booked,
            cancelled,
            appointment_confirmed,
            staff_initials,
            assigned_staff,
            user_info (
                name,
                phone_number,
                email,
                what_tech,
                submitted_at
            ),
            why_appointment (
                learn,
                need,
                new,
                help,
                other,
                describe_problem
            )
        `)
        .order("date")
        .order("time");

    if (error) {
        console.error("Error loading appointments:", error);
        return;
    }

    allAppointments = data;

    displayAppointments(allAppointments);
}

// =========================
// DISPLAY APPOINTMENTS
// =========================

function displayAppointments(data) {

    const container = document.getElementById("appointmentList");

    container.innerHTML = "";

    const now = new Date();

    // =========================
    // SEPARATE APPOINTMENTS
    // =========================

    const upcomingAppointments = [];
    const pastAppointments = [];
    const canceledAppointments = [];

    data.forEach((appointment) => {

        console.log("FULL APPOINTMENT:", appointment);

        // =========================
    // HIDE AVAILABLE APPOINTMENTS
    // ========================
    if (
        appointment.booked !== true &&
        appointment.cancelled !== true
    ) {
        return;
    }
        
        console.log("USER INFO:", appointment.user_info);
        console.log("WHY APPOINTMENT:", appointment.why_appointment);

   const startTime = appointment.time.split(" - ")[0];

const [year, month, day] = appointment.date.split("-");

const timeParts = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

if (!timeParts) {
    console.error("Invalid appointment time:", appointment.time);
    return;
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

        console.log(
    "DATE CHECK:",
    appointment.date,
    appointment.time,
    "=>",
    appointmentDateTime,
    "NOW:",
    now
);

        // Canceled appointments ONLY go here
        if (appointment.cancelled === true) {

            canceledAppointments.push(appointment);

        } else if (appointmentDateTime > now) {

            upcomingAppointments.push(appointment);

        } else {

            pastAppointments.push(appointment);

        }

    });

    // =========================
    // CHOOSE CURRENT VIEW
    // =========================

    let appointmentsToDisplay = [];

    if (currentView === "upcoming") {

        appointmentsToDisplay = upcomingAppointments;

    } else if (currentView === "past") {

        appointmentsToDisplay = pastAppointments;

    } else if (currentView === "canceled") {

        appointmentsToDisplay = canceledAppointments;

    }

    console.log("CURRENT VIEW:", currentView);
    console.log("DISPLAYING:", appointmentsToDisplay);

 // =========================
// SORT APPOINTMENTS
// =========================

appointmentsToDisplay.sort((a, b) => {

    function getAppointmentDateTime(appointment) {

        const startTime = appointment.time.split(" - ")[0];

        const [year, month, day] = appointment.date.split("-");

        const timeParts = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

        if (!timeParts) {
            console.error("Invalid appointment time:", appointment.time);
            return new Date(0);
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

        return new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            hours,
            minutes
        );
    }

    const dateA = getAppointmentDateTime(a);
    const dateB = getAppointmentDateTime(b);

    return dateA - dateB;

});
    
    let currentMonth = "";

    appointmentsToDisplay.forEach((appointment) => {

  const user = [...(appointment.user_info || [])]
    .sort((a, b) =>
        new Date(b.submitted_at || 0) -
        new Date(a.submitted_at || 0)
    )[0];

const reason = appointment.why_appointment?.[0];

        // =========================
        // SUBMITTED TIME
        // =========================

        let submittedText = "Unknown";

        if (user?.submitted_at) {

            const submittedDate = new Date(user.submitted_at);

            submittedText = submittedDate.toLocaleString("en-US", {

                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit"

            });

        }

        // =========================
        // APPOINTMENT DATE
        // =========================

        const appointmentDate = new Date(
            appointment.date + "T00:00:00"
        );

        const monthName = appointmentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

        // =========================
        // MONTH HEADING
        // =========================

        if (monthName !== currentMonth) {

            const monthHeading = document.createElement("h2");

            monthHeading.className = "month-heading";

            monthHeading.textContent = monthName;

            container.appendChild(monthHeading);

            currentMonth = monthName;
        }

        // =========================
        // FORMATTED DATE
        // =========================

        const formattedDate = appointmentDate.toLocaleDateString("en-US", {

            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"

        });

        // =========================
        // APPOINTMENT CARD
        // =========================

      const card = document.createElement("div");

card.className = "appointment-card";

// Identify the tech assigned to this appointment
const assignedStaff = (appointment.assigned_staff || "")
    .toLowerCase()
    .trim();

let staffName = "Unassigned";
let staffClass = "staff-unassigned";

if (assignedStaff === "emma") {
    staffName = "Emma";
    staffClass = "staff-emma";
} else if (assignedStaff === "sarah") {
    staffName = "Sarah";
    staffClass = "staff-sarah";
}

card.classList.add(staffClass);

        if (currentView === "past") {
            card.classList.add("past-appointment");
        }

        if (currentView === "canceled") {
            card.classList.add("canceled-appointment");
        }

        card.innerHTML = `
        
        <div class="assigned-staff-label">${staffName}</div>
        
            <h2>${formattedDate}</h2>

            <h3>${appointment.time}</h3>

            <p><strong>Name:</strong> ${user?.name || "N/A"}</p>

            <p><strong>Phone:</strong> ${user?.phone_number || "N/A"}</p>

            <p><strong>Email:</strong> ${user?.email || "N/A"}</p>

            <p><strong>Tech Help:</strong> ${user?.what_tech || "N/A"}</p>

            <hr>

            <p><strong>Why appointment:</strong></p>

            <ul>
                ${reason?.learn ? "<li>Learn something new</li>" : ""}
                ${reason?.need ? "<li>Need assistance with something</li>" : ""}
                ${reason?.new ? "<li>New device/setup</li>" : ""}
                ${reason?.help ? "<li>General help</li>" : ""}
                ${reason?.other ? "<li>Other</li>" : ""}
            </ul>

            <p>
                <strong>Description:</strong><br>
                ${reason?.describe_problem || "No description provided"}
            </p>

            <p class="staff-initials-display">
                <strong>Staff Initials:</strong>
                ${appointment.staff_initials || "—"}
            </p>

          ${currentView === "upcoming" ? `
    <div class="appointment-status">

        <button class="status-button confirm-button">
            Confirm
        </button>

        <button class="status-button reschedule-button">
            Reschedule
        </button>

        <button class="status-button cancel-button">
            Cancel
        </button>

    </div>
` : ""}
       
            <hr>

            <p class="submitted-time">
                <strong>Submitted:</strong><br>
                ${submittedText}
            </p>
        `;

        // =========================
        // CONFIRM BUTTON
        // =========================

  const confirmButton =
    card.querySelector(".confirm-button");

if (confirmButton) {

    // Show saved confirmation status
    if (appointment.appointment_confirmed === true) {

        card.classList.add("confirmed");

        confirmButton.classList.add("confirmed-button");

        confirmButton.textContent = "Confirmed";
    }

    confirmButton.addEventListener("click", async () => {

        const newStatus =
            !appointment.appointment_confirmed;

        const { error } = await client
            .from("appointments")
            .update({
                appointment_confirmed: newStatus
            })
            .eq("id", appointment.id);

        if (error) {

            console.error(
                "Error updating confirmation:",
                error
            );

            alert("Unable to save confirmation.");

            return;
        }

        // Update local appointment data
        appointment.appointment_confirmed = newStatus;

        // Update the card visually
        card.classList.toggle(
            "confirmed",
            newStatus
        );

        confirmButton.classList.toggle(
            "confirmed-button",
            newStatus
        );

        confirmButton.textContent =
            newStatus ? "Confirmed" : "Confirm";

    });

}
 
        // =========================
        // RESCHEDULE BUTTON
        // =========================

        const rescheduleButton =
            card.querySelector(".reschedule-button");

        if (rescheduleButton) {

            rescheduleButton.addEventListener("click", async () => {

                const modal =
                    document.getElementById("rescheduleModal");

                const currentAppointmentText =
                    document.getElementById("rescheduleCurrentAppointment");

                const slotSelect =
                    document.getElementById("rescheduleSlot");

                const sameTechName =
                    document.getElementById("sameTechName");

                const otherTechName =
                    document.getElementById("otherTechName");

                const techChoices = document.querySelectorAll(
                    'input[name="rescheduleTechChoice"]'
                );

                const originalStaff =
                    (appointment.assigned_staff || "").toLowerCase().trim();

                if (!["emma", "sarah"].includes(originalStaff)) {
                    alert(
                        "This appointment has no valid tech assignment. Please check its assigned tech before rescheduling."
                    );
                    return;
                }

                const otherStaff =
                    originalStaff === "emma" ? "sarah" : "emma";

                const staffLabel = (staff) =>
                    staff.charAt(0).toUpperCase() + staff.slice(1);

                sameTechName.textContent =
                    `Book ${staffLabel(originalStaff)}`;

                otherTechName.textContent =
                    `Book ${staffLabel(otherStaff)}`;

                const currentDate = new Date(
                    appointment.date + "T00:00:00"
                ).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                });

                currentAppointmentText.textContent =
                    `Currently scheduled for ${currentDate} at ${appointment.time} with ${staffLabel(originalStaff)}.`;

                // Remember the appointment being rescheduled.
                modal.dataset.appointmentId = appointment.id;
                modal.dataset.originalStaff = originalStaff;

                // Start with "Keep Same Tech" selected.
                techChoices.forEach((choice) => {
                    choice.checked = choice.value === "same";
                });

                slotSelect.innerHTML =
                    '<option value="">Loading available appointments...</option>';

                modal.style.display = "flex";

                // Parse the date and start time consistently.
                const parseSlotDateTime = (date, time) => {
                    const match = time.match(
                        /(\d{1,2}):(\d{2})\s*(AM|PM)/i
                    );

                    if (!match) return null;

                    let hours = Number(match[1]);
                    const minutes = Number(match[2]);
                    const meridiem = match[3].toUpperCase();

                    if (meridiem === "PM" && hours !== 12) {
                        hours += 12;
                    }

                    if (meridiem === "AM" && hours === 12) {
                        hours = 0;
                    }

                    const [year, month, day] =
                        date.split("-").map(Number);

                    return new Date(
                        year,
                        month - 1,
                        day,
                        hours,
                        minutes
                    );
                };

                // Load slots appropriate for the selected tech choice.
                const loadRescheduleSlots = async () => {

                    const selectedChoice =
                        document.querySelector(
                            'input[name="rescheduleTechChoice"]:checked'
                        )?.value || "same";

                    slotSelect.innerHTML =
                        '<option value="">Loading available appointments...</option>';

                    const { data: availableSlots, error } =
                        await client
                            .from("appointments")
                            .select("id, date, time, assigned_staff, booked, cancelled")
                            .eq("booked", false)
                            .order("date")
                            .order("time");

                    if (error) {
                        console.error(
                            "Error loading available appointments:",
                            error
                        );

                        slotSelect.innerHTML =
                            '<option value="">Unable to load appointments</option>';

                        alert("Unable to load available appointments.");
                        return;
                    }

                    const now = new Date();

                    const futureSlots = (availableSlots || [])
                        .filter((slot) => {

                            const staff =
                                (slot.assigned_staff || "")
                                    .toLowerCase()
                                    .trim();

                            if (!["emma", "sarah"].includes(staff)) {
                                return false;
                            }

                            if (selectedChoice === "same" &&
                                staff !== originalStaff) {
                                return false;
                            }

                            if (selectedChoice === "switch" &&
                                staff !== otherStaff) {
                                return false;
                            }

                            const slotDateTime =
                                parseSlotDateTime(slot.date, slot.time);

                            return slotDateTime && slotDateTime > now;
                        })
                        .sort((a, b) => {
                            return (
                                parseSlotDateTime(a.date, a.time) -
                                parseSlotDateTime(b.date, b.time)
                            );
                        });

                    slotSelect.innerHTML = "";

                    const placeholder =
                        document.createElement("option");

                    placeholder.value = "";
                    placeholder.textContent =
                        futureSlots.length
                            ? "Select an available appointment"
                            : "No future appointments available";

                    slotSelect.appendChild(placeholder);

                    futureSlots.forEach((slot) => {

                        const option =
                            document.createElement("option");

                        const slotDate = new Date(
                            slot.date + "T00:00:00"
                        );

                        const formattedDate =
                            slotDate.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                            });

                        const staff =
                            staffLabel(
                                slot.assigned_staff.toLowerCase().trim()
                            );

                        option.value = slot.id;
                        option.textContent =
                            `${formattedDate} — ${slot.time} — ${staff}`;

                        slotSelect.appendChild(option);
                    });
                };

                // Update the dropdown whenever the choice changes.
                techChoices.forEach((choice) => {
                    choice.onchange = loadRescheduleSlots;
                });

                await loadRescheduleSlots();

            });

        }
        
// =========================
// CANCEL BUTTON
// =========================

const cancelButton =
    card.querySelector(".cancel-button");

if (cancelButton) {

    cancelButton.addEventListener("click", async () => {

        const confirmed = confirm(
            "Are you sure you want to cancel this appointment?"
        );

        if (!confirmed) {
            return;
        }

        // =========================
        // CANCEL APPOINTMENT
        // =========================

        const { error } = await client
            .from("appointments")
            .update({
                cancelled: true,
                booked: false,
                appointment_confirmed: false
            })
            .eq("id", appointment.id);

        if (error) {

            console.error(
                "Error canceling appointment:",
                error
            );

            alert(
                "Unable to cancel the appointment."
            );

            return;
        }

        // Update local appointment data
        appointment.cancelled = true;
        appointment.booked = false;
        appointment.appointment_confirmed = false;

        // =========================
        // RELOAD APPOINTMENTS
        // =========================

        await loadAppointments();

        alert(
            "Appointment canceled."
        );

    });

}

        container.appendChild(card);

    });
}

// =========================
// RESCHEDULE APPOINTMENT
// =========================

const confirmReschedule =
    document.getElementById("confirmReschedule");

const cancelReschedule =
    document.getElementById("cancelReschedule");

const rescheduleModal =
    document.getElementById("rescheduleModal");

const rescheduleSlot =
    document.getElementById("rescheduleSlot");


// =========================
// CANCEL RESCHEDULE
// =========================

cancelReschedule.addEventListener("click", () => {

    rescheduleModal.style.display = "none";

    rescheduleSlot.value = "";

});



        // =========================
        // CONFIRM RESCHEDULE
        // =========================

        confirmReschedule.addEventListener("click", async () => {

            const oldAppointmentId =
                Number(rescheduleModal.dataset.appointmentId);

            const newAppointmentId =
                Number(rescheduleSlot.value);

            const originalStaff =
                (rescheduleModal.dataset.originalStaff || "")
                    .toLowerCase()
                    .trim();

            if (!oldAppointmentId) {
                alert("Unable to identify the appointment.");
                return;
            }

            if (!newAppointmentId) {
                alert("Please select a new appointment.");
                return;
            }

            if (!["emma", "sarah"].includes(originalStaff)) {
                alert("Unable to identify the original tech.");
                return;
            }

            // =========================
            // GET BOTH APPOINTMENTS
            // =========================

            const { data: oldAppointment, error: oldError } =
                await client
                    .from("appointments")
                    .select("id, date, time, booked, cancelled, assigned_staff")
                    .eq("id", oldAppointmentId)
                    .single();

            if (oldError || !oldAppointment) {
                console.error(
                    "Error loading current appointment:",
                    oldError
                );

                alert("Unable to load the current appointment.");
                return;
            }

            const { data: newAppointment, error: newError } =
                await client
                    .from("appointments")
                    .select("id, date, time, booked, cancelled, assigned_staff")
                    .eq("id", newAppointmentId)
                    .single();

            if (newError || !newAppointment) {
                console.error(
                    "Error loading selected appointment:",
                    newError
                );

                alert("Unable to load the selected appointment.");
                return;
            }

            const oldStaff =
                (oldAppointment.assigned_staff || "")
                    .toLowerCase()
                    .trim();

            const newStaff =
                (newAppointment.assigned_staff || "")
                    .toLowerCase()
                    .trim();

            // Verify the original appointment is still booked.
            if (
                oldAppointment.booked !== true ||
                oldAppointment.cancelled === true ||
                oldStaff !== originalStaff
            ) {
                alert(
                    "The original appointment has changed. Please reload the page and try again."
                );

                await loadAppointments();
                return;
            }

            // Verify the selected slot is still available.
            if (
                newAppointment.booked !== false ||
                !["emma", "sarah"].includes(newStaff)
            ) {
                alert(
                    "That appointment is no longer available. Please choose another."
                );

                await loadAppointments();
                return;
            }

            // Make sure the slot matches the selected tech choice.
            const selectedChoice =
                document.querySelector(
                    'input[name="rescheduleTechChoice"]:checked'
                )?.value || "same";

            const expectedStaff =
                selectedChoice === "same"
                    ? originalStaff
                    : selectedChoice === "switch"
                        ? (originalStaff === "emma" ? "sarah" : "emma")
                        : newStaff;

            if (
                newStaff !== expectedStaff ||
                !["same", "switch", "any"].includes(selectedChoice)
            ) {
                alert(
                    "The selected slot does not match the chosen tech. Please select a slot again."
                );
                return;
            }

            // =========================
            // SAVE ORIGINAL SLOT DETAILS
            // =========================

            const oldDate = oldAppointment.date;
            const oldTime = oldAppointment.time;

            const newDate = newAppointment.date;
            const newTime = newAppointment.time;

            // =========================
            // MOVE THE BOOKED APPOINTMENT
            // Keep its ID and patron information.
            // =========================

            const { error: moveError } =
                await client
                    .from("appointments")
                    .update({
                        date: newDate,
                        time: newTime,
                        assigned_staff: newStaff,
                        appointment_confirmed: false
                    })
                    .eq("id", oldAppointmentId)
                    .eq("booked", true);

            if (moveError) {
                console.error(
                    "Error moving appointment:",
                    moveError
                );

                alert("Unable to reschedule the appointment.");
                return;
            }

            // =========================
            // RETURN THE ORIGINAL SLOT
            // Restore its original tech assignment.
            // =========================

            const { error: freeError } =
                await client
                    .from("appointments")
                    .update({
                        date: oldDate,
                        time: oldTime,
                        assigned_staff: oldStaff,
                        booked: false,
                        cancelled: false,
                        appointment_confirmed: false,
                        staff_initials: null
                    })
                    .eq("id", newAppointmentId)
                    .eq("booked", false)

            if (freeError) {
                console.error(
                    "Error returning original slot:",
                    freeError
                );

                // Attempt to restore the booked appointment.
                const { error: rollbackError } =
                    await client
                        .from("appointments")
                        .update({
                            date: oldDate,
                            time: oldTime,
                            assigned_staff: oldStaff
                        })
                        .eq("id", oldAppointmentId);

                if (rollbackError) {
                    console.error(
                        "Rollback failed:",
                        rollbackError
                    );

                    alert(
                        "The reschedule encountered an error, and automatic recovery was unsuccessful. Please check the appointment in Supabase before trying again."
                    );
                } else {
                    alert(
                        "The appointment could not be fully rescheduled. The original appointment was restored."
                    );
                }

                await loadAppointments();
                return;
            }

            // =========================
            // CLOSE MODAL AND REFRESH
            // =========================

            rescheduleModal.style.display = "none";
            rescheduleSlot.value = "";

            await loadAppointments();

            alert("Appointment successfully rescheduled.");

        });

// =========================
// ADMIN SEARCH
// =========================

const searchBox =
    document.getElementById("searchAppointments");

searchBox.addEventListener("input", () => {

    const search = normalize(searchBox.value);

    const filtered = allAppointments.filter((appointment) => {

        const user = appointment.user_info?.[0];
        const reason = appointment.why_appointment?.[0];

        if (!user) return false;

        const searchableText = [

            user?.name,
            user?.phone_number,
            user?.email,
            user?.what_tech,
            reason?.describe_problem

        ].join(" ");

        return normalize(searchableText).includes(search);

    });

    displayAppointments(filtered);

});

// =========================
// ADMIN VIEW BUTTONS
// =========================

const showUpcomingButton =
    document.getElementById("showUpcoming");

const showPastButton =
    document.getElementById("showPast");

const showCanceledButton =
    document.getElementById("showCanceled");

const adminViewTitle =
    document.getElementById("adminViewTitle");

// =========================
// CLEAR ACTIVE VIEW
// =========================

function clearActiveView() {

    showUpcomingButton.classList.remove("active-view");

    showPastButton.classList.remove("active-view");

    showCanceledButton.classList.remove("active-view");

}

// =========================
// UPCOMING
// =========================

showUpcomingButton.addEventListener("click", () => {

    currentView = "upcoming";

    clearActiveView();

    showUpcomingButton.classList.add("active-view");

    adminViewTitle.textContent =
        "Upcoming Appointments";

    displayAppointments(allAppointments);

});

// =========================
// PAST
// =========================

showPastButton.addEventListener("click", () => {

    currentView = "past";

    clearActiveView();

    showPastButton.classList.add("active-view");

    adminViewTitle.textContent =
        "Past Dates";

    displayAppointments(allAppointments);

});

// =========================
// CANCELED
// =========================

showCanceledButton.addEventListener("click", () => {

    currentView = "canceled";

    clearActiveView();

    showCanceledButton.classList.add("active-view");

    adminViewTitle.textContent =
        "Canceled Appointments";

    displayAppointments(allAppointments);

});

// =========================
// RUN WHEN ADMIN PAGE OPENS
// =========================

loadAppointments();
