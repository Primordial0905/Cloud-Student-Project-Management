const { app } = require("@azure/functions");
const { getDatabaseConnection } = require("../database");

app.http("task-update", {
    methods: ['PUT'],
    authLevel: "anonymous",
    route: "tasks/{id}",

    handler: async (request, context) => {
        try {
            const taskId = request.params.id;

            if (!taskId || isNaN(Number(taskId))) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Invalid task ID"
                    }
                };
            }

            const body = await request.json();

            const pool = await getDatabaseConnection();

            const result = await pool
                .request()
                .input("taskId", Number(taskId))
                .input("title", body.title)
                .input("description", body.description || null)
                .input("status", body.status || "TODO")
                .input("priority", body.priority || "MEDIUM")
                .input("dueDate", body.due_date || null)
                .query(`
                    UPDATE Tasks
                    SET
                        title = @title,
                        description = @description,
                        status = @status,
                        priority = @priority,
                        due_date = @dueDate,
                        updated_at = GETUTCDATE()
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
                    WHERE id = @taskId
                `);

            if (result.recordset.length === 0) {
                return {
                    status: 404,
                    jsonBody: {
                        success: false,
                        message: "Task not found"
                    }
                };
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message : "Task updated successfully",
                    project: result.recordset[0]
                }
            };

        } catch (error) {
            context.error("Task update error:", error);

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