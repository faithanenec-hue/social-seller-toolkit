import { db, captionsTable, broadcastTemplatesTable } from "@workspace/db";

async function seed() {
  console.log("Seeding captions...");

  await db
    .insert(captionsTable)
    .values([
      {
        niche: "Fashion",
        platform: "Instagram",
        tone: "Promotional",
        type: "New Arrival",
        category: "Product Launch",
        text: "✨ New Drop Alert! Our latest collection just landed. Shop the new arrivals today!",
        usageCount: 12,
      },
      {
        niche: "Hair",
        platform: "WhatsApp",
        tone: "Luxury",
        type: "New Arrival",
        category: "Product Launch",
        text: "Hi beautiful! Our latest hair collection has arrived. Reply to see available styles and prices.",
        usageCount: 18,
      },
      {
        niche: "Food",
        platform: "Instagram",
        tone: "Storytelling",
        type: "Promotional",
        category: "Brand",
        text: "Every dish tells a story. Discover freshly prepared meals made with care. Send us a message to order.",
        usageCount: 7,
      },
      {
        niche: "Beauty",
        platform: "TikTok",
        tone: "Funny",
        type: "Promotional",
        category: "Social Media",
        text: "POV: You found your new beauty favourite ✨ Message us to learn more!",
        usageCount: 14,
      },
      {
        niche: "Jewellery",
        platform: "Instagram",
        tone: "Luxury",
        type: "New Arrival",
        category: "Product Launch",
        text: "A little sparkle goes a long way 💍 Explore our latest collection and find your favourite piece.",
        usageCount: 19,
      },
    ])
    .onConflictDoNothing();

  console.log("Seeding broadcast templates...");

  await db
    .insert(broadcastTemplatesTable)
    .values([
      {
        title: "New Arrival Alert",
        category: "New Arrival",
        niche: "Hair",
        message:
          "Hi beautiful! Our new arrivals are here. Reply to see the available styles, prices, and photos.",
        usageCount: 18,
      },
      {
        title: "Flash Sale",
        category: "Flash Sale",
        niche: "Fashion",
        message:
          "Hi! We have a special offer on selected items. Message us to see what's available and when the offer ends.",
        usageCount: 34,
      },
      {
        title: "Welcome Message",
        category: "Welcome",
        niche: "General",
        message:
          "Hi and welcome! Thank you for reaching out. Tell us what you're looking for, and we'll help you find the right product.",
        usageCount: 12,
      },
      {
        title: "Restock Notification",
        category: "Restock",
        niche: "Beauty",
        message:
          "Good news! Some of your favourite products are back in stock. Reply to ask about availability and prices.",
        usageCount: 9,
      },
      {
        title: "Customer Appreciation",
        category: "Customer Appreciation",
        niche: "General",
        message:
          "Thank you for supporting our business! We truly appreciate every order and every recommendation.",
        usageCount: 8,
      },
    ])
    .onConflictDoNothing();

  console.log("Seed complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
