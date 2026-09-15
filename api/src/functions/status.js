const {app} = require('@azure/functions')

app.http('status', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'status',

    handler: async(request, context) => {
        return {
            status: 200,
            jsonBody: {
                success: true,
                message: "Cloud Student Project Manager API is working!!",
                service: 'Azure Functions'
            }
        };
    }
});