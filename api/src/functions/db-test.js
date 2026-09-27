const {app} = require("@azure/functions");
const {getDatabaseConnection} = require("../database");

app.http("db-test", {
    methods: ['GET'],
    authLevel : "anonymous",
    route : "db-test",

    handler: async (request, context) => {
        try {
            const pool = await getDatabaseConnection();

            const result = await pool
                .request()
                .query("SELECT 1 as result");

            return{
                status : 200,
                jsonBody: {
                    success: true,
                    database : process.env.SQL_Database,
                    message : "Database connection successful",
                    result : result.recordset[0].result
                }
            };
        } catch (error) {
            context.error("Database connection failed: ", error);

            return {
                status : 500,
                jsonBody : {
                    success : false,
                    message : "Database connection failed"
                } 
            };
        }
    }
});