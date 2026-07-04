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
      image {
        url
      }
    }
  }
`;

/**
 * Inline the project image as a data URI so satori never fetches it itself —
 * a missing image or a failed fetch degrades to the text-only card instead of
 * failing the whole ImageResponse.
 */
async function fetchImageAsDataUri(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Satori (the renderer behind ImageResponse) needs raw font data — it can't
  // use web fonts. Read via join(process.cwd(), <literal>) so Vercel's file
  // tracing detects and bundles the TTFs with this route.
  const [medium, bold, data] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/SpaceGrotesk-Medium.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/SpaceGrotesk-Bold.ttf")),
    // Crawler-facing only (no admin variant of a share card), so always
    // served from the data cache.
    cmsQuery(PROJECT_QUERY, { slug: slug.toLowerCase() }, { cached: true })
  ]);

  const project = data.projects[0];
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  const image = await fetchImageAsDataUri(project.image?.url);

  const title: string = project.title ?? "";
  const rawDescription: string = project.description ?? "";
  // Clamp in JS (satori has no reliable line clamping). With the image panel
  // the text column is narrower, so clamp harder to keep it to ~3 lines.
  const maxDescription = image ? 120 : 150;
  const description =
    rawDescription.length > maxDescription
      ? `${rawDescription.slice(0, maxDescription - 3).trimEnd()}…`
      : rawDescription;
  const tags: string[] = (project.tags ?? []).slice(0, 4);

  // The text column loses ~490px of width to the image panel, so both size
  // ramps drop a step when it's present.
  const titleSize = image
    ? (title.length > 22 ? 48 : 60)
    : (title.length > 26 ? 64 : 84);

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

        {/* Middle: text column, with the 2:1 project image beside it when set */}
        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", gap: 52 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                fontSize: titleSize,
                fontWeight: 700,
                color: TEXT,
                lineHeight: 1.1,
                letterSpacing: "-0.015em"
              }}
            >
              {title}
            </div>
            {description && (
              <div
                style={{
                  marginTop: 24,
                  fontSize: image ? 26 : 30,
                  fontWeight: 500,
                  color: MUTED,
                  lineHeight: 1.4
                }}
              >
                {description}
              </div>
            )}
          </div>

          {image && (
            // Project images are always cropped 2:1 by the admin uploader, so a
            // fixed 440x220 panel shows them without distortion.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              width={440}
              height={220}
              style={{
                borderRadius: 16,
                border: "1px solid rgba(238, 242, 247, 0.16)",
                objectFit: "cover",
                flexShrink: 0
              }}
              alt=""
            />
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
