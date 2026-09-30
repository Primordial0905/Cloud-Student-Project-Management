const { app } = require("@azure/functions");

app.http("status", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "status",

    handler: async (request, context) => {
        return {
            status: 200,
            jsonBody: {
                success: true,
                message: "Azure Function API is working"
            }
        };
    }
});