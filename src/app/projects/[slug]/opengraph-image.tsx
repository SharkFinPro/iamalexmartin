import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";
import { cmsQuery } from "@/lib/cms";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Project overview card";

// Palette mirrors the dark theme in src/styles/_themes.scss. Share cards render
// on external sites with no theme context, so they always use the dark look.
const BG = "#0d1320";
const TEXT = "#eef2f7";
const MUTED = "#98adc6";
const ACCENT = "#22c79a";
const ACCENT_SECONDARY = "#5a8cf0";

const PROJECT_QUERY = `
  query ProjectCard($slug: String!) {
    projects(where: { slug: $slug }) {
      title
      description
      tags
    }
  }
`;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Satori (the renderer behind ImageResponse) needs raw font data — it can't
  // use web fonts. Read via join(process.cwd(), <literal>) so Vercel's file
  // tracing detects and bundles the TTFs with this route.
  const [medium, bold, data] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/SpaceGrotesk-Medium.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/SpaceGrotesk-Bold.ttf")),
    cmsQuery(PROJECT_QUERY, { slug: slug.toLowerCase() })
  ]);

  const project = data.projects[0];
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  const title: string = project.title ?? "";
  const rawDescription: string = project.description ?? "";
  // Clamp in JS (satori has no reliable line clamping): ~150 chars ≈ two lines.
  const description =
    rawDescription.length > 150 ? `${rawDescription.slice(0, 147).trimEnd()}…` : rawDescription;
  const tags: string[] = (project.tags ?? []).slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BG,
          padding: "64px 72px 78px",
          fontFamily: "Space Grotesk",
          position: "relative"
        }}
      >
        {/* Wordmark, matching the site's NavBar logo */}
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
          <span style={{ color: TEXT }}>Alex</span>
          <span style={{ color: ACCENT }}>Martin</span>
        </div>

        {/* Title + description centered in the remaining space */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          <div
            style={{
              fontSize: title.length > 26 ? 64 : 84,
              fontWeight: 700,
              color: TEXT,
              lineHeight: 1.1,
              letterSpacing: "-0.015em"
            }}
          >
            {title}
          </div>
          {description && (
            <div style={{ marginTop: 24, fontSize: 30, fontWeight: 500, color: MUTED, lineHeight: 1.4 }}>
              {description}
            </div>
          )}
        </div>

        {/* Footer row: tag chips + domain */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "8px 18px",
                  border: "2px solid rgba(34, 199, 154, 0.45)",
                  borderRadius: 999,
                  color: ACCENT,
                  fontSize: 24,
                  fontWeight: 500
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", color: MUTED, fontSize: 24, fontWeight: 500 }}>
            www.iamalexmartin.com
          </div>
        </div>

        {/* Brand gradient base bar (the hero name gradient, green to blue) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 14,
            background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_SECONDARY})`
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: medium, weight: 500, style: "normal" },
        { name: "Space Grotesk", data: bold, weight: 700, style: "normal" }
      ]
    }
  );
}
