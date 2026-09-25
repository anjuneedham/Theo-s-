import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Theo's Restaurant & Lounge",
    short_name: "Theo's",
    description: "Order from Theo's and the Theo's Delivery Network.",
    start_url: "/?source=pwa",
    display: "standalone",
    background_color: "#1a1310",
    theme_color: "#1a1310",
    orientation: "portrait",
    categories: ["food", "shopping", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Order now", url: "/order", description: "Start a Theo's order" },
      { name: "My orders", url: "/account/orders" },
    ],
  };
}
