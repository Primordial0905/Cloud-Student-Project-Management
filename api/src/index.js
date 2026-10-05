const { app } = require("@azure/functions");

require("./functions/status");
require("./functions/db-test");

require("./functions/projects");
require("./functions/project");
require("./functions/project-update");
require("./functions/project-delete");

require("./functions/project-tasks");
require("./functions/task-create");
require("./functions/task-update");
require("./functions/task-delete");

require("./functions/auth-me");