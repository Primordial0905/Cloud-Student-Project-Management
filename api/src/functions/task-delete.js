const { app } = require("@azure/functions");

const {
    sql,
    getDatabaseConnection
} = require("../database");

const {
    getCurrentUser
} = require("../auth");


app.http("task-delete", {

    methods: ["DELETE"],
    authLevel: "anonymous",
    route: "tasks/{id}",

    handler: async (request, context) => {

        try {

            const currentUser =
                await getCurrentUser(request);

            if (!currentUser) {

                return {
                    status: 401,
                    jsonBody: {
                        success: false,
                        message: "Authentication required"
                    }
                };
            }

            const taskId =
                Number(request.params.id);

            if (
                !Number.isInteger(taskId) ||
                taskId <= 0
            ) {

                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Invalid task ID"
                    }
                };
            }

            const pool =
                await getDatabaseConnection();

            const result =
                await pool
                    .request()
                    .input(
                        "taskId",
                        sql.Int,
                        taskId
                    )
                    .input(
                        "ownerId",
                        sql.Int,
                        currentUser.user.id
                    )
                    .query(`
                        DELETE FROM Tasks

                        FROM Tasks

                        INNER JOIN Projects
                            ON Tasks.project_id = Projects.id

                        WHERE Tasks.id = @taskId
                        AND Projects.owner_id = @ownerId
                    `);

            if (result.rowsAffected[0] === 0) {

                return {
                    status: 404,
                    jsonBody: {
                        success: false,
                        message:
                            "Task not found or access denied"
                    }
                };
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message:
                        "Task deleted successfully"
                }
            };

        } catch (error) {

            context.error(
                "Task deletion error:",
                error
            );

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