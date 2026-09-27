const projectsContainer = document.getElementById("projectsContainer");
const errorMessage = document.getElementById("errorMessage");

async function loadProjects() {
    try {
        const response = await fetch("/api/projects");

        if (!response.ok) {
            throw new Error("Failed to load projects.");
        }

        const data = await response.json();

        renderProjects(data.projects);

    } catch (error) {
        console.error(error);

        projectsContainer.innerHTML = "";
        errorMessage.textContent = "Unable to load projects.";
    }
}

function renderProjects(projects) {
    projectsContainer.innerHTML = "";

    if (!projects || projects.length === 0) {
        projectsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No projects yet</h3>
                <p>Create your first university project to get started.</p>
            </div>
        `;

        return;
    }

    projects.forEach(project => {
        const projectCard = document.createElement("div");

        projectCard.className = "project-card";

        projectCard.innerHTML = `
            <h3>${project.name}</h3>

            <p>${project.description || "No description available."}</p>

            <div class="project-info">
                <span>Project ID: ${project.id}</span>
            </div>

            <button class="open-project-button" data-id="${project.id}">
                Open Project
            </button>
        `;

        projectsContainer.appendChild(projectCard);
    });
}

loadProjects();