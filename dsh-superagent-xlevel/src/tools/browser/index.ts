export interface BrowserRequest {
  url: string;
  allowed: false;
  reason: string;
}

export function requestNavigation(url: string, mode: "strict-local" | "local-runtime"): BrowserRequest {
  return {
    url,
    allowed: false,
    reason: mode === "strict-local" ? "strict-local no navega" : "el navegador exige un adaptador y aprobación",
  };
}
