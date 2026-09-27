const { app } = require("@azure/functions");
const { getDatabaseConnection } = require("../database");

app.http("task-create", {
    methods: ['POST'],
    authLevel: "anonymous",
    route: "projects/{projectId}/tasks",

    handler: async (request, context) => {
        try {
            const projectId = request.params.projectId;

            if (!projectId || isNaN(Number(projectId))) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Invalid project ID"
                    }
                };
            }

            const body = await request.json();
            
            if(!body.title){
                return {
                    status : 400,
                    jsonBody : {
                        success : false,
                        message : "Task title is required"
                    }
                };
            }

            const pool = await getDatabaseConnection();

            const project = await pool
                .request()
                .input("projectId", Number(projectId))
                .query(`
                    SELECT id
                    FROM Projects
                    WHERE id = @projectId
                `);

            if (project.recordset.length === 0) {
                return {
                    status: 404,
                    jsonBody: {
                        success: false,
                        message: "Project not found"
                    }
                };
            }

            const result = await pool
                .request()
                .input("projectId", Number(projectId))
                .input("assignedTo", body.assigned_to || null)
                .input("title", body.title)
                .input("description", body.description || null)
                .input("status", body.status || "TODO")
                .input("priority", body.priority || "MEDIUM")
                .input("dueDate", body.due_date || null)
                .query(`
                    INSERT INTO Tasks
                        (
                            project_id,
                            assigned_to,
                            title,
                            description,
                            status,
                            priority,
                            due_date
                        )
                    OUTPUT
                        INSERTED.id,
                        INSERTED.project_id,
                        INSERTED.assigned_to,
                        INSERTED.title,
                        INSERTED.description,
                        INSERTED.status,
                        INSERTED.priority,
                        INSERTED.due_date,
                        INSERTED.created_at,
                        INSERTED.updated_at
                    VALUES
                        (
                            @projectId,
                            @assignedTo,
                            @title,
                            @description,
                            @status,
                            @priority,
                            @dueDate
                        )
                `);

            return {
                status: 201,
                jsonBody: {
                    success: true,
                    message : "Task created successfully",
                    project: result.recordset[0]
                }
            };

        } catch (error) {
            context.error("Task creation error:", error);

            return {
                status: 500,
                jsonBody: {
                    success: false,
                    message: "Internal server error"
                }
            };
        }
    }
});