import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alex Martin's Portfolio",
    short_name: "AlexMartin",
    description: "Software developer with expertise in graphics programming, web performance optimization, and full-stack application development.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1320",
    theme_color: "#0d1320",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
