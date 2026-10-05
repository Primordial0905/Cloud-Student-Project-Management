const { app } = require("@azure/functions");

const {
    getCurrentUser
} = require("../auth");

app.http("auth-me", {

    methods: ["GET"],

    authLevel: "anonymous",

    route: "auth/me",

    handler: async (request, context) => {

        try {

            const currentUser =
                await getCurrentUser(request);

            if (!currentUser) {

                return {
                    status: 401,

                    jsonBody: {
                        success: false,
                        message:
                            "Authenticated user is not registered."
                    }
                };
            }

            return {
                status: 200,

                jsonBody: {
                    success: true,
                    user: {
                        id:
                            currentUser.user.id,
                        name:
                            currentUser.user.name,
                        email:
                            currentUser.user.email,
                        provider:
                            currentUser.principal.identityProvider,
                        github_id:
                            currentUser.user.github_id,
                        username:
                            currentUser.principal.userDetails,
                        roles:
                            currentUser.principal.userRoles
                    }
                }
            };

        } catch (error) {

            context.error(
                "Authentication lookup error:",
                error
            );

            return {

                status: 500,

                jsonBody: {
                    success: false,
                    message:
                        "Failed to identify current user."
                }
            };
        }
    }
});