const { app } = require("@azure/functions");

const {
    sql,
    getDatabaseConnection
} = require("../database");

const {
    getCurrentUser
} = require("../auth");

app.http("project", {

    methods: ["GET"],
    authLevel: "anonymous",
    route: "projects/{id}",

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
                Number(request.params.id);

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

            const result =
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
                        SELECT
                            id,
                            name,
                            description,
                            owner_id,
                            created_at,
                            updated_at
                        FROM Projects
                        WHERE id = @projectId
                        AND owner_id = @ownerId
                    `);

            if (result.recordset.length === 0) {

                return {
                    status: 404,
                    jsonBody: {
                        success: false,
                        message: "Project not found"
                    }
                };
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    project:
                        result.recordset[0]
                }
            };

        } catch (error) {

            context.error(
                "Project retrieval error:",
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