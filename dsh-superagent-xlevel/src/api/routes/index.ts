export const ROUTES = [
  { method: "GET", path: "/health" },
  { method: "GET", path: "/v1/profiles" },
  { method: "GET", path: "/v1/modules" },
  { method: "POST", path: "/v1/runs" },
] as const;
