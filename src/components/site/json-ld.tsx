import { config } from "@/lib/config";
import type { MenuSection } from "@/lib/services/catalog";
import type { OperatingHours, Restaurant } from "@/lib/types";

const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function JsonLd({ data }: { data: object }) {
  // Escape "<" so user-editable content can't break out of the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function restaurantSchema(restaurant: Restaurant, hours: OperatingHours[], path = "/") {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${config.siteUrl}/#restaurant-${restaurant.slug}`,
    name: restaurant.name,
    description: restaurant.description ?? undefined,
    url: `${config.siteUrl}${path}`,
    telephone: restaurant.phone ?? undefined,
    email: restaurant.email ?? undefined,
    servesCuisine: ["Jamaican", "Caribbean"],
    priceRange: "$$",
    image: restaurant.cover_url ?? `${config.siteUrl}/opengraph-image`,
    menu: `${config.siteUrl}/menu`,
    acceptsReservations: false,
    hasMenu: `${config.siteUrl}/menu`,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address_line ?? undefined,
      addressLocality: restaurant.city ?? undefined,
      addressRegion: restaurant.parish ?? undefined,
      addressCountry: restaurant.country,
    },
    geo: restaurant.latitude != null ? { "@type": "GeoCoordinates", latitude: restaurant.latitude, longitude: restaurant.longitude } : undefined,
    openingHoursSpecification: hours
      .filter((h) => !h.is_closed)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: SCHEMA_DAYS[h.day_of_week], opens: h.opens_at, closes: h.closes_at })),
    aggregateRating: restaurant.rating_count > 0 ? { "@type": "AggregateRating", ratingValue: restaurant.rating_avg, reviewCount: restaurant.rating_count } : undefined,
    potentialAction: {
      "@type": "OrderAction",
      target: { "@type": "EntryPoint", urlTemplate: `${config.siteUrl}/order`, actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"] },
      deliveryMethod: ["http://purl.org/goodrelations/v1#DeliveryModePickUp", "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"],
    },
  };
}

export function RestaurantJsonLd({ restaurant, hours }: { restaurant: Restaurant; hours: OperatingHours[] }) {
  return <JsonLd data={restaurantSchema(restaurant, hours)} />;
}

export function MenuJsonLd({ restaurant, menu }: { restaurant: Restaurant; menu: MenuSection[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Menu",
        name: `${restaurant.name} Menu`,
        url: `${config.siteUrl}/menu`,
        inLanguage: "en",
        hasMenuSection: menu.map((s) => ({
          "@type": "MenuSection",
          name: s.name,
          description: s.description ?? undefined,
          hasMenuItem: s.items.map((i) => ({
            "@type": "MenuItem",
            name: i.name,
            description: i.description ?? undefined,
            image: i.image_url ?? undefined,
            suitableForDiet: i.dietary_tags.includes("vegan") ? "https://schema.org/VeganDiet" : i.dietary_tags.includes("vegetarian") ? "https://schema.org/VegetarianDiet" : undefined,
            offers: { "@type": "Offer", price: (i.price_cents / 100).toFixed(2), priceCurrency: restaurant.currency, availability: i.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
          })),
        })),
      }}
    />
  );
}

export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
      }}
    />
  );
}

export function EventsJsonLd({ restaurant, events }: { restaurant: Restaurant; events: { title: string; description: string | null; starts_at: string; ends_at: string | null }[] }) {
  return (
    <JsonLd
      data={events.map((e) => ({
        "@context": "https://schema.org",
        "@type": "Event",
        name: e.title,
        description: e.description ?? undefined,
        startDate: e.starts_at,
        endDate: e.ends_at ?? undefined,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: { "@type": "Place", name: restaurant.name, address: { "@type": "PostalAddress", addressLocality: restaurant.city, addressCountry: restaurant.country } },
        organizer: { "@type": "Organization", name: restaurant.name, url: config.siteUrl },
      }))}
    />
  );
}
