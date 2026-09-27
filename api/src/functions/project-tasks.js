const {app} = require ("@azure/functions");
const { getDatabaseConnection } = require("../database");

app.http("project-tasks", {
    methods : ["GET"],
    authlevel : "anonymus",
    route : "projects/{projectId}/tasks",

    handler : async (request, context) =>{
        try {
            const projectId = request.params.projectId;

            if(!projectId || isNaN(Number(projectId))){
                return {
                    status : 400,
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
                    SELECT
                        t.id,
                        t.project_id,
                        t.assigned_to,
                        u.name as assigned_user,
                        t.title,
                        t.description,
                        t.status,
                        t.priority,
                        t.due_date,
                        t.created_at,
                        t.updated_at
                    FROM tasks t
                    LEFT JOIN Users u
                        on t.assigned_to = u.id
                    WHERE t.project_id = @projectId
                    ORDER BY t.created_at DESC
                `);

            return {
                status : 200,
                jsonBody: {
                    success :true,
                    project_id : Number(projectId),
                    tasks : result.recordset
                }
            };

        } catch (error) {
            context.error("Task retrieval error: ", error);

            return {
                status: 500,
                jsonBody : {
                    success : false,
                    message : "Internal server error"
                }
            };
        }

    }
});