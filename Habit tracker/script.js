/* =================================================
   HABIT QUEST PRO — MAIN SCRIPT
   Stores everything in browser localStorage
================================================= */


/* ---------- USER DETAILS ---------- */

function saveUserDetails() {
    const name = nameInput.value.trim();
    const age = ageInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !age || !email) {
        alert("All user details are required");
        return;
    }

    const userObject = { name, age, email };
    localStorage.setItem("userData", JSON.stringify(userObject));

    userBox.style.display = "none";
    taskSetupBox.style.display = "block";
}



/* ---------- TASK SETUP ---------- */

let tempTaskList = [];

function addTaskToList() {
    const taskName = taskNameInput.value.trim();
    const startTime = taskStartTime.value;
    const endTime = taskEndTime.value;

    if (!taskName || !startTime || !endTime) {
        alert("Please fill all task fields");
        return;
    }

    if (endTime <= startTime) {
        alert("End time must be after start time");
        return;
    }

    const taskObject = {
        name: taskName,
        start: startTime,
        end: endTime
    };

    tempTaskList.push(taskObject);

    taskPreviewList.innerHTML +=
        `<div>${taskName} — ${startTime} to ${endTime}</div>`;

    taskNameInput.value = "";
    taskStartTime.value = "";
    taskEndTime.value = "";
}


function saveAllTasks() {
    if (tempTaskList.length === 0) {
        alert("Add at least one task");
        return;
    }

    localStorage.setItem("taskList", JSON.stringify(tempTaskList));
    localStorage.setItem("trackingStartDate", getTodayString());
    localStorage.setItem("completedTaskIndexes", JSON.stringify([]));

    openDashboard();
}



/* ---------- DATE & DAY LOGIC ---------- */

function getTodayString() {
    return new Date().toDateString();
}

function getTrackingDayNumber() {
    const startDate = new Date(localStorage.getItem("trackingStartDate"));
    const today = new Date(getTodayString());

    const diffDays =
        Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    return diffDays + 1;
}

function resetTasksIfNewDay() {
    const lastOpenDate = localStorage.getItem("lastOpenDate");

    if (lastOpenDate !== getTodayString()) {
        localStorage.setItem("lastOpenDate", getTodayString());
        localStorage.setItem("completedTaskIndexes", JSON.stringify([]));
    }
}



/* ---------- TIME UTILITIES ---------- */

function getCurrentMinutesOfDay() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function convertTimeToMinutes(timeString) {
    const [h, m] = timeString.split(":");
    return (+h) * 60 + (+m);
}



/* ---------- TASK STATUS ---------- */

function getTaskStatus(task, isCompleted) {

    if (isCompleted) return "Completed";

    const now = getCurrentMinutesOfDay();
    const start = convertTimeToMinutes(task.start);
    const end = convertTimeToMinutes(task.end);

    if (now < start) return "Not started";
    if (now <= end) return "In progress";
    return "Missed";
}



/* ---------- DASHBOARD ---------- */

function openDashboard() {

    userBox.style.display = "none";
    taskSetupBox.style.display = "none";
    dashboardBox.style.display = "block";

    resetTasksIfNewDay();

    const user = JSON.parse(localStorage.getItem("userData"));
    const tasks = JSON.parse(localStorage.getItem("taskList"));
    const completed = JSON.parse(localStorage.getItem("completedTaskIndexes"));

    welcomeText.innerText = `Welcome ${user.name}`;
    dayCounterText.innerText = "Day " + getTrackingDayNumber();

    renderTaskCards(tasks, completed);
}


function renderTaskCards(tasks, completedIndexes) {

    taskCardsContainer.innerHTML = "";

    tasks.forEach((task, index) => {

        const done = completedIndexes.includes(index);
        const status = getTaskStatus(task, done);

        taskCardsContainer.innerHTML += `
            <div class="task-card ${done ? "task-completed" : ""}">
                <b>${task.name}</b><br>
                🕒 ${task.start} — ${task.end}<br>
                Status: ${status}<br>
                <button onclick="markTaskCompleted(${index})"
                    ${done ? "disabled" : ""}>
                    Mark Done
                </button>
            </div>
        `;
    });
}


function markTaskCompleted(taskIndex) {
    const completed =
        JSON.parse(localStorage.getItem("completedTaskIndexes"));

    completed.push(taskIndex);

    localStorage.setItem(
        "completedTaskIndexes",
        JSON.stringify(completed)
    );

    openDashboard();
}



/* ---------- LIVE CLOCK ---------- */

function updateLiveClock() {
    const now = new Date();

    liveClockText.innerText =
        now.toLocaleDateString(undefined, { weekday: "long" }) +
        " | " + now.toLocaleDateString() +
        " | " + now.toLocaleTimeString();
}

setInterval(updateLiveClock, 1000);



/* ---------- NOTIFICATIONS ---------- */

if ("Notification" in window) {
    Notification.requestPermission();
}

function checkForMissedTasks() {

    if (Notification.permission !== "granted") return;

    const tasks = JSON.parse(localStorage.getItem("taskList") || "[]");
    const completed =
        JSON.parse(localStorage.getItem("completedTaskIndexes") || "[]");

    tasks.forEach((task, index) => {

        const taskEnd = convertTimeToMinutes(task.end);

        if (!completed.includes(index) &&
            getCurrentMinutesOfDay() > taskEnd) {

            new Notification("Task Missed ⚠️", {
                body: task.name + " was not completed"
            });
        }
    });
}

setInterval(checkForMissedTasks, 5 * 60 * 1000);



/* ---------- APP START ---------- */

function initializeApp() {

    if (!localStorage.getItem("userData")) {
        userBox.style.display = "block";
        return;
    }

    if (!localStorage.getItem("taskList")) {
        taskSetupBox.style.display = "block";
        return;
    }

    openDashboard();
}

initializeApp();
