const projectsContainer = document.getElementById("projectsContainer");
const newProjectButton = document.getElementById("newProjectButton");
const projectModal = document.getElementById("projectModal");
const closeModalButton = document.getElementById("closeModalButton");
const cancelButton = document.getElementById("cancelButton");
const projectForm = document.getElementById("projectForm");
const projectName = document.getElementById("projectName");
const projectDescription = document.getElementById("projectDescription");
const createButton = document.getElementById("createButton");
const message = document.getElementById("message");

/* =========================
   Utility
========================= */

function showMessage(text, type) {

    message.textContent = text;
    message.className = `message ${type}`;

    setTimeout(() => {
        message.classList.add("hidden");
    }, 4000);
}


/* =========================
   Load Projects
========================= */

async function loadProjects() {

    projectsContainer.innerHTML = `
        <div class="loading">
            Loading projects...
        </div>
    `;

    try {
        const response = await fetch("/api/projects");

        if (!response.ok) {
            throw new Error("Failed to load projects.");
        }

        const data = await response.json();
        const projects = data.projects || [];

        renderProjects(projects);

    } catch (error) {

        console.error(error);

        projectsContainer.innerHTML = `
            <div class="empty">
                Unable to load projects.
            </div>
        `;

        showMessage(
            "Unable to connect to the project API.",
            "error"
        );
    }
}

/* =========================
   Render Projects
========================= */

function renderProjects(projects) {

    if (projects.length === 0) {

        projectsContainer.innerHTML = `
            <div class="empty">
                <h3>No projects yet</h3>
                <p>Create your first project to get started.</p>
            </div>
        `;
        return;
    }

    projectsContainer.innerHTML = "";

    projects.forEach(project => {

        const card = document.createElement("div");
       
        card.className = "project-card";

        const title = document.createElement("h3");
      
        title.textContent = project.name;

        const description = document.createElement("p");

        description.className = "project-description";

        description.textContent =
            project.description || "No description provided.";

        const info = document.createElement("div");

        info.className = "project-info";

        info.textContent =
            `Project ID: ${project.id}`;

        card.appendChild(title);

        card.appendChild(description);

        card.appendChild(info);

        projectsContainer.appendChild(card);

    });
}

/* =========================
   Open Modal
========================= */

function openModal() {
    projectModal.classList.remove("hidden");
    projectName.focus();
}


/* =========================
   Close Modal
========================= */

function closeModal() {
    projectModal.classList.add("hidden");
    projectForm.reset();
}


/* =========================
   Create Project
========================= */

async function createProject(event) {

    event.preventDefault();

    const name = projectName.value.trim();

    const description =
        projectDescription.value.trim();

    if (!name) {
        showMessage(
            "Project name is required.",
            "error"
        );
        return;
    }

    createButton.disabled = true;

    createButton.textContent = "Creating...";

    try {
        const response = await fetch("/api/projects", {

            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                description: description,
                owner_id: 1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to create project."
            );
        }

        closeModal();

        showMessage(
            "Project created successfully!",
            "success"
        );

        await loadProjects();

    } catch (error) {

        console.error(error);
        showMessage(
            error.message || "Unable to create project.",
            "error"
        );
    } finally {
        createButton.disabled = false;

        createButton.textContent = "Create Project";
    }
}


/* =========================
   Event Listeners
========================= */

newProjectButton.addEventListener(
    "click",
    openModal
);


closeModalButton.addEventListener(
    "click",
    closeModal
);


cancelButton.addEventListener(
    "click",
    closeModal
);


projectForm.addEventListener(
    "submit",
    createProject
);

/* Close modal when clicking outside */

projectModal.addEventListener(
    "click",
    function(event) {
        if (event.target === projectModal) {
            closeModal();
        }
    }
);

/* =========================
   Initial Load
========================= */
loadProjects();