/**
 * Seed data for Theo's (the anchor restaurant) plus configuration defaults.
 *
 * IMPORTANT — everything below is SAMPLE content for development:
 *  - Menu items, prices, hours, contact details and delivery zones for Theo's are
 *    placeholders to be replaced with the restaurant's real information
 *    (editable in Partner → Menu / Profile / Hours / Delivery, no code changes).
 *  - Fee and commission rates are business-model ASSUMPTIONS, not recommendations;
 *    they are editable in Admin → Settings.
 *  - The partner restaurants are FICTIONAL demo listings that show how the
 *    marketplace behaves with more than one restaurant. Remove before launch.
 *  - No customer reviews are seeded. Testimonials only ever show real reviews.
 */
import type {
  DeliveryZone,
  LocalCredential,
  MenuCategory,
  MenuItem,
  Modifier,
  ModifierGroup,
  OperatingHours,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  Payment,
  PlatformSettings,
  Profile,
  Region,
  Restaurant,
  RestaurantCategory,
  RestaurantCategoryAssignment,
  RestaurantEvent,
  RestaurantUser,
  SubscriptionPlan,
  Promotion,
  Driver,
  Delivery,
  DeliveryAddress,
  TableMap,
  TableName,
} from "../types";
import { stableId as sid } from "../ids";
import { hashPassword } from "../auth/password";
import { computeTotals, priceLine, resolveCommissionBps } from "../pricing";

const SEED_EPOCH = "2026-01-01T00:00:00.000Z";
const J = (dollars: number) => Math.round(dollars * 100); // JMD → cents

export const DEMO_ACCOUNTS = [
  { email: "admin@theos.example", password: "Admin#2026demo", role: "admin", name: "Platform Admin" },
  { email: "owner@theos.example", password: "Owner#2026demo", role: "restaurant", name: "Theo's Manager" },
  { email: "partner@harbourcatch.example", password: "Partner#2026demo", role: "restaurant", name: "Harbour Catch Owner" },
  { email: "driver@theos.example", password: "Driver#2026demo", role: "driver", name: "Andre Campbell" },
  { email: "customer@theos.example", password: "Customer#2026demo", role: "customer", name: "Keisha Brown" },
] as const;

export const defaultSettings: PlatformSettings = {
  id: "default",
  platform_name: "Theo's Delivery Network",
  currency: "JMD",
  default_commission_bps: 1500, // ASSUMPTION: 15% for partner restaurants
  service_fee_bps: 500, // ASSUMPTION: 5% customer service fee on marketplace orders
  service_fee_min_cents: J(100),
  service_fee_max_cents: J(600),
  service_fee_on_anchor: false, // ordering direct from Theo's has no service fee
  tax_rate_bps: 1500, // ASSUMPTION: GCT 15%, menu prices tax-inclusive — confirm with accountant
  tax_inclusive: true,
  driver_base_payout_cents: J(250),
  driver_fee_share_bps: 6000,
  payment_methods: ["cash", "card_on_delivery", "online"],
  allow_guest_checkout: true,
  support_email: "hello@theos.example",
  support_phone: "+1 (876) 555-0142",
  updated_at: SEED_EPOCH,
};

const regions: Region[] = [
  { slug: "kingston-st-andrew", name: "Kingston & St. Andrew", sort: 1 },
  { slug: "st-catherine", name: "St. Catherine (Spanish Town & Portmore)", sort: 2 },
  { slug: "st-james", name: "St. James (Montego Bay)", sort: 3 },
  { slug: "st-ann", name: "St. Ann (Ocho Rios)", sort: 4 },
].map((r) => ({
  id: sid(`region:${r.slug}`),
  slug: r.slug,
  name: r.name,
  country: "JM",
  currency: "JMD",
  timezone: "America/Jamaica",
  is_active: true,
  sort_order: r.sort,
}));
const regionId = (slug: string) => sid(`region:${slug}`);

const restaurantCategories: RestaurantCategory[] = [
  "Jamaican",
  "Seafood",
  "Vegan & Ital",
  "Patties & Bakery",
  "Lounge & Bar",
  "Chinese",
  "Pizza",
  "Desserts",
  "Breakfast",
].map((name, i) => ({
  id: sid(`rcat:${name}`),
  slug: name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-"),
  name,
  sort_order: i,
}));
const rcat = (name: string) => sid(`rcat:${name}`);

const plans: SubscriptionPlan[] = [
  {
    id: sid("plan:starter"),
    slug: "starter",
    name: "Starter",
    description: "No monthly fee. Pay commission only on orders you receive.",
    monthly_fee_cents: 0,
    commission_rate_bps: 1800,
    features: ["Marketplace listing", "Online menu & ordering", "Order dashboard", "Weekly payouts"],
    is_active: true,
    sort_order: 1,
  },
  {
    id: sid("plan:growth"),
    slug: "growth",
    name: "Growth",
    description: "Lower commission for restaurants with steady volume.",
    monthly_fee_cents: J(15000),
    commission_rate_bps: 1400,
    features: ["Everything in Starter", "Promotions & discount codes", "Sales analytics", "Priority support"],
    is_active: true,
    sort_order: 2,
  },
  {
    id: sid("plan:pro"),
    slug: "pro",
    name: "Pro",
    description: "Lowest commission plus a monthly featured placement.",
    monthly_fee_cents: J(35000),
    commission_rate_bps: 1000,
    features: ["Everything in Growth", "Monthly featured placement", "Dedicated account manager"],
    is_active: true,
    sort_order: 3,
  },
];

