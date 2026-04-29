// Authentication and Authorization Types

export type UserRole = 'admin' | 'sub-admin' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

// Role permissions
export const RolePermissions: Record<UserRole, string[]> = {
  admin: [
    'view_dashboard',
    'upload_data',
    'run_predictions',
    'view_analytics',
    'manage_users',
    'manage_settings',
    'export_data',
    'delete_data',
    'view_api_keys',
    'manage_integrations',
    'view_mongo_explorer'
  ],
  // Sub-admin has all permissions EXCEPT manage_users (cannot promote/delete users)
  'sub-admin': [
    'view_dashboard',
    'upload_data',
    'run_predictions',
    'view_analytics',
    'manage_settings',
    'export_data',
    'delete_data',
    'view_api_keys',
    'manage_integrations',
    'view_mongo_explorer'
  ],
  analyst: [
    'view_dashboard',
    'upload_data',
    'run_predictions',
    'view_analytics',
    'export_data'
  ],
  viewer: [
    'view_dashboard',
    'view_analytics'
  ]
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}

export function canAccess(role: UserRole, requiredPermissions: string[]): boolean {
  return requiredPermissions.every(perm => hasPermission(role, perm));
}
