
(async function () {
    const isLocal = [
        "localhost",
        "127.0.0.1"
    ].includes(window.location.hostname);

    function showMessage(title, message) {
        document.body.innerHTML = "";

        const container = document.createElement("main");
        container.style.cssText =
            "max-width:560px;margin:100px auto;padding:24px;" +
            "font-family:Arial,sans-serif;line-height:1.6;";

        const heading = document.createElement("h1");
        heading.textContent = title;

        const paragraph = document.createElement("p");
        paragraph.textContent = message;

        container.append(heading, paragraph);
        document.body.appendChild(container);
    }

    if (!isLocal) {
        try {
            const authResponse = await fetch("/.auth/me", {
                cache: "no-store"
            });

            if (!authResponse.ok) {
                throw new Error("Unable to check authentication.");
            }

            const authData = await authResponse.json();
            const principal = authData?.clientPrincipal;

            const authenticated =
                principal?.userRoles?.includes("authenticated");

            if (!authenticated) {
                window.location.replace(
                    "/.auth/login/github?post_login_redirect_uri=" +
                    encodeURIComponent(window.location.origin + "/")
                );
                return;
            }

            const userResponse = await fetch("/api/auth/me", {
                cache: "no-store"
            });

            if (userResponse.status === 401) {
                showMessage(
                    "Account not registered",
                    "You signed in with GitHub, but your account " +
                    "could not be matched to a registered application user. " +
                    "Please contact the application administrator."
                );
                return;
            }

            if (!userResponse.ok) {
                throw new Error(
                    "Unable to verify your application account."
                );
            }

            const userData = await userResponse.json();

            if (!userData.success || !userData.user) {
                showMessage(
                    "Account unavailable",
                    "Your application account could not be verified. " +
                    "Please try again later."
                );
                return;
            }

        } catch (error) {
            console.error("Authentication check failed:", error);

            showMessage(
                "Unable to verify login",
                "We couldn't verify your session. Please refresh the page " +
                "or try signing in again."
            );
            return;
        }
    }

    // Load the existing application only after checks pass.
    const script = document.createElement("script");
    script.src = "/app.js";
    script.onerror = function () {
        showMessage(
            "Application failed to load",
            "Please refresh the page and try again."
        );
    };

    document.body.appendChild(script);
})();