function restaurant(r: Partial<Restaurant> & Pick<Restaurant, "slug" | "name">): Restaurant {
  return {
    id: sid(`restaurant:${r.slug}`),
    tagline: null,
    description: null,
    region_id: regionId("kingston-st-andrew"),
    phone: null,
    email: null,
    whatsapp: null,
    address_line: null,
    area: null,
    city: "Kingston",
    parish: "St. Andrew",
    country: "JM",
    latitude: null,
    longitude: null,
    timezone: "America/Jamaica",
    currency: "JMD",
    logo_url: null,
    cover_url: null,
    status: "active",
    is_anchor: false,
    is_featured: false,
    plan_id: sid("plan:starter"),
    commission_rate_bps: null,
    accepts_delivery: true,
    accepts_pickup: true,
    min_order_cents: 0,
    prep_time_minutes: 25,
    rating_avg: 0,
    rating_count: 0,
    social_instagram: null,
    social_facebook: null,
    social_tiktok: null,
    created_at: SEED_EPOCH,
    ...r,
  };
}

const THEOS = restaurant({
  slug: "theos",
  name: "Theo's Restaurant & Lounge",
  tagline: "Island soul food, late-night lounge.",
  description:
    "Theo's is a Jamaican restaurant and lounge serving slow-marinated jerk, rich Sunday stews and fresh seafood by day — and handcrafted rum cocktails, music and good company by night.",
  phone: "+1 (876) 555-0142",
  email: "hello@theos.example",
  whatsapp: "+18765550142",
  city: "Kingston",
  parish: "St. Andrew",
  // Placeholder coordinates (central Kingston) — set the real location in Partner → Profile.
  latitude: 18.0179,
  longitude: -76.8099,
  is_anchor: true,
  is_featured: true,
  plan_id: null,
  commission_rate_bps: 0, // Theo's own orders: no commission, Theo's keeps the full food revenue
  prep_time_minutes: 25,
  social_instagram: "https://instagram.com/",
  social_facebook: "https://facebook.com/",
});

const DEMO_PARTNERS: Restaurant[] = [
  restaurant({
    slug: "harbour-catch",
    name: "Harbour Catch",
    tagline: "Fresh fish, fried or steamed, the Port Royal way.",
    description: "Demo partner listing. Fried fish, bammy and festival, steamed fish with okra and crackers.",
    region_id: regionId("st-catherine"),
    city: "Portmore",
    parish: "St. Catherine",
    latitude: 17.955,
    longitude: -76.883,
    is_featured: true,
    plan_id: sid("plan:growth"),
    prep_time_minutes: 30,
    rating_avg: 0,
  }),
  restaurant({
    slug: "ital-garden",
    name: "Ital Garden Kitchen",
    tagline: "Plant-powered Rastafarian cooking.",
    description: "Demo partner listing. Ital stew, callaloo wraps and fresh juices — no meat, no salt added.",
    region_id: regionId("kingston-st-andrew"),
    city: "Kingston",
    parish: "St. Andrew",
    latitude: 18.03,
    longitude: -76.79,
    plan_id: sid("plan:starter"),
    prep_time_minutes: 20,
  }),
  restaurant({
    slug: "bay-patty-co",
    name: "Bay Patty Co.",
    tagline: "Flaky patties & coco bread, baked all day.",
    description: "Demo partner listing. Beef, chicken, callaloo and lobster patties with coco bread.",
    region_id: regionId("st-james"),
    city: "Montego Bay",
    parish: "St. James",
    latitude: 18.4762,
    longitude: -77.8939,
    accepts_delivery: true,
    plan_id: sid("plan:starter"),
    prep_time_minutes: 10,
  }),
];

const categoryAssignments: RestaurantCategoryAssignment[] = (
  [
    ["theos", ["Jamaican", "Lounge & Bar", "Seafood", "Breakfast"]],
    ["harbour-catch", ["Seafood", "Jamaican"]],
    ["ital-garden", ["Vegan & Ital", "Jamaican"]],
    ["bay-patty-co", ["Patties & Bakery", "Breakfast"]],
  ] as const
).flatMap(([slug, cats]) =>
  cats.map((c) => ({ id: sid(`rca:${slug}:${c}`), restaurant_id: sid(`restaurant:${slug}`), category_id: rcat(c) })),
);

function hours(slug: string, spec: [day: number, open: string, close: string][]): OperatingHours[] {
  return [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const s = spec.find((x) => x[0] === d);
    return {
      id: sid(`hours:${slug}:${d}`),
      restaurant_id: sid(`restaurant:${slug}`),
      day_of_week: d,
      opens_at: s?.[1] ?? "00:00",
      closes_at: s?.[2] ?? "00:00",
      is_closed: !s,
    };
  });
}

// SAMPLE hours — lounge stays open late Friday & Saturday.
const operatingHours: OperatingHours[] = [
  ...hours("theos", [
    [0, "10:00", "21:00"],
    [1, "11:00", "22:00"],
    [2, "11:00", "22:00"],
    [3, "11:00", "22:00"],
    [4, "11:00", "23:00"],
    [5, "11:00", "02:00"],
    [6, "10:00", "02:00"],
  ]),
  ...hours("harbour-catch", [1, 2, 3, 4, 5, 6, 0].map((d) => [d, "11:00", "21:00"] as [number, string, string])),
  ...hours("ital-garden", [1, 2, 3, 4, 5, 6].map((d) => [d, "09:00", "19:00"] as [number, string, string])),
  ...hours("bay-patty-co", [0, 1, 2, 3, 4, 5, 6].map((d) => [d, "07:00", "20:00"] as [number, string, string])),
];

