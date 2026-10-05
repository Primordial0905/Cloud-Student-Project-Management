const { app } = require("@azure/functions");

const {
    sql,
    getDatabaseConnection
} = require("../database");

const {
    getCurrentUser
} = require("../auth");


app.http("project-update", {

    methods: ["PUT"],
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

            const body =
                await request.json();

            if (
                !body.name ||
                !body.name.trim()
            ) {

                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Project name is required"
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
                    .input(
                        "name",
                        sql.NVarChar(150),
                        body.name.trim()
                    )
                    .input(
                        "description",
                        sql.NVarChar(sql.MAX),
                        body.description || null
                    )
                    .query(`
                        UPDATE Projects

                        SET
                            name = @name,
                            description = @description,
                            updated_at = GETUTCDATE()

                        OUTPUT
                            INSERTED.id,
                            INSERTED.name,
                            INSERTED.description,
                            INSERTED.owner_id,
                            INSERTED.created_at,
                            INSERTED.updated_at

                        WHERE id = @id
                        AND owner_id = @ownerId
                    `);

            if (result.recordset.length === 0) {

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
                        "Project updated successfully",
                    project:
                        result.recordset[0]
                }
            };

        } catch (error) {

            context.error(
                "Project update error:",
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