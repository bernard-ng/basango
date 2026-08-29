import { queryOptions } from "@tanstack/react-query";

import { authClient } from "#dashboard/app/auth/auth-client";

export type ManagedUser = NonNullable<
  Awaited<ReturnType<typeof authClient.admin.listUsers>>["data"]
>["users"][number];

export type ManagedUsersQuery = {
  limit: number;
  page: number;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export function managedUsersQueryKey() {
  return ["better-auth", "admin", "users"] as const;
}

export function managedUsersQueryOptions({
  limit,
  page,
  search,
  sortBy,
  sortDirection,
}: ManagedUsersQuery) {
  const normalizedSearch = search?.trim() || undefined;

  return queryOptions({
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: {
          limit,
          offset: (page - 1) * limit,
          searchField: "email",
          searchOperator: "contains",
          searchValue: normalizedSearch,
          sortBy: sortBy ?? "createdAt",
          sortDirection: sortDirection ?? "desc",
        },
      });

      return requireAuthData(result, "Unable to load users.");
    },
    queryKey: [
      ...managedUsersQueryKey(),
      { limit, page, search: normalizedSearch, sortBy, sortDirection },
    ],
  });
}

export async function createManagedUser(input: {
  email: string;
  name: string;
  password: string;
  role: "admin" | "user";
}) {
  const result = await authClient.admin.createUser(input);

  return requireAuthData(result, "Unable to create user.");
}

export async function updateManagedUser(input: {
  email: string;
  name: string;
  role: "admin" | "user";
  userId: string;
}) {
  const result = await authClient.admin.updateUser({
    data: {
      email: input.email,
      name: input.name,
      role: input.role,
    },
    userId: input.userId,
  });

  return requireAuthData(result, "Unable to update user.");
}

export async function banManagedUser(input: {
  banExpiresIn?: number;
  banReason: string;
  userId: string;
}) {
  const result = await authClient.admin.banUser(input);

  return requireAuthData(result, "Unable to ban user.");
}

export async function unbanManagedUser(userId: string) {
  const result = await authClient.admin.unbanUser({ userId });

  return requireAuthData(result, "Unable to unban user.");
}

export async function revokeManagedUserSessions(userId: string) {
  const result = await authClient.admin.revokeUserSessions({ userId });

  return requireAuthData(result, "Unable to revoke user sessions.");
}

export async function setManagedUserPassword(userId: string, newPassword: string) {
  const result = await authClient.admin.setUserPassword({ newPassword, userId });

  return requireAuthData(result, "Unable to update user password.");
}

export async function deleteManagedUser(userId: string) {
  const result = await authClient.admin.removeUser({ userId });

  return requireAuthData(result, "Unable to delete user.");
}

function requireAuthData<T>(
  result: { data: T | null; error: { message?: string } | null },
  fallbackMessage: string,
): T {
  if (result.error) {
    throw new Error(result.error.message || fallbackMessage);
  }

  if (!result.data) {
    throw new Error(fallbackMessage);
  }

  return result.data;
}