// ---------------------------------------------------------------- menus
interface ModSpec {
  name: string;
  min: number;
  max: number;
  options: [name: string, dollars: number, isDefault?: boolean][];
}
interface ItemSpec {
  name: string;
  description: string;
  price: number;
  featured?: boolean;
  tags?: string[];
  spice?: number;
  mods?: ModSpec[];
  unavailable?: boolean;
}
interface CategorySpec {
  name: string;
  description?: string;
  window?: [string, string];
  items: ItemSpec[];
}

const SIDE_CHOICE: ModSpec = {
  name: "Choose your side",
  min: 1,
  max: 1,
  options: [
    ["Rice & Peas", 0, true],
    ["White Rice", 0],
    ["Festival (2)", 0],
    ["Roast Breadfruit", 150],
    ["Bammy", 100],
  ],
};
const ADD_ONS: ModSpec = {
  name: "Add-ons",
  min: 0,
  max: 5,
  options: [
    ["Extra Festival", 300],
    ["Steamed Vegetables", 350],
    ["Fried Ripe Plantain", 400],
    ["Coleslaw", 250],
    ["Extra Gravy", 150],
  ],
};
const HEAT: ModSpec = {
  name: "Heat level",
  min: 1,
  max: 1,
  options: [
    ["Mild", 0],
    ["Regular", 0, true],
    ["Scotch Bonnet Hot", 0],
  ],
};
const DRINK_SIZE: ModSpec = {
  name: "Size",
  min: 1,
  max: 1,
  options: [
    ["Regular (12oz)", 0, true],
    ["Large (20oz)", 250],
  ],
};

