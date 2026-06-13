import type { MetadataRoute } from "next";

// Web App Manifest — declares Pricetag as a PWA so visitors can "Add to Home
// Screen" on iOS/Android. Daily mode pairs especially well with home-screen
// install (one round per day, streak mechanics, low friction).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pricetag — Guess the Housing Price",
    short_name: "Pricetag",
    description:
      "Real homes. Real prices. How close can you get? A real-estate price guessing game.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F4EE",
    theme_color: "#1A1A1A",
    orientation: "portrait",
    categories: ["games", "entertainment", "lifestyle"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
