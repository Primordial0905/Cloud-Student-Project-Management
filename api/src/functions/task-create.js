const { app } = require("@azure/functions");

const {
    sql,
    getDatabaseConnection
} = require("../database");

const {
    getCurrentUser
} = require("../auth");


app.http("task-create", {

    methods: ["POST"],
    authLevel: "anonymous",
    route: "projects/{projectId}/tasks",

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

            const projectId =
                Number(request.params.projectId);

            if (
                !Number.isInteger(projectId) ||
                projectId <= 0
            ) {

                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Invalid project ID"
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

            const project =
                await pool
                    .request()
                    .input(
                        "projectId",
                        sql.Int,
                        projectId
                    )
                    .input(
                        "ownerId",
                        sql.Int,
                        currentUser.user.id
                    )
                    .query(`
                        SELECT id
                        FROM Projects
                        WHERE id = @projectId
                        AND owner_id = @ownerId
                    `);

            if (project.recordset.length === 0) {

                return {
                    status: 404,
                    jsonBody: {
                        success: false,
                        message:
                            "Project not found or access denied"
                    }
                };
            }

            let assignedTo = null;

            if (
                body.assigned_to !== undefined &&
                body.assigned_to !== null &&
                body.assigned_to !== ""
            ) {

                assignedTo =
                    Number(body.assigned_to);


                if (
                    !Number.isInteger(assignedTo) ||
                    assignedTo <= 0
                ) {

                    return {
                        status: 400,
                        jsonBody: {
                            success: false,
                            message:
                                "Invalid assigned user ID"
                        }
                    };
                }

                const user =
                    await pool
                        .request()
                        .input(
                            "userId",
                            sql.Int,
                            assignedTo
                        )
                        .query(`
                            SELECT id
                            FROM Users
                            WHERE id = @userId
                        `);

                if (user.recordset.length === 0) {

                    return {
                        status: 400,
                        jsonBody: {
                            success: false,
                            message:
                                "Assigned user does not exist"
                        }
                    };
                }
            }

            const result =
                await pool
                    .request()
                    .input(
                        "projectId",
                        sql.Int,
                        projectId
                    )
                    .input(
                        "assignedTo",
                        sql.Int,
                        assignedTo
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
                        "dueDate",
                        sql.Date,
                        body.due_date || null
                    )
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
                    message:
                        "Task created successfully",
                    task:
                        result.recordset[0]
                }
            };

        } catch (error) {

            context.error(
                "Task creation error:",
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