import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import { publicUrl } from "@/lib/public-url";

const APP_NAME = "Sr.Smith";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#121614" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: publicUrl("/favicon.svg") },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: publicUrl("/__grok/manifest.webmanifest") },
      { rel: "apple-touch-icon", href: publicUrl("/__grok/icon-180.png") },
    ],
  }),
  component: () => (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
