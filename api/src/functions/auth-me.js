const { app } = require("@azure/functions");

const {
    requireAuthenticatedUser
} = require("../auth");

app.http("auth-me", {

    methods: ["GET"],

    authLevel: "anonymous",

    route: "auth/me",

    handler: async (request, context) => {

        try {

            const principal =
                requireAuthenticatedUser(request);

            if (!principal) {

                return {
                    status: 401,

                    jsonBody: {
                        success: false,
                        message: "Authentication required"
                    }
                };
            }

            return {

                status: 200,

                jsonBody: {

                    success: true,

                    user: {

                        provider:
                            principal.identityProvider,

                        userId:
                            principal.userId,

                        username:
                            principal.userDetails,

                        roles:
                            principal.userRoles,

                        claims:
                            principal.claims || []
                    }
                }
            };

        } catch (error) {

            context.error(
                "Authentication error:",
                error
            );

            return {

                status: 500,

                jsonBody: {
                    success: false,
                    message: "Authentication processing failed",
                    error: error.message,
                    code: error.code || null
                }
            };
        }
    }
});