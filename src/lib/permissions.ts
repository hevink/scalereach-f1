/**
 * Permission definitions for workspace roles
 * Organized by category for better management
 */

export const PERMISSIONS = {
  // Task-level permissions
  TASK: {
    CREATE: "task.create",
    EDIT: "task.edit",
    DELETE: "task.delete",
    ASSIGN: "task.assign",
    CHANGE_STATUS: "task.change_status",
    COMMENT: "task.comment",
    ATTACH_FILES: "task.attach_files",
    SET_DUE_DATE: "task.set_due_date",
    SET_PRIORITY: "task.set_priority",
  },
  // Project-level permissions
  PROJECT: {
    CREATE: "project.create",
    EDIT: "project.edit",
    DELETE: "project.delete",
    ARCHIVE: "project.archive",
    MANAGE_MEMBERS: "project.manage_members",
    CONFIGURE_SETTINGS: "project.configure_settings",
    VIEW_ANALYTICS: "project.view_analytics",
  },
  // Workspace-level permissions
  WORKSPACE: {
    INVITE_MEMBERS: "workspace.invite_members",
    MANAGE_ROLES: "workspace.manage_roles",
    MANAGE_MEMBERS: "workspace.manage_members",
    VIEW_ANALYTICS: "workspace.view_analytics",
    EXPORT_DATA: "workspace.export_data",
    CONFIGURE_NOTIFICATIONS: "workspace.configure_notifications",
    MANAGE_SETTINGS: "workspace.manage_settings",
    DELETE_WORKSPACE: "workspace.delete_workspace",
    MANAGE_BILLING: "workspace.manage_billing",
  },
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];

export type PermissionKey = Permission;

export const PERMISSION_CATEGORIES = [
  {
    label: "Tasks",
    permissions: [
      { key: PERMISSIONS.TASK.CREATE, label: "Create tasks" },
      { key: PERMISSIONS.TASK.EDIT, label: "Edit tasks" },
      { key: PERMISSIONS.TASK.DELETE, label: "Delete tasks" },
      { key: PERMISSIONS.TASK.ASSIGN, label: "Assign tasks" },
      { key: PERMISSIONS.TASK.CHANGE_STATUS, label: "Change task status" },
      { key: PERMISSIONS.TASK.COMMENT, label: "Comment on tasks" },
      { key: PERMISSIONS.TASK.ATTACH_FILES, label: "Attach files to tasks" },
      { key: PERMISSIONS.TASK.SET_DUE_DATE, label: "Set due dates" },
      { key: PERMISSIONS.TASK.SET_PRIORITY, label: "Set priorities" },
    ],
  },
  {
    label: "Projects",
    permissions: [
      { key: PERMISSIONS.PROJECT.CREATE, label: "Create projects" },
      { key: PERMISSIONS.PROJECT.EDIT, label: "Edit projects" },
      { key: PERMISSIONS.PROJECT.DELETE, label: "Delete projects" },
      { key: PERMISSIONS.PROJECT.ARCHIVE, label: "Archive projects" },
      {
        key: PERMISSIONS.PROJECT.MANAGE_MEMBERS,
        label: "Manage project members",
      },
      {
        key: PERMISSIONS.PROJECT.CONFIGURE_SETTINGS,
        label: "Configure project settings",
      },
      {
        key: PERMISSIONS.PROJECT.VIEW_ANALYTICS,
        label: "View project analytics",
      },
    ],
  },
  {
    label: "Workspace",
    permissions: [
      { key: PERMISSIONS.WORKSPACE.INVITE_MEMBERS, label: "Invite members" },
      { key: PERMISSIONS.WORKSPACE.MANAGE_ROLES, label: "Manage roles" },
      { key: PERMISSIONS.WORKSPACE.MANAGE_MEMBERS, label: "Manage members" },
      {
        key: PERMISSIONS.WORKSPACE.VIEW_ANALYTICS,
        label: "View workspace analytics",
      },
      { key: PERMISSIONS.WORKSPACE.EXPORT_DATA, label: "Export data" },
      {
        key: PERMISSIONS.WORKSPACE.CONFIGURE_NOTIFICATIONS,
        label: "Configure notifications",
      },
      {
        key: PERMISSIONS.WORKSPACE.MANAGE_SETTINGS,
        label: "Manage workspace settings",
      },
      {
        key: PERMISSIONS.WORKSPACE.DELETE_WORKSPACE,
        label: "Delete workspace",
      },
      { key: PERMISSIONS.WORKSPACE.MANAGE_BILLING, label: "Manage billing" },
    ],
  },
] as const;