const THEOS_MENU: CategorySpec[] = [
  {
    name: "Breakfast",
    description: "Served 7:00am – 11:30am.",
    window: ["07:00", "11:30"],
    items: [
      {
        name: "Ackee & Saltfish",
        description: "Jamaica's national dish, sautéed with onion, tomato and sweet pepper. Served with fried dumplings and boiled banana.",
        price: 1650,
        featured: true,
        mods: [{ name: "Swap your side", min: 1, max: 1, options: [["Fried Dumplings & Banana", 0, true], ["Hard Dough Bread", 0], ["Roast Breadfruit", 150]] }],
      },
      {
        name: "Callaloo & Saltfish",
        description: "Steamed callaloo with flaked saltfish, served with fried dumplings.",
        price: 1450,
      },
      {
        name: "Mackerel Rundown",
        description: "Mackerel simmered down in spiced coconut milk with green banana and dumplings.",
        price: 1500,
      },
      {
        name: "Theo's Big Breakfast",
        description: "Ackee & saltfish, callaloo, fried plantain, dumplings and a mug of Blue Mountain coffee.",
        price: 2350,
      },
    ],
  },
  {
    name: "Appetizers",
    items: [
      {
        name: "Jerk Wings",
        description: "Eight wings, 24-hour jerk marinade, pimento-smoked and glazed. Served with ranch.",
        price: 1600,
        featured: true,
        spice: 2,
        mods: [HEAT],
      },
      {
        name: "Pepper Shrimp",
        description: "Middle Quarters-style shrimp steamed in scotch bonnet, garlic and pimento.",
        price: 1900,
        spice: 3,
      },
      {
        name: "Saltfish Fritters",
        description: "Crispy stamp-and-go fritters with a sweet chilli dip.",
        price: 1100,
      },
      {
        name: "Festival Basket",
        description: "Six golden, lightly sweet festivals. Perfect for sharing.",
        price: 700,
        tags: ["vegetarian"],
      },
      {
        name: "Mini Beef Patty Sliders",
        description: "Three bite-size beef patties tucked in coco bread.",
        price: 1250,
      },
    ],
  },
  {
    name: "Lunch",
    description: "Lunch boxes served 11:00am – 4:00pm.",
    window: ["11:00", "16:00"],
    items: [
      {
        name: "Jerk Chicken Lunch Box",
        description: "Quarter jerk chicken with rice & peas and coleslaw.",
        price: 1350,
        spice: 2,
        mods: [HEAT, SIDE_CHOICE],
      },
      {
        name: "Curry Chicken Lunch Box",
        description: "Tender curry chicken and potato with white rice and steamed vegetables.",
        price: 1300,
        spice: 1,
        mods: [SIDE_CHOICE],
      },
      {
        name: "Stew Peas Lunch Box",
        description: "Red peas stewed with salted pig tail, beef and spinners.",
        price: 1400,
        mods: [SIDE_CHOICE],
      },
    ],
  },
  {
    name: "Main Courses",
    description: "Dinner plates, all served with your choice of side.",
    items: [
      {
        name: "Jerk Chicken",
        description: "Marinated overnight, slow-grilled over pimento wood. Served with rice & peas, festival and steamed vegetables.",
        price: 1950,
        featured: true,
        spice: 2,
        mods: [
          { name: "Portion", min: 1, max: 1, options: [["Quarter", 0, true], ["Half", 900]] },
          HEAT,
          SIDE_CHOICE,
          ADD_ONS,
        ],
      },
      {
        name: "Braised Oxtail",
        description: "Fall-off-the-bone oxtail with butter beans in a rich, glossy gravy.",
        price: 3200,
        featured: true,
        mods: [{ name: "Portion", min: 1, max: 1, options: [["Regular", 0, true], ["Large", 1100]] }, SIDE_CHOICE, ADD_ONS],
      },
      {
        name: "Curry Goat",
        description: "Bone-in goat slow-cooked with Jamaican curry, thyme and scotch bonnet.",
        price: 2700,
        spice: 2,
        mods: [SIDE_CHOICE, ADD_ONS],
      },
      {
        name: "Escovitch Snapper",
        description: "Whole fried red snapper topped with pickled scotch bonnet, carrot and onion.",
        price: 3600,
        featured: true,
        spice: 2,
        mods: [SIDE_CHOICE, ADD_ONS],
      },
      {
        name: "Brown Stew Chicken",
        description: "Chicken browned and stewed with carrots, peppers and fresh thyme.",
        price: 1850,
        mods: [SIDE_CHOICE, ADD_ONS],
      },
      {
        name: "Jerk Pork",
        description: "Boston-style jerk pork, chopped and served with hard dough bread.",
        price: 2200,
        spice: 2,
        mods: [HEAT, SIDE_CHOICE, ADD_ONS],
      },
      {
        name: "Rasta Pasta",
        description: "Penne in a creamy jerk-spiced sauce with sweet peppers.",
        price: 2100,
        spice: 1,
        tags: ["vegetarian"],
        mods: [{ name: "Add protein", min: 0, max: 1, options: [["Jerk Chicken", 700], ["Shrimp", 1100]] }],
      },
      {
        name: "Grilled Lobster Tail",
        description: "Seasonal. Garlic-butter grilled lobster tail. Available during lobster season only.",
        price: 5200,
        unavailable: true,
        mods: [SIDE_CHOICE],
      },
    ],
  },
  {
    name: "Sides",
    items: [
      { name: "Rice & Peas", description: "Coconut rice with kidney beans, thyme and pimento.", price: 450, tags: ["vegan"] },
      { name: "Festival (3)", description: "Sweet fried cornmeal dumplings.", price: 400, tags: ["vegetarian"] },
      { name: "Fried Ripe Plantain", description: "Caramelised sweet plantain.", price: 450, tags: ["vegan"] },
      { name: "Bammy", description: "Fried cassava flatbread.", price: 400, tags: ["vegan"] },
      { name: "Steamed Vegetables", description: "Cabbage, carrot and callaloo.", price: 450, tags: ["vegan"] },
      { name: "Roast Breadfruit", description: "Fire-roasted, sliced and fried.", price: 500, tags: ["vegan"] },
      { name: "Mac & Cheese Pie", description: "Baked, Jamaican style.", price: 650, tags: ["vegetarian"] },
    ],
  },
  {
    name: "Drinks",
    items: [
      { name: "Sorrel", description: "Hibiscus steeped with ginger and pimento.", price: 550, tags: ["vegan"], mods: [DRINK_SIZE] },
      { name: "Carrot Juice", description: "Fresh carrot juice with nutmeg and a hint of lime.", price: 600, mods: [DRINK_SIZE] },
      { name: "Ginger Beer", description: "House-brewed, fiery and fresh.", price: 500, tags: ["vegan"], mods: [DRINK_SIZE] },
      { name: "Fresh Coconut Water", description: "Straight from the jelly.", price: 500, tags: ["vegan"] },
      { name: "Blue Mountain Coffee", description: "Hot brewed Jamaica Blue Mountain coffee.", price: 650 },
      { name: "Soft Drink", description: "Ting, Kola Champagne or cola.", price: 300, mods: [{ name: "Flavour", min: 1, max: 1, options: [["Ting", 0, true], ["Kola Champagne", 0], ["Cola", 0]] }] },
    ],
  },
  {
    name: "Cocktails",
    description: "18+ only. Valid ID required on pickup and delivery.",
    items: [
      { name: "Theo's Rum Punch", description: "Overproof white rum, strawberry syrup, lime and pineapple.", price: 1400, featured: true, tags: ["alcohol"], mods: [{ name: "Make it", min: 0, max: 1, options: [["A double", 800]] }] },
      { name: "Sorrel Sangria", description: "Sorrel, red wine, rum and citrus.", price: 1500, tags: ["alcohol"] },
      { name: "Blue Mountain Espresso Martini", description: "Vodka, coffee liqueur and Blue Mountain espresso.", price: 1700, tags: ["alcohol"] },
      { name: "Mango Mojito", description: "White rum, fresh mango, mint and lime.", price: 1500, tags: ["alcohol"] },
      { name: "Guinness Punch", description: "Guinness, condensed milk, nutmeg and vanilla.", price: 1100, tags: ["alcohol"] },
    ],
  },
  {
    name: "Desserts",
    items: [
      { name: "Rum Cake", description: "Dark fruit cake soaked in Jamaican rum.", price: 900, featured: true, tags: ["alcohol"] },
      { name: "Sweet Potato Pudding", description: "'Hell a top, hell a bottom, hallelujah in the middle.'", price: 850, tags: ["vegetarian"] },
      { name: "Coconut Drops", description: "Diced coconut in ginger and brown-sugar candy.", price: 500, tags: ["vegan"] },
      { name: "Grater Cake Sundae", description: "Vanilla ice cream, pink grater cake crumble and toasted coconut.", price: 950, tags: ["vegetarian"] },
    ],
  },
  {
    name: "Specials",
    description: "Weekly specials from the kitchen.",
    items: [
      {
        name: "Sunday Brunch Platter",
        description: "Ackee & saltfish, jerk chicken, fried dumplings, plantain and a sorrel mimosa. Sundays only.",
        price: 3800,
        featured: true,
        tags: ["alcohol"],
      },
      {
        name: "Friday Seafood Boil",
        description: "Shrimp, crab, corn and potato in garlic-pepper butter. Fridays from 5pm.",
        price: 4200,
        spice: 2,
      },
    ],
  },
];

