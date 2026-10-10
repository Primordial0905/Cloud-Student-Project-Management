/* ========================================
   Configuration
======================================== */

const API_BASE = "/api";

/* ========================================
   Application State
======================================== */

let projects = [];
let tasks = [];

let currentProject = null;

let editingProjectId = null;
let editingTaskId = null;

let notificationTimer = null;

/* ========================================
   DOM Elements
======================================== */

const $ = (id) => document.getElementById(id);
const logoutButton = document.getElementById("logoutButton");

const dashboardView = $("dashboardView");
const projectView = $("projectView");

const projectsGrid = $("projectsGrid");
const tasksContainer = $("tasksContainer");

const notification = $("notification");

const projectModal = $("projectModal");
const projectForm = $("projectForm");

const taskModal = $("taskModal");
const taskForm = $("taskForm");

/* ========================================
   API Helper
======================================== */

async function apiRequest(endpoint, options = {}) {

    const response = await fetch(API_BASE + endpoint, {
        ...options,

        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const text = await response.text();

    let data = {};

    if (text) {

        try {
            data = JSON.parse(text);

        } catch {

            throw new Error(
                "The server returned an invalid response."
            );
        }
    }

    if (
        response.status === 401 ||
        response.status === 403
    ) {

        throw new Error(
            "You are not authorized to perform this action."
        );
    }

    if (
        !response.ok ||
        data.success === false ||
        data.status === false
    ) {

        throw new Error(
            data.message ||
            data.error ||
            `Request failed (${response.status})`
        );
    }

    return data;
}

/* ========================================
   Utility
======================================== */

function showNotification(message, type = "success") {

    if (notificationTimer) {
        clearTimeout(notificationTimer);
    }

    notification.textContent = message;

    notification.className =
        `notification ${type}`;

    notificationTimer =
        setTimeout(() => {

            notification.classList.add("hidden");

        }, 5000);
}


function setLoading(container, message) {

    container.innerHTML = "";

    const element =
        document.createElement("div");

    element.className = "empty-state";

    element.textContent = message;

    container.appendChild(element);
}


function createElement(
    tag,
    className,
    text
) {

    const element =
        document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (
        text !== undefined &&
        text !== null
    ) {

        element.textContent =
            String(text);
    }

    return element;
}


function createButton(
    label,
    className,
    onClick
) {

    const button =
        createElement(
            "button",
            `btn ${className}`,
            label
        );

    button.type = "button";

    button.addEventListener(
        "click",
        onClick
    );

    return button;
}


function formatDate(value) {

    if (!value) {
        return "No due date";
    }

    const date =
        String(value).slice(0, 10);

    const parts =
        date.split("-");

    if (parts.length !== 3) {
        return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


function dateInputValue(value) {

    if (!value) {
        return "";
    }

    return String(value).slice(0, 10);
}


function closeModal(modal) {

    modal.classList.add("hidden");

    if (modal === projectModal) {

        projectForm.reset();

        editingProjectId = null;
    }

    if (modal === taskModal) {

        taskForm.reset();

        editingTaskId = null;
    }
}

/* ========================================
   Dashboard
======================================== */

function showDashboard() {

    currentProject = null;

    projectView.classList.add("hidden");

    dashboardView.classList.remove("hidden");

    loadProjects();
}


async function showProject(projectId) {

    dashboardView.classList.add("hidden");

    projectView.classList.remove("hidden");

    $("detailProjectName").textContent =
        "Loading project...";

    $("detailProjectDescription").textContent =
        "";

    setLoading(
        tasksContainer,
        "Loading tasks..."
    );

    try {

        const data =
            await apiRequest(
                `/projects/${projectId}`
            );

        currentProject =
            data.project || data;


        if (
            !currentProject ||
            !currentProject.id
        ) {

            throw new Error(
                "Project not found."
            );
        }


        renderProjectDetails();

        await loadTasks();

    } catch (error) {

        console.error(error);

        showNotification(
            error.message,
            "error"
        );

        showDashboard();
    }
}

/* ========================================
   Projects
======================================== */

async function loadProjects() {

    setLoading(
        projectsGrid,
        "Loading projects..."
    );

    try {

        const data =
            await apiRequest(
                "/projects"
            );

        projects =
            data.projects || [];

        $("totalProjects").textContent =
            projects.length;

        renderProjects();

    } catch (error) {

        console.error(error);

        setLoading(
            projectsGrid,
            "Unable to load projects."
        );

        showNotification(
            error.message,
            "error"
        );
    }
}


function renderProjects() {

    projectsGrid.innerHTML = "";

    if (projects.length === 0) {

        setLoading(
            projectsGrid,
            "No projects yet. Create your first project."
        );

        return;
    }


    projects.forEach((project) => {

        const card =
            createElement(
                "article",
                "project-card"
            );


        const title =
            createElement(
                "h3",
                "",
                project.name
            );


        const description =
            createElement(
                "p",
                "",
                project.description ||
                "No description provided."
            );


        const footer =
            createElement(
                "div",
                "card-footer"
            );


        const projectId =
            createElement(
                "small",
                "",
                `Project #${project.id}`
            );


        const viewButton =
            createButton(
                "View Project",
                "btn-primary btn-small",
                () => showProject(project.id)
            );


        footer.append(
            projectId,
            viewButton
        );


        card.append(
            title,
            description,
            footer
        );


        projectsGrid.appendChild(card);
    });
}

/* ========================================
   Project Forms
======================================== */

function openCreateProjectModal() {

    editingProjectId = null;

    projectForm.reset();

    $("projectModalTitle").textContent =
        "Create Project";

    $("saveProjectBtn").textContent =
        "Create Project";

    projectModal.classList.remove(
        "hidden"
    );

    $("projectName").focus();
}


function openEditProjectModal() {

    if (!currentProject) {
        return;
    }

    editingProjectId =
        currentProject.id;

    $("projectModalTitle").textContent =
        "Edit Project";

    $("saveProjectBtn").textContent =
        "Save Changes";

    $("projectName").value =
        currentProject.name || "";

    $("projectDescription").value =
        currentProject.description || "";

    projectModal.classList.remove(
        "hidden"
    );

    $("projectName").focus();
}

/* ========================================
   Save Project
======================================== */

async function saveProject(event) {

    event.preventDefault();

    const name =
        $("projectName")
            .value
            .trim();

    const description =
        $("projectDescription")
            .value
            .trim();


    if (!name) {

        showNotification(
            "Project name is required.",
            "error"
        );

        return;
    }


    const button =
        $("saveProjectBtn");

    button.disabled = true;

    button.textContent =
        "Saving...";


    try {

        /*
         * IMPORTANT:
         * owner_id is intentionally NOT sent.
         *
         * The backend determines the owner
         * from the authenticated GitHub account.
         */

        const payload = {

            name,

            description
        };


        if (editingProjectId !== null) {

            const projectId =
                editingProjectId;


            await apiRequest(
                `/projects/${projectId}`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify(payload)
                }
            );


            closeModal(projectModal);


            showNotification(
                "Project updated successfully."
            );


            await showProject(
                projectId
            );

        } else {

            await apiRequest(
                "/projects",
                {
                    method: "POST",

                    body:
                        JSON.stringify(payload)
                }
            );


            closeModal(projectModal);


            showNotification(
                "Project created successfully."
            );


            await loadProjects();
        }


    } catch (error) {

        console.error(error);

        showNotification(
            error.message,
            "error"
        );


    } finally {

        button.disabled = false;

        button.textContent =
            editingProjectId === null
                ? "Create Project"
                : "Save Changes";
    }
}

/* ========================================
   Delete Project
======================================== */

async function deleteProject() {

    if (!currentProject) {
        return;
    }


    const projectId =
        currentProject.id;


    const confirmed =
        confirm(
            `Delete "${currentProject.name}"?\n\n` +
            "All tasks in this project will also be deleted. " +
            "This action cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    const button =
        $("deleteProjectBtn");

    button.disabled = true;


    try {

        await apiRequest(
            `/projects/${projectId}`,
            {
                method: "DELETE"
            }
        );


        showDashboard();


        showNotification(
            "Project deleted successfully."
        );


    } catch (error) {

        console.error(error);

        showNotification(
            error.message,
            "error"
        );


    } finally {

        button.disabled = false;
    }
}

/* ========================================
   Project Details
======================================== */

function renderProjectDetails() {

    if (!currentProject) {
        return;
    }


    $("detailProjectName").textContent =
        currentProject.name;


    $("detailProjectDescription").textContent =
        currentProject.description ||
        "No description provided.";
}

/* ========================================
   Tasks
======================================== */

async function loadTasks() {

    if (!currentProject) {
        return;
    }


    const projectId =
        currentProject.id;


    setLoading(
        tasksContainer,
        "Loading tasks..."
    );


    try {

        const data =
            await apiRequest(
                `/projects/${projectId}/tasks`
            );


        if (
            !currentProject ||
            currentProject.id !== projectId
        ) {

            return;
        }


        tasks =
            data.tasks || [];


        updateTaskStats();

        renderTasks();


    } catch (error) {

        console.error(error);

        setLoading(
            tasksContainer,
            "Unable to load tasks."
        );


        showNotification(
            error.message,
            "error"
        );
    }
}


function updateTaskStats() {

    $("totalTasks").textContent =
        tasks.length;


    $("inProgressTasks").textContent =
        tasks.filter(
            task =>
                task.status ===
                "IN_PROGRESS"
        ).length;


    $("completedTasks").textContent =
        tasks.filter(
            task =>
                task.status ===
                "DONE"
        ).length;
}


function renderTasks() {

    tasksContainer.innerHTML = "";


    if (tasks.length === 0) {

        setLoading(
            tasksContainer,
            "No tasks yet. Add your first task."
        );

        return;
    }


    tasks.forEach((task) => {

        const card =
            createElement(
                "article",
                "task-card"
            );


        const header =
            createElement(
                "div",
                "task-header"
            );


        const title =
            createElement(
                "h4",
                "",
                task.title
            );


        const badges =
            createElement(
                "div",
                "task-badges"
            );


        const statusLabel = {

            TODO: "To Do",

            IN_PROGRESS:
                "In Progress",

            DONE: "Done"
        };


        const status =
            createElement(
                "span",
                `pill status-${task.status}`,
                statusLabel[
                    task.status
                ] || task.status
            );


        const priority =
            createElement(
                "span",
                `pill priority-${task.priority}`,
                task.priority
            );


        badges.append(
            status,
            priority
        );


        header.append(
            title,
            badges
        );


        const description =
            createElement(
                "p",
                "",
                task.description ||
                "No description."
            );


        const footer =
            createElement(
                "div",
                "task-footer"
            );


        const metadata =
            createElement(
                "div",
                "task-meta"
            );


        const assigned =
            task.assigned_user ||
            (
                task.assigned_to
                    ? `User #${task.assigned_to}`
                    : "Unassigned"
            );


        const assignee =
            createElement(
                "span",
                "",
                `Assigned: ${assigned}`
            );


        const dueDate =
            createElement(
                "span",
                "",
                `Due: ${formatDate(
                    task.due_date
                )}`
            );


        metadata.append(
            assignee,
            dueDate
        );


        const actions =
            createElement(
                "div",
                "button-group"
            );


        const editButton =
            createButton(
                "Edit",
                "btn-secondary btn-small",
                () =>
                    openEditTaskModal(task)
            );


        const deleteButton =
            createButton(
                "Delete",
                "btn-danger btn-small",
                () =>
                    deleteTask(task)
            );


        actions.append(
            editButton,
            deleteButton
        );


        footer.append(
            metadata,
            actions
        );


        card.append(
            header,
            description,
            footer
        );


        tasksContainer.appendChild(
            card
        );
    });
}

/* ========================================
   Task Forms
======================================== */

function openCreateTaskModal() {

    if (!currentProject) {
        return;
    }


    editingTaskId = null;

    taskForm.reset();


    $("taskStatus").value =
        "TODO";

    $("taskPriority").value =
        "MEDIUM";


    $("taskModalTitle").textContent =
        "Create Task";


    $("saveTaskBtn").textContent =
        "Create Task";


    taskModal.classList.remove(
        "hidden"
    );


    $("taskTitle").focus();
}


function openEditTaskModal(task) {

    editingTaskId =
        task.id;


    $("taskModalTitle").textContent =
        "Edit Task";


    $("saveTaskBtn").textContent =
        "Save Changes";


    $("taskTitle").value =
        task.title || "";


    $("taskDescription").value =
        task.description || "";


    $("taskStatus").value =
        task.status || "TODO";


    $("taskPriority").value =
        task.priority || "MEDIUM";


    $("taskAssignedTo").value =
        task.assigned_to ?? "";


    $("taskDueDate").value =
        dateInputValue(
            task.due_date
        );


    taskModal.classList.remove(
        "hidden"
    );


    $("taskTitle").focus();
}

/* ========================================
   Save Task
======================================== */

async function saveTask(event) {

    event.preventDefault();


    if (!currentProject) {
        return;
    }


    const title =
        $("taskTitle")
            .value
            .trim();


    if (!title) {

        showNotification(
            "Task title is required.",
            "error"
        );

        return;
    }


    const assignedValue =
        $("taskAssignedTo")
            .value
            .trim();


    const assignedTo =
        assignedValue
            ? Number(assignedValue)
            : null;


    if (
        assignedTo !== null &&
        (
            !Number.isInteger(
                assignedTo
            ) ||
            assignedTo < 1
        )
    ) {

        showNotification(
            "Assigned User ID must be a positive integer.",
            "error"
        );

        return;
    }


    const payload = {

        title,

        description:
            $("taskDescription")
                .value
                .trim(),

        status:
            $("taskStatus").value,

        priority:
            $("taskPriority").value,

        assigned_to:
            assignedTo,

        due_date:
            $("taskDueDate").value ||
            null
    };


    const button =
        $("saveTaskBtn");


    button.disabled = true;

    button.textContent =
        "Saving...";


    try {

        if (
            editingTaskId !== null
        ) {

            await apiRequest(
                `/tasks/${editingTaskId}`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


            closeModal(taskModal);


            showNotification(
                "Task updated successfully."
            );


        } else {

            await apiRequest(
                `/projects/${currentProject.id}/tasks`,
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


            closeModal(taskModal);


            showNotification(
                "Task created successfully."
            );
        }


        await loadTasks();


    } catch (error) {

        console.error(error);

        showNotification(
            error.message,
            "error"
        );


    } finally {

        button.disabled = false;

        button.textContent =
            editingTaskId === null
                ? "Create Task"
                : "Save Changes";
    }
}

/* ========================================
   Delete Task
======================================== */

async function deleteTask(task) {

    const confirmed =
        confirm(
            `Delete task "${task.title}"?\n\n` +
            "This action cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/tasks/${task.id}`,
            {
                method: "DELETE"
            }
        );


        showNotification(
            "Task deleted successfully."
        );


        await loadTasks();


    } catch (error) {

        console.error(error);

        showNotification(
            error.message,
            "error"
        );
    }
}

/* ========================================
   Event Listeners
======================================== */

$("newProjectBtn").addEventListener(
    "click",
    openCreateProjectModal
);


$("backBtn").addEventListener(
    "click",
    showDashboard
);


$("editProjectBtn").addEventListener(
    "click",
    openEditProjectModal
);


$("deleteProjectBtn").addEventListener(
    "click",
    deleteProject
);


$("closeProjectModal").addEventListener(
    "click",
    () =>
        closeModal(projectModal)
);


$("cancelProjectBtn").addEventListener(
    "click",
    () =>
        closeModal(projectModal)
);


projectForm.addEventListener(
    "submit",
    saveProject
);


$("newTaskBtn").addEventListener(
    "click",
    openCreateTaskModal
);


$("closeTaskModal").addEventListener(
    "click",
    () =>
        closeModal(taskModal)
);


$("cancelTaskBtn").addEventListener(
    "click",
    () =>
        closeModal(taskModal)
);


taskForm.addEventListener(
    "submit",
    saveTask
);


[projectModal, taskModal].forEach(
    (modal) => {

        modal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === modal
                ) {

                    closeModal(modal);
                }
            }
        );
    }
);


if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        window.location.href =
            "/.auth/logout?post_logout_redirect_uri=" +
            encodeURIComponent(
                window.location.origin + "/logged-out.html"
            );
    });
}


document.addEventListener(
    "keydown",
    (event) => {

        if (event.key !== "Escape") {
            return;
        }


        if (
            !projectModal
                .classList
                .contains("hidden")
        ) {

            closeModal(projectModal);
        }


        if (
            !taskModal
                .classList
                .contains("hidden")
        ) {

            closeModal(taskModal);
        }
    }
);

/* ========================================
   Start
======================================== */

loadProjects();