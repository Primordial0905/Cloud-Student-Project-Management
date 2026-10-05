const { app } = require("@azure/functions");

const {
    sql,
    getDatabaseConnection
} = require("../database");

const {
    getCurrentUser
} = require("../auth");


app.http("project-delete", {

    methods: ["DELETE"],
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
                        "id",
                        sql.Int,
                        projectId
                    )
                    .input(
                        "ownerId",
                        sql.Int,
                        currentUser.user.id
                    )
                    .query(`
                        DELETE FROM Projects

                        WHERE id = @id
                        AND owner_id = @ownerId
                    `);

            if (result.rowsAffected[0] === 0) {

                return {
                    status: 404,
                    jsonBody: {
                        success: false,
                        message:
                            "Project not found or access denied"
                    }
                };
            }

            return {

                status: 200,
                jsonBody: {
                    success: true,
                    message:
                        "Project deleted successfully"
                }
            };

        } catch (error) {

            context.error(
                "Project deletion error:",
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