export const DEFAULT_ROLE_PERMISSIONS = {
  owner: [
    // All permissions
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.EDIT,
    PERMISSIONS.TASK.DELETE,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.CHANGE_STATUS,
    PERMISSIONS.TASK.COMMENT,
    PERMISSIONS.TASK.ATTACH_FILES,
    PERMISSIONS.TASK.SET_DUE_DATE,
    PERMISSIONS.TASK.SET_PRIORITY,
    PERMISSIONS.PROJECT.CREATE,
    PERMISSIONS.PROJECT.EDIT,
    PERMISSIONS.PROJECT.DELETE,
    PERMISSIONS.PROJECT.ARCHIVE,
    PERMISSIONS.PROJECT.MANAGE_MEMBERS,
    PERMISSIONS.PROJECT.CONFIGURE_SETTINGS,
    PERMISSIONS.PROJECT.VIEW_ANALYTICS,
    PERMISSIONS.WORKSPACE.INVITE_MEMBERS,
    PERMISSIONS.WORKSPACE.MANAGE_ROLES,
    PERMISSIONS.WORKSPACE.MANAGE_MEMBERS,
    PERMISSIONS.WORKSPACE.VIEW_ANALYTICS,
    PERMISSIONS.WORKSPACE.EXPORT_DATA,
    PERMISSIONS.WORKSPACE.CONFIGURE_NOTIFICATIONS,
    PERMISSIONS.WORKSPACE.MANAGE_SETTINGS,
    PERMISSIONS.WORKSPACE.DELETE_WORKSPACE,
    PERMISSIONS.WORKSPACE.MANAGE_BILLING,
  ] as PermissionKey[],
  admin: [
    // All permissions except billing and delete workspace
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.EDIT,
    PERMISSIONS.TASK.DELETE,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.CHANGE_STATUS,
    PERMISSIONS.TASK.COMMENT,
    PERMISSIONS.TASK.ATTACH_FILES,
    PERMISSIONS.TASK.SET_DUE_DATE,
    PERMISSIONS.TASK.SET_PRIORITY,
    PERMISSIONS.PROJECT.CREATE,
    PERMISSIONS.PROJECT.EDIT,
    PERMISSIONS.PROJECT.DELETE,
    PERMISSIONS.PROJECT.ARCHIVE,
    PERMISSIONS.PROJECT.MANAGE_MEMBERS,
    PERMISSIONS.PROJECT.CONFIGURE_SETTINGS,
    PERMISSIONS.PROJECT.VIEW_ANALYTICS,
    PERMISSIONS.WORKSPACE.INVITE_MEMBERS,
    PERMISSIONS.WORKSPACE.MANAGE_ROLES,
    PERMISSIONS.WORKSPACE.MANAGE_MEMBERS,
    PERMISSIONS.WORKSPACE.VIEW_ANALYTICS,
    PERMISSIONS.WORKSPACE.EXPORT_DATA,
    PERMISSIONS.WORKSPACE.CONFIGURE_NOTIFICATIONS,
    PERMISSIONS.WORKSPACE.MANAGE_SETTINGS,
  ] as PermissionKey[],
  manager: [
    // Project and task management
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.EDIT,
    PERMISSIONS.TASK.DELETE,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.CHANGE_STATUS,
    PERMISSIONS.TASK.COMMENT,
    PERMISSIONS.TASK.ATTACH_FILES,
    PERMISSIONS.TASK.SET_DUE_DATE,
    PERMISSIONS.TASK.SET_PRIORITY,
    PERMISSIONS.PROJECT.CREATE,
    PERMISSIONS.PROJECT.EDIT,
    PERMISSIONS.PROJECT.ARCHIVE,
    PERMISSIONS.PROJECT.MANAGE_MEMBERS,
    PERMISSIONS.PROJECT.CONFIGURE_SETTINGS,
    PERMISSIONS.PROJECT.VIEW_ANALYTICS,
    PERMISSIONS.WORKSPACE.VIEW_ANALYTICS,
  ] as PermissionKey[],
  member: [
    // Basic task and project access
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.EDIT,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.CHANGE_STATUS,
    PERMISSIONS.TASK.COMMENT,
    PERMISSIONS.TASK.ATTACH_FILES,
    PERMISSIONS.TASK.SET_DUE_DATE,
    PERMISSIONS.TASK.SET_PRIORITY,
  ] as PermissionKey[],
  guest: [
    // Read-only with optional commenting
    PERMISSIONS.TASK.COMMENT,
  ] as PermissionKey[],
} satisfies Record<string, PermissionKey[]>;
