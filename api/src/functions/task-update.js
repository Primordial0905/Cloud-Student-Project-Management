const { app } = require("@azure/functions");

const {
    sql,
    getDatabaseConnection
} = require("../database");

const {
    getCurrentUser
} = require("../auth");


app.http("task-update", {

    methods: ["PUT"],
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

            let body;

            try {
                body = await request.json();
            } catch {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Request body must contain valid JSON"
                    }
                };
            }

            if (
                typeof body.title !== "string" ||
                !body.title.trim() ||
                body.title.trim().length > 200
            ) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Task title is required and must be at most 200 characters"
                    }
                };
            }

            const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
            const validPriorities = ["LOW", "MEDIUM", "HIGH"];

            const status = body.status === undefined ? "TODO" : body.status;
            const priority = body.priority === undefined ? "MEDIUM" : body.priority;

            if (typeof status !== "string" || !validStatuses.includes(status)) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Invalid task status. Allowed values: TODO, IN_PROGRESS, DONE"
                    }
                };
            }

            if (typeof priority !== "string" || !validPriorities.includes(priority)) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Invalid task priority. Allowed values: LOW, MEDIUM, HIGH"
                    }
                };
            }

            if (
                body.description !== undefined &&
                body.description !== null &&
                typeof body.description !== "string"
            ) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Description must be a string"
                    }
                };
            }

            if (
                body.due_date !== undefined &&
                body.due_date !== null &&
                body.due_date !== ""
            ) {
                const date = body.due_date;
                const parsed = typeof date === "string" &&
                    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
                    !Number.isNaN(Date.parse(date)) &&
                    new Date(date).toISOString().slice(0, 10) === date;
            
                if (!parsed) {
                    return {
                        status: 400,
                        jsonBody: {
                            success: false,
                            message: "Invalid due date. Use YYYY-MM-DD."
                        }
                    };
                }
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
                    .input(
                        "title",
                        sql.NVarChar(200),
                        body.title.trim()
                    )
                    .input(
                        "description",
                        sql.NVarChar(sql.MAX),
                        body.description || null
                    )
                    .input(
                        "status",
                        sql.NVarChar(20),
                        status
                    )
                    .input(
                        "priority",
                        sql.NVarChar(20),
                        priority
                    )
                    .input(
                        "assignedTo",
                        sql.Int,
                        body.assigned_to || null
                    )
                    .input(
                        "dueDate",
                        sql.Date,
                        body.due_date || null
                    )
                    .query(`
                        UPDATE Tasks

                        SET
                            title = @title,
                            description = @description,
                            status = @status,
                            priority = @priority,
                            assigned_to = @assignedTo,
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

                        FROM Tasks

                        INNER JOIN Projects
                            ON Tasks.project_id = Projects.id

                        WHERE Tasks.id = @taskId
                        AND Projects.owner_id = @ownerId
                    `);

            if (result.recordset.length === 0) {

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
                        "Task updated successfully",
                    task:
                        result.recordset[0]
                }
            };

        } catch (error) {

            context.error(
                "Task update error:",
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