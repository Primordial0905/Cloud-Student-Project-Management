const { app } = require("@azure/functions");

const {
    sql,
    getDatabaseConnection
} = require("../database");

const {
    getCurrentUser
} = require("../auth");

app.http("project-tasks", {

    methods: ["GET"],
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

            const result =
                await pool
                    .request()
                    .input(
                        "projectId",
                        sql.Int,
                        projectId
                    )
                    .query(`
                        SELECT
                            t.id,
                            t.project_id,
                            t.assigned_to,
                            u.name AS assigned_user,
                            t.title,
                            t.description,
                            t.status,
                            t.priority,
                            t.due_date,
                            t.created_at,
                            t.updated_at
                        FROM Tasks t

                        LEFT JOIN Users u
                            ON t.assigned_to = u.id

                        WHERE t.project_id = @projectId

                        ORDER BY
                            t.created_at DESC
                    `);

            return {

                status: 200,
                jsonBody: {
                    success: true,
                    project_id:
                        projectId,
                    tasks:
                        result.recordset
                }
            };


        } catch (error) {

            context.error(
                "Project tasks error:",
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