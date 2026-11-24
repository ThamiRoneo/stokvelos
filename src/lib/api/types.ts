export type Result<T> = { ok: true; data: T } | { ok: false; message: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(message: string): Result<T> {
  return { ok: false, message };
}

type ErrorLike = { message?: string } | null | undefined;

/**
 * Auth errors are reworded to PRD copy; database exceptions deliberately carry
 * their exact SQL message through (BR6, BR7, BR2 all raise PRD wording).
 */
export function mapError(error: ErrorLike, fallback: string): string {
  const message = error?.message ?? "";
  if (/already registered|already exists|duplicate key|unique constraint/i.test(message))
    return "This email already has an account.";
  if (/invalid login credentials/i.test(message)) return "Invalid credentials.";
  if (/email not confirmed/i.test(message)) return "Please verify email.";
  if (/failed to fetch|network|fetch failed|ECONNRESET|ENOTFOUND/i.test(message))
    return "No connection.";
  if (
    /Cannot remove:|invite has expired|invite has already been used|Couldn't join|Only the organizer|Only members can raise|already exists\. Edit instead/i.test(
      message,
    )
  )
    return message;
  return fallback;
}

export type Frequency = "weekly" | "monthly";
export type Role = "organizer" | "member";

export type Stokvel = {
  id: string;
  name: string;
  description: string | null;
  contributionAmount: number;
  contributionFrequency: Frequency;
  rotationOrder: string[];
  createdAt: string;
};

export type Member = {
  id: string;
  userId: string;
  fullName: string;
  role: Role;
  status: string;
  joinedAt: string;
};

export type InvitePreview = {
  stokvelId: string;
  name: string;
  description: string | null;
  contributionAmount: number;
  contributionFrequency: Frequency;
  memberCount: number;
};

type StokvelRow = {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number | string;
  contribution_frequency: string;
  rotation_order: unknown;
  created_at: string;
};

type ProfileRow = { full_name: string | null } | { full_name: string | null }[] | null;

type MemberRow = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profiles: ProfileRow;
};

export function toStokvel(row: StokvelRow): Stokvel {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    contributionAmount: Number(row.contribution_amount),
    contributionFrequency: row.contribution_frequency as Frequency,
    rotationOrder: Array.isArray(row.rotation_order)
      ? (row.rotation_order as string[])
      : [],
    createdAt: row.created_at,
  };
}

export function toMember(row: MemberRow): Member {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    userId: row.user_id,
    fullName: profile?.full_name ?? "Member",
    role: row.role as Role,
    status: row.status,
    joinedAt: row.joined_at,
  };
}
