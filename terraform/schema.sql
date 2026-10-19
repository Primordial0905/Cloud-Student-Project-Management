-- Schema for Simple Student Project Manager (Azure SQL)
-- Safe to run more than once: each object is created only if missing.

------------------------------------------------------------
-- Users
-- github_id stores the Static Web Apps "userId" from /.auth/me
-- (that is what auth.js matches against principal.userId).
------------------------------------------------------------
IF OBJECT_ID('dbo.Users', 'U') IS NULL
CREATE TABLE dbo.Users (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    name       NVARCHAR(100) NOT NULL,
    email      NVARCHAR(255) NULL,
    github_id  NVARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_Users_created DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_Users_updated DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Users_github_id UNIQUE (github_id)
);
GO

-- Email is optional (GitHub users can hide it), but unique when present.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Users_email' AND object_id = OBJECT_ID('dbo.Users'))
CREATE UNIQUE INDEX UX_Users_email ON dbo.Users (email) WHERE email IS NOT NULL;
GO

------------------------------------------------------------
-- Projects
------------------------------------------------------------
IF OBJECT_ID('dbo.Projects', 'U') IS NULL
CREATE TABLE dbo.Projects (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX) NULL,
    owner_id    INT NOT NULL,
    created_at  DATETIME2 NOT NULL CONSTRAINT DF_Projects_created DEFAULT GETUTCDATE(),
    updated_at  DATETIME2 NOT NULL CONSTRAINT DF_Projects_updated DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Projects_Owner FOREIGN KEY (owner_id) REFERENCES dbo.Users(id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Projects_owner_id' AND object_id = OBJECT_ID('dbo.Projects'))
CREATE INDEX IX_Projects_owner_id ON dbo.Projects (owner_id);
GO

------------------------------------------------------------
-- ProjectMembers
------------------------------------------------------------
IF OBJECT_ID('dbo.ProjectMembers', 'U') IS NULL
CREATE TABLE dbo.ProjectMembers (
    project_id INT NOT NULL,
    user_id    INT NOT NULL,
    role       NVARCHAR(20) NOT NULL CONSTRAINT DF_ProjectMembers_role DEFAULT 'member',
    joined_at  DATETIME2 NOT NULL CONSTRAINT DF_ProjectMembers_joined DEFAULT GETUTCDATE(),
    CONSTRAINT PK_ProjectMembers PRIMARY KEY (project_id, user_id),
    CONSTRAINT FK_ProjectMembers_Project FOREIGN KEY (project_id) REFERENCES dbo.Projects(id) ON DELETE CASCADE,
    CONSTRAINT FK_ProjectMembers_User FOREIGN KEY (user_id) REFERENCES dbo.Users(id) ON DELETE CASCADE
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProjectMembers_user_id' AND object_id = OBJECT_ID('dbo.ProjectMembers'))
CREATE INDEX IX_ProjectMembers_user_id ON dbo.ProjectMembers (user_id);
GO

------------------------------------------------------------
-- Tasks
------------------------------------------------------------
IF OBJECT_ID('dbo.Tasks', 'U') IS NULL
CREATE TABLE dbo.Tasks (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    project_id  INT NOT NULL,
    assigned_to INT NULL,
    title       NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL,
    status      NVARCHAR(20) NOT NULL CONSTRAINT DF_Tasks_status DEFAULT 'TODO',
    priority    NVARCHAR(20) NOT NULL CONSTRAINT DF_Tasks_priority DEFAULT 'MEDIUM',
    due_date    DATE NULL,
    created_at  DATETIME2 NOT NULL CONSTRAINT DF_Tasks_created DEFAULT GETUTCDATE(),
    updated_at  DATETIME2 NOT NULL CONSTRAINT DF_Tasks_updated DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Tasks_Project FOREIGN KEY (project_id) REFERENCES dbo.Projects(id) ON DELETE CASCADE,
    CONSTRAINT FK_Tasks_User FOREIGN KEY (assigned_to) REFERENCES dbo.Users(id),
    CONSTRAINT CK_Tasks_Status CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    CONSTRAINT CK_Tasks_Priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tasks_project_id' AND object_id = OBJECT_ID('dbo.Tasks'))
CREATE INDEX IX_Tasks_project_id ON dbo.Tasks (project_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tasks_assigned_to' AND object_id = OBJECT_ID('dbo.Tasks'))
CREATE INDEX IX_Tasks_assigned_to ON dbo.Tasks (assigned_to);
GO