import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { QuranAudioProvider } from "@/components/quran/audio";
import { useApplyTheme } from "@/lib/store";
import appCss from "../styles.css?url";

const APP_NAME = "المصحف";

const THEME_BOOT = `try{var raw=localStorage.getItem("mushaf");var theme="night";if(raw){var p=JSON.parse(raw);if(p.state&&p.state.theme==="day")theme="day";}document.documentElement.dataset.theme=theme;}catch(e){}`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: "مصحف للقراءة والاستماع برواية حفص عن عاصم" },
      { name: "theme-color", content: "#0e1411" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: Root,
});

function Root() {
  useApplyTheme();
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <QuranAudioProvider>
            <Outlet />
          </QuranAudioProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
