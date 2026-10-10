
(async function () {
    const isLocal = [
        "localhost",
        "127.0.0.1"
    ].includes(window.location.hostname);

    if (!isLocal) {
        try {
            const response = await fetch("/.auth/me", {
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error("Authentication check failed");
            }

            const data = await response.json();
            const principal = data?.clientPrincipal;

            const isAuthenticated =
                principal &&
                principal.userRoles?.includes("authenticated");

            if (!isAuthenticated) {
                window.location.replace("/.auth/login/github");
                return;
            }
        } catch (error) {
            console.error("Authentication check failed:", error);

            window.location.replace("/.auth/login/github");
            return;
        }
    }

    // Only load the application after authentication succeeds.
    const script = document.createElement("script");
    script.src = "/app.js";
    document.body.appendChild(script);
})();