const PARTNER_MENUS: Record<string, CategorySpec[]> = {
  "harbour-catch": [
    {
      name: "Fish",
      items: [
        { name: "Fried Fish & Bammy", description: "Whole fried parrot fish with bammy and pickled pepper.", price: 2600, featured: true, mods: [SIDE_CHOICE] },
        { name: "Steamed Fish", description: "Fish steamed with okra, pumpkin and water crackers.", price: 2800, mods: [SIDE_CHOICE] },
        { name: "Curry Shrimp", description: "Shrimp in a coconut curry sauce.", price: 2900, spice: 1, mods: [SIDE_CHOICE] },
      ],
    },
    {
      name: "Sides & Drinks",
      items: [
        { name: "Festival (3)", description: "Sweet fried dumplings.", price: 350 },
        { name: "Bag Juice", description: "Ice-cold fruit punch.", price: 200 },
      ],
    },
  ],
  "ital-garden": [
    {
      name: "Ital Plates",
      items: [
        { name: "Ital Stew", description: "Pumpkin, chocho, carrot, dumplings and red peas in coconut milk.", price: 1400, featured: true, tags: ["vegan"] },
        { name: "Callaloo Wrap", description: "Steamed callaloo, chickpeas and avocado in a whole-wheat wrap.", price: 1200, tags: ["vegan"] },
        { name: "Tofu Jerk Bowl", description: "Jerk tofu, brown rice & peas, steamed veg.", price: 1500, tags: ["vegan"], spice: 2 },
      ],
    },
    {
      name: "Juices",
      items: [
        { name: "Beetroot & Ginger", description: "Cold-pressed.", price: 650, tags: ["vegan"] },
        { name: "Soursop Punch", description: "Blended with oat milk and nutmeg.", price: 700, tags: ["vegan"] },
      ],
    },
  ],
  "bay-patty-co": [
    {
      name: "Patties",
      items: [
        { name: "Beef Patty", description: "Spicy minced beef in a flaky golden crust.", price: 350, featured: true, spice: 1, mods: [{ name: "Make it", min: 0, max: 1, options: [["With Coco Bread", 200], ["With Cheese", 150]] }] },
        { name: "Chicken Patty", description: "Curried chicken filling.", price: 380 },
        { name: "Callaloo Patty", description: "Seasoned callaloo.", price: 330, tags: ["vegetarian"] },
        { name: "Lobster Patty", description: "Seasonal lobster filling.", price: 900 },
      ],
    },
    {
      name: "Bakery",
      items: [
        { name: "Coco Bread", description: "Soft, buttery, folded.", price: 200 },
        { name: "Bulla & Cheese", description: "Spiced molasses bulla with processed cheese.", price: 300 },
      ],
    },
  ],
};

function buildMenu(slug: string, spec: CategorySpec[]) {
  const restaurant_id = sid(`restaurant:${slug}`);
  const categories: MenuCategory[] = [];
  const items: MenuItem[] = [];
  const groups: ModifierGroup[] = [];
  const modifiers: Modifier[] = [];
  spec.forEach((cat, ci) => {
    const catSlug = cat.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-");
    const category_id = sid(`mcat:${slug}:${catSlug}`);
    categories.push({
      id: category_id,
      restaurant_id,
      name: cat.name,
      slug: catSlug,
      description: cat.description ?? null,
      sort_order: ci,
      is_active: true,
      available_from: cat.window?.[0] ?? null,
      available_until: cat.window?.[1] ?? null,
    });
    cat.items.forEach((it, ii) => {
      const item_id = sid(`item:${slug}:${catSlug}:${it.name}`);
      items.push({
        id: item_id,
        restaurant_id,
        category_id,
        name: it.name,
        description: it.description,
        price_cents: J(it.price),
        image_url: null,
        is_available: !it.unavailable,
        is_featured: Boolean(it.featured),
        dietary_tags: it.tags ?? [],
        spice_level: it.spice ?? 0,
        sort_order: ii,
        created_at: SEED_EPOCH,
      });
      (it.mods ?? []).forEach((m, gi) => {
        const group_id = sid(`mgroup:${item_id}:${m.name}`);
        groups.push({ id: group_id, restaurant_id, menu_item_id: item_id, name: m.name, min_select: m.min, max_select: m.max, sort_order: gi });
        m.options.forEach(([name, dollars, isDefault], oi) =>
          modifiers.push({
            id: sid(`mod:${group_id}:${name}`),
            restaurant_id,
            group_id,
            name,
            price_delta_cents: J(dollars),
            is_available: true,
            is_default: Boolean(isDefault),
            sort_order: oi,
          }),
        );
      });
    });
  });
  return { categories, items, groups, modifiers };
}

function zone(slug: string, name: string, z: Omit<DeliveryZone, "id" | "restaurant_id" | "name">): DeliveryZone {
  return { id: sid(`zone:${slug}:${name}`), restaurant_id: sid(`restaurant:${slug}`), name, ...z };
}

