export const SCOPES = [
  "articles.read",
  "articles.write",
  "apis.all", // All API scopes
  "apis.read", // All read scopes
] as const;

export type Scope = (typeof SCOPES)[number];
export type ScopePreset = "all_access" | "read_only" | "restricted";

export const scopePresets = [
  {
    description: "full access to all resources",
    label: "All",
    value: "all_access",
  },
  {
    description: "read-only access to all resources",
    label: "Read Only",
    value: "read_only",
  },
  {
    description: "restricted access to some resources",
    label: "Restricted",
    value: "restricted",
  },
];

export const scopesToName = (scopes: string[]) => {
  if (scopes.includes("apis.all")) {
    return {
      description: "full access to all resources",
      name: "All access",
      preset: "all_access",
    };
  }

  if (scopes.includes("apis.read")) {
    return {
      description: "read-only access to all resources",
      name: "Read-only",
      preset: "read_only",
    };
  }

  return {
    description: "restricted access to some resources",
    name: "Restricted",
    preset: "restricted",
  };
};

export const expandScopes = (scopes: string[]): string[] => {
  if (scopes.includes("apis.all")) {
    // Return all scopes except any that start with "apis."
    return SCOPES.filter((scope) => !scope.startsWith("apis."));
  }

  if (scopes.includes("apis.read")) {
    // Return all read scopes except any that start with "apis."
    return SCOPES.filter((scope) => scope.endsWith(".read") && !scope.startsWith("apis."));
  }

  // For custom scopes, filter out any "apis." scopes
  return scopes.filter((scope) => !scope.startsWith("apis."));
};
