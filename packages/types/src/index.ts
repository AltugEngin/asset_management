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

export interface MachineName {
  id: number;
  name: string;
  createdAt: string;
}

export interface MachineLocation {
  id: number;
  name: string;
  createdAt: string;
}

export interface MachineManufacturer {
  id: number;
  name: string;
  createdAt: string;
}

export interface Machine {
  id: number;
  code: string;
  nameId: number;
  name: string;
  description: string | null;
  locationId: number | null;
  location: string | null;
  status: MachineStatus;
  manufacturerId: number | null;
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
  password?: string;
}

export interface CreateMachineDto {
  code: string;
  nameId: number;
  description?: string;
  locationId?: number;
  status?: MachineStatus;
  manufacturerId?: number;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
}

export interface UpdateMachineDto {
  code?: string;
  nameId?: number;
  description?: string;
  locationId?: number;
  status?: MachineStatus;
  manufacturerId?: number;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
}

export interface CreateLookupDto {
  name: string;
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
export const CAN_MANAGE_LOOKUPS: UserRole[] = ["admin"];

// ─── OPC UA / Readings ────────────────────────────────────────────────────────

export type ReadingTag =
  | "güç"
  | "tüketim"
  | "sıcaklık"
  | "vibrasyon"
  | "üretim";

export const READING_TAGS: ReadingTag[] = [
  "güç",
  "tüketim",
  "sıcaklık",
  "vibrasyon",
  "üretim",
];

export const TAG_LABELS: Record<
  ReadingTag,
  { label: string; unit: string; color: string }
> = {
  güç: { label: "Güç", unit: "kW", color: "#3b82f6" },
  tüketim: { label: "Tüketim", unit: "litre/h", color: "#10b981" },
  sıcaklık: { label: "Sıcaklık", unit: "°C", color: "#f97316" },
  vibrasyon: { label: "Vibrasyon", unit: "mm/s", color: "#8b5cf6" },
  üretim: { label: "Üretim", unit: "adet", color: "#06b6d4" },
};

export interface MachineReading {
  time: string;
  value: number;
}

export type LatestReadings = Partial<
  Record<ReadingTag, { value: number; time: string }>
>;
