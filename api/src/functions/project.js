const { app } = require("@azure/functions");
const { getDatabaseConnection } = require("../database");

app.http("project", {
    methods: ['GET'],
    authLevel: "anonymous",
    route: "projects/{id}",

    handler: async (request, context) => {
        try {
            const id = request.params.id;

            if (!id || isNaN(Number(id))) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: "Invalid project ID"
                    }
                };
            }

            const pool = await getDatabaseConnection();

            const result = await pool
                .request()
                .input("id", Number(id))
                .query(`
                    SELECT
                        id,
                        name,
                        description,
                        owner_id,
                        created_at,
                        updated_at
                    FROM Projects
                    WHERE id = @id
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
                    project: result.recordset[0]
                }
            };

        } catch (error) {
            context.error("Project retrieval error:", error);

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