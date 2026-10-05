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

            const body =
                await request.json();

            if (
                !body.title ||
                !body.title.trim()
            ) {

                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Task title is required"
                    }
                };
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
                        body.status || "TODO"
                    )
                    .input(
                        "priority",
                        sql.NVarChar(20),
                        body.priority || "MEDIUM"
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