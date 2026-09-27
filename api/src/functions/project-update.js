const { app } = require("@azure/functions");
const { getDatabaseConnection } = require("../database");

app.http("project-update", {
    methods: ['PUT'],
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

            const body = await request.json();
            
            if(!body.name){
                return {
                    status : 400,
                    jsonBody : {
                        success : false,
                        message : "Project name is required"
                    }
                };
            }

            const pool = await getDatabaseConnection();

            const result = await pool
                .request()
                .input("id", Number(id))
                .input("name", body.name)
                .input("description", body.description || NULL)
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
                    message : "Project Updated successfully",
                    project: result.recordset[0]
                }
            };

        } catch (error) {
            context.error("Project update error:", error);

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