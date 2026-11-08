import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import { publicUrl } from "@/lib/public-url";

const APP_NAME = "Sr.Smith";
const DESCRIPTION = "Elige qué construir, prepara el paquete y descárgalo.";
const SHARE_URL = "https://manu-alvarez.github.io/Agent-Sr-Smith/";
const SHARE_IMAGE = "https://manu-alvarez.github.io/Agent-Sr-Smith/og.jpg";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: DESCRIPTION },
      { name: "theme-color", content: "#070b09" },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SHARE_URL },
      { property: "og:image", content: SHARE_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Retrato de Sr.Smith, con código verde sobre el rostro." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: SHARE_IMAGE },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "32x32", href: publicUrl("/favicon-32.png") },
      { rel: "icon", type: "image/png", sizes: "192x192", href: publicUrl("/favicon-192.png") },
      { rel: "apple-touch-icon", href: publicUrl("/apple-touch-icon.png") },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: publicUrl("/manifest.webmanifest") },
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