// SAMPLE zones for Theo's. Areas and fees are configurable in Partner/Admin → Delivery zones.
const deliveryZones: DeliveryZone[] = [
  zone("theos", "Zone A", {
    description: "Closest neighbourhoods",
    fee_cents: J(400),
    min_minutes: 25,
    max_minutes: 40,
    areas: ["New Kingston", "Half Way Tree", "Cross Roads", "Liguanea", "Hope Pastures"],
    radius_km: 4,
    min_order_cents: J(1000),
    is_active: true,
    sort_order: 1,
  }),
  zone("theos", "Zone B", {
    description: "Greater Kingston",
    fee_cents: J(700),
    min_minutes: 35,
    max_minutes: 55,
    areas: ["Barbican", "Constant Spring", "Mona", "Papine", "Downtown Kingston", "Vineyard Town", "Meadowbrook", "Red Hills Road"],
    radius_km: 8,
    min_order_cents: J(1500),
    is_active: true,
    sort_order: 2,
  }),
  zone("theos", "Zone C", {
    description: "Outer areas",
    fee_cents: J(1100),
    min_minutes: 50,
    max_minutes: 75,
    areas: ["Portmore", "Stony Hill", "Harbour View", "Jacks Hill", "Duhaney Park", "Havendale"],
    radius_km: 14,
    min_order_cents: J(2500),
    is_active: true,
    sort_order: 3,
  }),
  zone("harbour-catch", "Portmore", {
    description: null,
    fee_cents: J(450),
    min_minutes: 30,
    max_minutes: 50,
    areas: ["Portmore", "Hellshire", "Waterford", "Edgewater", "Braeton"],
    radius_km: 7,
    min_order_cents: J(1200),
    is_active: true,
    sort_order: 1,
  }),
  zone("ital-garden", "Uptown", {
    description: null,
    fee_cents: J(500),
    min_minutes: 30,
    max_minutes: 50,
    areas: ["Liguanea", "Mona", "Papine", "Hope Pastures", "Half Way Tree", "New Kingston"],
    radius_km: 6,
    min_order_cents: J(1000),
    is_active: true,
    sort_order: 1,
  }),
  zone("bay-patty-co", "Montego Bay", {
    description: null,
    fee_cents: J(350),
    min_minutes: 20,
    max_minutes: 40,
    areas: ["Montego Bay", "Ironshore", "Rose Hall", "Catherine Hall", "Freeport"],
    radius_km: 8,
    min_order_cents: J(800),
    is_active: true,
    sort_order: 1,
  }),
];

