const { app } = require("@azure/functions");
const { getDatabaseConnection } = require("../database");

app.http("task-delete", {
    methods: ['DELETE'],
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

            const pool = await getDatabaseConnection();

            const result = await pool
                .request()
                .input("taskId", Number(taskId))
                .query(`
                    DELETE FROM Tasks
                    OUTPUT DELETED.id
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
                    message : "Task deleted successfully",
                    task: result.recordset[0]
                }
            };

        } catch (error) {
            context.error("Task delete error:", error);

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