const {app} = require("@azure/functions")
const {getDatabaseConnection} = require ("../database")

app.http("projects", {
    methods: ['GET','POST'],
    authlevel : "anonymous",
    route : "projects",

    handler: async (request, context) => {
        try {
            const pool = await getDatabaseConnection();

            if (request.method === "GET"){
                const result = await pool
                    .request()
                    .query(`
                        SELECT
                            id,
                            name,
                            description,
                            owner_id,
                            created_at,
                            updated_at
                        FROM Projects
                        ORDER BY created_at DESC
                        `);

                return {
                    status : 200,
                    jsonBody : {
                        status : true,
                        projects : result.recordset
                    }
                };
            }

            if (request.method === "POST") {
                const body = await request.json();

                if(!body.name || !body.owner_id){
                    return {
                        status : 400,
                        jsonBody : {
                            success : false,
                            message : "name and owner id are required!"
                        }
                    };
                }

                const result = await pool
                    .request()
                    .input("name", body.name)
                    .input("description", body.description || null)
                    .input("owner_id", body.owner_id)
                    .query(`
                        INSERT INTO Projects
                            (name, description, owner_id)
                        OUTPUT
                            INSERTED.id,
                            INSERTED.name,
                            INSERTED.description,
                            INSERTED.owner_id,
                            INSERTED.created_at,
                            INSERTED.updated_at
                        VALUES
                            (@name, @description, @owner_id)
                    `);

                return {
                    status: 201,
                    jsonBody: {
                        success: true,
                        message: "Project created successfully",
                        project: result.recordset[0]
                    }
                };
            }
        } catch (error) {
            context.error("Project API Error: ",error);

            return {
                status: 500,
                jsonBody: {
                    success : false,
                    message : "Internal Server Error"
                }
            };
        }
    }
});