function nextWeekday(from: Date, weekday: number, hour: number): string {
  const d = new Date(from);
  d.setUTCHours(hour + 5, 0, 0, 0); // Jamaica is UTC−5 year-round
  const diff = (weekday - d.getUTCDay() + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString();
}

export function buildEvents(now: Date): RestaurantEvent[] {
  const r = sid("restaurant:theos");
  const e = (key: string, ev: Omit<RestaurantEvent, "id" | "restaurant_id" | "is_published" | "image_url">): RestaurantEvent => ({
    id: sid(`event:${key}`),
    restaurant_id: r,
    image_url: null,
    is_published: true,
    ...ev,
  });
  return [
    e("friday-lounge", {
      title: "Friday Night Lounge",
      description: "Selector on the decks from 9pm, rum punch specials all night. Smart casual.",
      starts_at: nextWeekday(now, 5, 21),
      ends_at: null,
      cover_charge_cents: null,
    }),
    e("sunday-brunch", {
      title: "Sunday Brunch & Live Acoustic",
      description: "Brunch platters, sorrel mimosas and a live acoustic set from noon.",
      starts_at: nextWeekday(now, 0, 11),
      ends_at: null,
      cover_charge_cents: null,
    }),
    e("wednesday-dominoes", {
      title: "Wednesday Dominoes Night",
      description: "Bring your crew. Winners' table gets a round on the house.",
      starts_at: nextWeekday(now, 3, 19),
      ends_at: null,
      cover_charge_cents: null,
    }),
  ];
}

const promotions: Promotion[] = [
  {
    id: sid("promo:welcome"),
    restaurant_id: sid("restaurant:theos"),
    code: "WELCOME10",
    title: "10% off your first direct order",
    description: "Order directly from Theo's and save 10% on food. Minimum order J$2,000.",
    type: "percent",
    value: 1000,
    min_subtotal_cents: J(2000),
    funded_by: "restaurant",
    starts_at: null,
    ends_at: null,
    usage_limit: null,
    used_count: 0,
    is_active: true,
    created_at: SEED_EPOCH,
  },
  {
    id: sid("promo:freedelivery"),
    restaurant_id: sid("restaurant:theos"),
    code: "FREEDEL",
    title: "Free delivery on orders over J$5,000",
    description: "Delivery fee waived on Theo's orders of J$5,000 or more.",
    type: "free_delivery",
    value: 0,
    min_subtotal_cents: J(5000),
    funded_by: "restaurant",
    starts_at: null,
    ends_at: null,
    usage_limit: null,
    used_count: 0,
    is_active: true,
    created_at: SEED_EPOCH,
  },
];

function prng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function buildSeed(options: { sampleOrders?: boolean; now?: Date } = {}) {
  const now = options.now ?? new Date();
  const menus = [
    buildMenu("theos", THEOS_MENU),
    ...Object.entries(PARTNER_MENUS).map(([slug, spec]) => buildMenu(slug, spec)),
  ];

  const profiles: Profile[] = DEMO_ACCOUNTS.map((a) => ({
    id: sid(`user:${a.email}`),
    email: a.email,
    full_name: a.name,
    phone: a.role === "customer" ? "+1 (876) 555-0199" : null,
    role: a.role,
    marketing_opt_in: false,
    created_at: SEED_EPOCH,
  }));
  // Pre-computed salt keeps the seed deterministic; passwords are demo-only.
  const credentials: LocalCredential[] = DEMO_ACCOUNTS.map((a) => ({
    id: sid(`user:${a.email}`),
    email: a.email,
    password_hash: hashPassword(a.password, sid(`salt:${a.email}`).replace(/-/g, "")),
  }));
  const restaurantUsers: RestaurantUser[] = [
    { id: sid("ru:theos-owner"), restaurant_id: THEOS.id, user_id: sid("user:owner@theos.example"), role: "owner", created_at: SEED_EPOCH },
    {
      id: sid("ru:harbour-owner"),
      restaurant_id: sid("restaurant:harbour-catch"),
      user_id: sid("user:partner@harbourcatch.example"),
      role: "owner",
      created_at: SEED_EPOCH,
    },
  ];
  const drivers: Driver[] = [
    {
      id: sid("driver:andre"),
      user_id: sid("user:driver@theos.example"),
      full_name: "Andre Campbell",
      phone: "+1 (876) 555-0177",
      vehicle_type: "Motorbike",
      vehicle_plate: "DEMO-01",
      region_id: regionId("kingston-st-andrew"),
      status: "available",
      is_approved: true,
      created_at: SEED_EPOCH,
    },
  ];
  const customerId = sid("user:customer@theos.example");
  const addresses: DeliveryAddress[] = [
    {
      id: sid("addr:keisha-home"),
      user_id: customerId,
      label: "Home",
      line1: "14 Sample Avenue",
      line2: null,
      area: "Liguanea",
      city: "Kingston",
      parish: "St. Andrew",
      instructions: "Blue gate, ring the bell",
      latitude: null,
      longitude: null,
      is_default: true,
      created_at: SEED_EPOCH,
    },
  ];

  const data: Partial<{ [K in TableName]: TableMap[K][] }> = {
    platform_settings: [defaultSettings],
    regions,
    restaurant_categories: restaurantCategories,
    subscription_plans: plans,
    restaurants: [THEOS, ...DEMO_PARTNERS],
    restaurant_category_assignments: categoryAssignments,
    restaurant_users: restaurantUsers,
    operating_hours: operatingHours,
    menu_categories: menus.flatMap((m) => m.categories),
    menu_items: menus.flatMap((m) => m.items),
    menu_item_modifier_groups: menus.flatMap((m) => m.groups),
    menu_item_modifiers: menus.flatMap((m) => m.modifiers),
    delivery_zones: deliveryZones,
    promotions,
    restaurant_events: buildEvents(now),
    profiles,
    local_credentials: credentials,
    drivers,
    delivery_addresses: addresses,
    orders: [],
    order_items: [],
    order_status_history: [],
    payments: [],
    deliveries: [],
    payouts: [],
    reviews: [],
    favorites: [],
    notifications: [],
    placements: [],
    contact_messages: [],
    analytics_events: [],
  };

  if (options.sampleOrders) addSampleOrders(data, now);
  return data;
}

/** Local/demo mode only: generate ~2 weeks of sample order history so dashboards have data. */
function addSampleOrders(data: Partial<{ [K in TableName]: TableMap[K][] }>, now: Date) {
  const rand = prng(20260925);
  const restaurants = data.restaurants!;
  const items = data.menu_items!;
  const groups = data.menu_item_modifier_groups!;
  const modifiers = data.menu_item_modifiers!;
  const zones = data.delivery_zones!;
  const settings = data.platform_settings![0];
  const customerId = sid("user:customer@theos.example");
  const names = ["Keisha B.", "Marlon T.", "Shanice R.", "Devon W.", "Tanya M.", "Ricardo H.", "Alicia G.", "Omar S."];

  for (let i = 0; i < 90; i++) {
    const r = rand() < 0.72 ? restaurants[0] : restaurants[1 + Math.floor(rand() * 3)];
    const menu = items.filter((it) => it.restaurant_id === r.id && it.is_available);
    const daysAgo = Math.floor(rand() * 14);
    const created = new Date(now.getTime() - daysAgo * 86400000 - Math.floor(rand() * 10) * 3600000 - 3600000);
    const lineCount = 1 + Math.floor(rand() * 3);
    const lines = [];
    for (let l = 0; l < lineCount; l++) {
      const item = menu[Math.floor(rand() * menu.length)];
      const g = groups.filter((x) => x.menu_item_id === item.id);
      const m = modifiers.filter((x) => g.some((gg) => gg.id === x.group_id));
      const selected = g.flatMap((gg) => {
        if (gg.min_select === 0) return [];
        const opts = m.filter((x) => x.group_id === gg.id);
        return [(opts.find((x) => x.is_default) ?? opts[0]).id];
      });
      lines.push(priceLine({ item, groups: g, modifiers: m, selectedModifierIds: selected, quantity: 1 + Math.floor(rand() * 2) }));
    }
    const rZones = zones.filter((z) => z.restaurant_id === r.id);
    let fulfillment: "pickup" | "delivery" = rand() < 0.6 ? "delivery" : "pickup";
    const z = rZones[Math.floor(rand() * rZones.length)];
    const subtotal = lines.reduce((s, l) => s + l.line_total_cents, 0);
    if (fulfillment === "delivery" && (!z || subtotal < z.min_order_cents)) fulfillment = "pickup";
    const commissionBps = resolveCommissionBps(r, data.subscription_plans!, settings);
    const totals = computeTotals({
      lines,
      fulfillment,
      zone: fulfillment === "delivery" ? z : null,
      restaurant: r,
      commissionBps,
      settings,
      tipCents: fulfillment === "delivery" && rand() < 0.4 ? J(200) : 0,
    });
    const isToday = daysAgo === 0;
    const status: OrderStatus = isToday
      ? (["pending", "confirmed", "preparing", "ready", "delivered"] as const)[Math.floor(rand() * 5)]
      : rand() < 0.05
        ? "cancelled"
        : "delivered";
    const orderId = sid(`sample-order:${i}`);
    const createdIso = created.toISOString();
    const paymentMethod = rand() < 0.7 ? "cash" : "card_on_delivery";
    const order: Order = {
      id: orderId,
      order_number: `TH-S${String(1000 + i)}`,
      tracking_token: sid(`sample-token:${i}`).replace(/-/g, ""),
      restaurant_id: r.id,
      customer_id: rand() < 0.3 ? customerId : null,
      contact_name: names[Math.floor(rand() * names.length)],
      contact_email: null,
      contact_phone: "+1 (876) 555-0100",
      fulfillment_type: fulfillment,
      status,
      delivery_address:
        fulfillment === "delivery" ? { line1: "Sample address", area: z.areas[0], city: r.city, parish: r.parish } : null,
      delivery_zone_id: fulfillment === "delivery" ? z.id : null,
      notes: null,
      scheduled_for: null,
      currency: "JMD",
      subtotal_cents: totals.subtotal_cents,
      discount_cents: totals.discount_cents,
      delivery_fee_cents: totals.delivery_fee_cents,
      service_fee_cents: totals.service_fee_cents,
      tax_cents: totals.tax_cents,
      tip_cents: totals.tip_cents,
      total_cents: totals.total_cents,
      commission_rate_bps: totals.commission_rate_bps,
      commission_cents: totals.commission_cents,
      restaurant_payout_cents: totals.restaurant_payout_cents,
      platform_revenue_cents: totals.platform_revenue_cents,
      delivery_revenue_cents: totals.delivery_revenue_cents,
      promotion_id: null,
      payment_method: paymentMethod,
      payment_status: status === "delivered" ? "paid" : status === "cancelled" ? "cancelled" : "pending",
      payout_id: null,
      estimated_ready_at: new Date(created.getTime() + r.prep_time_minutes * 60000).toISOString(),
      estimated_delivery_at: fulfillment === "delivery" ? new Date(created.getTime() + (r.prep_time_minutes + z.max_minutes) * 60000).toISOString() : null,
      cancel_reason: status === "cancelled" ? "Customer requested cancellation" : null,
      idempotency_key: null,
      created_at: createdIso,
      updated_at: createdIso,
    };
    data.orders!.push(order);
    lines.forEach((l, li) => {
      const oi: OrderItem = {
        id: sid(`sample-oi:${i}:${li}`),
        order_id: orderId,
        restaurant_id: r.id,
        menu_item_id: l.menu_item_id,
        name: l.name,
        unit_price_cents: l.unit_price_cents,
        quantity: l.quantity,
        modifiers: l.modifiers,
        special_instructions: null,
        line_total_cents: l.line_total_cents,
      };
      data.order_items!.push(oi);
    });
    const flow: OrderStatus[] =
      status === "cancelled" ? ["pending", "cancelled"] : ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];
    const stop = flow.indexOf(status);
    flow.slice(0, stop + 1).forEach((st, si) => {
      if (fulfillment === "pickup" && st === "out_for_delivery") return;
      const h: OrderStatusHistory = {
        id: sid(`sample-h:${i}:${st}`),
        order_id: orderId,
        status: st,
        note: null,
        actor_id: null,
        created_at: new Date(created.getTime() + si * 8 * 60000).toISOString(),
      };
      data.order_status_history!.push(h);
    });
    const payment: Payment = {
      id: sid(`sample-pay:${i}`),
      order_id: orderId,
      provider: "cash",
      method: paymentMethod,
      amount_cents: totals.total_cents,
      currency: "JMD",
      status: order.payment_status,
      provider_reference: null,
      refunded_cents: 0,
      failure_reason: null,
      created_at: createdIso,
      updated_at: createdIso,
    };
    data.payments!.push(payment);
    if (fulfillment === "delivery" && status !== "cancelled") {
      const delivered = status === "delivered";
      const d: Delivery = {
        id: sid(`sample-del:${i}`),
        order_id: orderId,
        restaurant_id: r.id,
        driver_id: delivered ? sid("driver:andre") : null,
        status: delivered ? "delivered" : "unassigned",
        driver_payout_cents: totals.driver_payout_cents,
        tip_cents: totals.tip_cents,
        assigned_at: delivered ? createdIso : null,
        picked_up_at: delivered ? createdIso : null,
        delivered_at: delivered ? new Date(created.getTime() + 50 * 60000).toISOString() : null,
        created_at: createdIso,
      };
      data.deliveries!.push(d);
    }
  }
}
