// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole =
  | "admin"
  | "direktör"
  | "müdür"
  | "şef"
  | "mühendis";

export type MachineStatus = "aktif" | "pasif" | "bakımda";

// ─── Entities ────────────────────────────────────────────────────────────────

export interface UserGroup {
  id: number;
  name: UserRole;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  groupId: number;
  group?: UserGroup;
  createdAt: string;
  updatedAt: string;
}

export interface Machine {
  id: number;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  status: MachineStatus;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthPayload {
  token: string;
  user: Omit<User, "createdAt" | "updatedAt"> & { group: UserGroup };
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  groupId: number;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  groupId?: number;
  isActive?: boolean;
}

export interface CreateMachineDto {
  code: string;
  name: string;
  description?: string;
  location?: string;
  status?: MachineStatus;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
}

export interface UpdateMachineDto {
  code?: string;
  name?: string;
  description?: string;
  location?: string;
  status?: MachineStatus;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
}

// ─── API Response Envelopes ───────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Role Permission Helpers ──────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  direktör: 4,
  müdür: 3,
  şef: 2,
  mühendis: 1,
};

export const CAN_MANAGE_USERS: UserRole[] = ["admin"];
export const CAN_VIEW_USERS: UserRole[] = ["admin", "direktör", "müdür"];
export const CAN_CREATE_MACHINE: UserRole[] = ["admin", "müdür"];
export const CAN_EDIT_MACHINE: UserRole[] = ["admin", "müdür", "şef"];
export const CAN_DELETE_MACHINE: UserRole[] = ["admin"];
