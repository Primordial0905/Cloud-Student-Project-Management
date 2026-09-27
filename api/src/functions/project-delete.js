const { app } = require("@azure/functions");
const { getDatabaseConnection } = require("../database");

app.http("project-delete", {
    methods: ["DELETE"],
    authLevel: "anonymous",
    route: "projects/{id}",

    handler: async (request, context) => {
        try {
            const projectId = request.params.id;

            if (!projectId || isNaN(Number(projectId))) {
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
                .input("projectId", Number(projectId))
                .query(`
                    DELETE FROM Projects
                    OUTPUT DELETED.id
                    WHERE id = @projectId
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
                    message: "Project deleted successfully",
                    project: result.recordset[0]
                }
            };

        } catch (error) {
            context.error("Project delete error:", error);

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