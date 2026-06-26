import { db, captionsTable, broadcastTemplatesTable, productsTable, ordersTable, orderItemsTable, loyaltyTable, wishlistItemsTable } from "@workspace/db";

async function seed() {
  console.log("Seeding captions...");
  await db.insert(captionsTable).values([
    { niche: "Fashion", platform: "Instagram", tone: "Promotional", captionType: "New Arrival", text: "✨ New Drop Alert! Our latest collection just landed and it is EVERYTHING. Elevate your wardrobe game with pieces crafted for the bold, the chic, and the unapologetically stylish. Shop now — these go fast! 👗🔥 #FashionForward #NewCollection #StyleGoals #OOTDInspo #ShopNow", usageCount: 12, sellerRef: "default" },
    { niche: "Fashion", platform: "WhatsApp", tone: "Urgent", captionType: "Flash Sale", text: "Hi sis! 👋 Quick heads up — we have a FLASH SALE running right now on selected fashion pieces! Prices slashed for the next 24 hours only. Reply SHOP to browse our hot deals. Don't sleep on this! 🔥", usageCount: 8, sellerRef: "default" },
    { niche: "Hair", platform: "Instagram", tone: "Luxury", captionType: "New Arrival", text: "Quality that speaks for itself 💎 Our Brazilian Body Wave bundles are hand-selected, tangle-free, and absolutely luxurious. Because your hair deserves nothing less than the best. Available in multiple lengths — shop via link in bio 🌟 #HairGoals #BrazilianHair #LuxuryHair #Weave #VirginHair", usageCount: 25, sellerRef: "default" },
    { niche: "Hair", platform: "TikTok", tone: "Funny", captionType: "Promotional", text: "POV: You found the wig that slays every single time 😂💃 Our lace front wigs are giving EVERYTHING. No glue drama, no bad wig days — just pure excellence. DM to order! #WigLife #HairTok #BlackGirlMagic #WigInstall #fyp", usageCount: 31, sellerRef: "default" },
    { niche: "Food", platform: "Instagram", tone: "Storytelling", captionType: "Promotional", text: "Every dish tells a story. 🍲 This one started with a family recipe passed down for generations — now it lands on your table, made with the same love and the freshest ingredients. Taste the difference quality makes. Order now via link in bio! 🌿", usageCount: 7, sellerRef: "default" },
    { niche: "Food", platform: "Facebook", tone: "Emotional", captionType: "New Arrival", text: "There is nothing quite like a home-cooked meal — except when it is made with love AND delivered to your door. We pour our heart into every order because food should make you feel something. Try our new menu today. You deserve it. 💛", usageCount: 4, sellerRef: "default" },
    { niche: "Jewellery", platform: "Instagram", tone: "Luxury", captionType: "New Arrival", text: "Handcrafted to perfection 💍✨ Our newest jewellery collection is here — each piece designed to tell your story. From delicate everyday rings to statement necklaces that command attention. You were born to sparkle. Shop the collection via link in bio. #Jewellery #HandcraftedJewelry #GoldJewelry", usageCount: 19, sellerRef: "default" },
    { niche: "Beauty", platform: "Instagram", tone: "Educational", captionType: "Promotional", text: "Did you know? The right skincare routine can transform your skin in 30 days 🌿✨ Our curated Beauty Starter Kit includes everything you need: cleanser, toner, moisturizer, and SPF. Dermatologist-approved and suitable for all skin types. Link in bio to shop 💆‍♀️ #SkincareTips #BeautyRoutine #GlowUp", usageCount: 14, sellerRef: "default" },
    { niche: "Fashion", platform: "Facebook", tone: "Emotional", captionType: "Promotional", text: "Fashion is not just about clothes — it is about confidence. It is walking into a room and knowing you look amazing. Our collection was designed for moments like that. Women who know their worth. Shop the new arrivals and wear your confidence 💫", usageCount: 6, sellerRef: "default" },
    { niche: "Hair", platform: "WhatsApp", tone: "Urgent", captionType: "Restock", text: "Hi beautiful! Your fave Brazilian bundles are BACK IN STOCK 🙌 We sold out in 48 hours last time — this restock is even bigger but won't last long. Reply NOW to reserve yours before they fly. Limited bundles available. Thank you for your patience and support 🙏", usageCount: 22, sellerRef: "default" },
    { niche: "Beauty", platform: "TikTok", tone: "Funny", captionType: "Promotional", text: "Me before this skincare kit: 😩 Me after: ✨👸 I am not saying it's magic but... it might be magic. Our Glow Up Kit is the real deal and it ships to your city! DM us to order. #SkincareRoutine #GlowUp #BeautyTok #SkinTok #fyp", usageCount: 41, sellerRef: "default" },
    { niche: "Jewellery", platform: "WhatsApp", tone: "Luxury", captionType: "Promotional", text: "Good evening! 💍\n\nWe wanted to share something beautiful with you — our new 18K gold-plated Crystal Collection has arrived.\n\nEvery piece is handcrafted, hypoallergenic, and comes gift-wrapped.\n\nPerfect for treating yourself or someone special.\n\nReply to see the full collection 🌟", usageCount: 9, sellerRef: "default" },
  ]).onConflictDoNothing();

  console.log("Seeding broadcasts...");
  await db.insert(broadcastTemplatesTable).values([
    { title: "New Arrival Alert", category: "New Arrival", niche: "Hair", message: "Hi beautiful! 👋\n\nWe just got fresh stock in at Glam Hair Studio!\n\nOur brand new Brazilian Body Wave bundles have just arrived and they look STUNNING. Premium quality, soft, and tangle-free — exactly what you deserve.\n\nAvailable in 10 inch to 30 inch. Limited stock so first come first served!\n\nReply YES to see prices and photos 😍\n\n– Glam Hair Studio", usageCount: 18, sellerRef: "default" },
    { title: "Flash Sale Blast", category: "Flash Sale", niche: "Fashion", message: "Hi sis! 🔥\n\nDon't miss our FLASH SALE happening RIGHT NOW at Style Hub!\n\n✅ Up to 40% OFF selected items\n✅ Free delivery on orders over $50\n✅ Exclusive deals for next 6 hours ONLY\n\nThis is not a drill — prices go back up at midnight!\n\nReply SHOP to browse the deals or visit our store.\n\nLove, Style Hub 💛", usageCount: 34, sellerRef: "default" },
    { title: "Welcome Message", category: "Welcome", niche: "General", message: "Hi and welcome to our store! 🎉\n\nThank you so much for reaching out. We're thrilled to have you here!\n\nWe offer premium quality products, fast delivery, and top-notch customer service. Every order is carefully packaged with love.\n\nTo get started, simply tell us what you're looking for and we'll help you find the perfect piece.\n\nWe can't wait to serve you! 😊\n\n– Your Store Team", usageCount: 12, sellerRef: "default" },
    { title: "Restock Notification", category: "Restock", niche: "Beauty", message: "Hi gorgeous! 💄\n\nGreat news — your favourite skincare products are BACK IN STOCK at Glow Beauty!\n\nWe know many of you have been waiting, so we wanted to let you know right away. The response to our last batch was overwhelming and this restock is already going fast.\n\nReply RESTOCK to see the full list of what's available.\n\nFirst come, first served! Thank you for your patience 🙏\n\n– Glow Beauty", usageCount: 9, sellerRef: "default" },
    { title: "Payment Reminder", category: "Payment Reminder", niche: "General", message: "Hi! 👋\n\nJust a gentle reminder that your order is awaiting payment confirmation.\n\nOrder Number: [ORDER_NUMBER]\nTotal: [AMOUNT]\nPayment Method: [PAYMENT_METHOD]\n\nKindly complete your payment to avoid losing your reserved item(s). Once confirmed, we will begin processing immediately.\n\nIf you have any questions or need help, please reply to this message.\n\nThank you! 🙏", usageCount: 15, sellerRef: "default" },
    { title: "Delivery Update", category: "Delivery Update", niche: "General", message: "Hi! 📦\n\nExciting news — your order is on its way!\n\nTracking Number: [TRACKING_NUMBER]\nCourier: [COURIER]\nEstimated Delivery: [DATE]\n\nYou can track your package using the tracking number above. If you have any concerns, please do not hesitate to reach out.\n\nThank you for shopping with us! We hope you love your purchase 💛", usageCount: 21, sellerRef: "default" },
    { title: "Customer Appreciation", category: "Customer Appreciation", niche: "General", message: "Hi! 🌟\n\nWe just wanted to take a moment to say — THANK YOU.\n\nYour continued support means the world to us. Every order, every referral, every kind review — it all helps us grow and serve you better.\n\nAs a token of our appreciation, here is an exclusive 10% discount code just for you:\n\nCode: THANKYOU10\n\nValid for your next order. No minimum spend.\n\nWith love and gratitude 💛\n– The Team", usageCount: 8, sellerRef: "default" },
    { title: "Holiday Promo", category: "Holiday", niche: "Fashion", message: "Hi! 🎊\n\nHappy Holidays from all of us at Style Hub!\n\nTo celebrate, we're giving you something special:\n✨ 15% OFF everything in store\n✨ Free gift wrapping on orders over $80\n✨ Same day dispatch for orders before 2PM\n\nThis offer runs through the end of the holiday weekend only.\n\nReply HOLIDAY to start shopping or browse our collection.\n\nWishing you joy, peace, and fabulous style this season 🎁\n– Style Hub", usageCount: 11, sellerRef: "default" },
    { title: "Re-engagement Broadcast", category: "Re-engagement", niche: "General", message: "Hi! 👋\n\nWe've missed you!\n\nIt's been a while since your last visit and we thought you should know — a LOT has changed. New collections, better quality, faster delivery, and even more amazing products you'll love.\n\nAs a welcome-back gift, here's a 15% discount just for you:\n\nCode: COMEBACK15\n\nValid for 48 hours only. We'd love to see you back!\n\nReply BACK to browse what's new 😊\n– The Team", usageCount: 5, sellerRef: "default" },
  ]).onConflictDoNothing();

  console.log("Seeding products...");
  const insertedProducts = await db.insert(productsTable).values([
    { title: "Brazilian Body Wave Bundle 18\"", niche: "Hair", price: "65.00", description: "Premium grade 9A Brazilian body wave human hair. Tangle-free, shed-free, and can be coloured/heat-styled. Lasts 12+ months with proper care.", inStock: true, sellerRef: "default" },
    { title: "Brazilian Body Wave Bundle 22\"", niche: "Hair", price: "85.00", description: "Premium grade 9A Brazilian body wave human hair. Tangle-free, shed-free, and can be coloured/heat-styled.", inStock: true, sellerRef: "default" },
    { title: "Straight Lace Closure 4x4", niche: "Hair", price: "45.00", description: "HD transparent lace closure, pre-plucked with baby hairs. Natural-looking parting, bleached knots included.", inStock: true, sellerRef: "default" },
    { title: "Body Wave Full Lace Wig 20\"", niche: "Hair", price: "185.00", description: "Full lace wig with 180% density. Pre-plucked hairline, baby hairs, and glueless installation-ready.", inStock: false, sellerRef: "default" },
    { title: "Summer Floral Midi Dress", niche: "Fashion", price: "42.00", description: "Lightweight floral midi dress, perfect for summer. Available in sizes XS–XL. Machine washable.", inStock: true, sellerRef: "default" },
    { title: "Classic Denim Jacket", niche: "Fashion", price: "55.00", description: "Timeless denim jacket with a modern slim fit. Pairs perfectly with any outfit. Available in light and dark wash.", inStock: true, sellerRef: "default" },
    { title: "Gold Hoop Earrings Set (3 pairs)", niche: "Jewellery", price: "28.00", description: "Set of 3 gold-plated hoop earrings in small, medium, and large. Hypoallergenic and tarnish-resistant.", inStock: true, sellerRef: "default" },
    { title: "Crystal Pendant Necklace", niche: "Jewellery", price: "35.00", description: "Delicate crystal pendant on an 18-inch gold-filled chain. Comes in a gift box — perfect for gifting.", inStock: true, sellerRef: "default" },
    { title: "Glow Up Skincare Starter Kit", niche: "Beauty", price: "72.00", description: "Dermatologist-approved 4-step routine: cleanser, toner, moisturiser, SPF 30. Suitable for all skin types.", inStock: true, sellerRef: "default" },
    { title: "Long-wear Matte Lipstick Set", niche: "Beauty", price: "24.00", description: "Set of 6 richly pigmented matte lipsticks. Lightweight, long-lasting, and transfer-proof formula.", inStock: true, sellerRef: "default" },
    { title: "Homemade Pepper Soup Kit", niche: "Food", price: "18.00", description: "Authentic Nigerian pepper soup spice mix with dried ingredients. Makes 4–6 servings. Instructions included.", inStock: true, sellerRef: "default" },
    { title: "Artisan Sourdough Bread Loaf", niche: "Food", price: "12.00", description: "Freshly baked 800g sourdough loaf with a crispy crust and chewy interior. Order by Thursday for weekend delivery.", inStock: true, sellerRef: "default" },
  ]).onConflictDoNothing().returning();

  console.log("Seeding orders...");
  const products = insertedProducts.length > 0 ? insertedProducts : await db.select().from(productsTable).limit(4);
  if (products.length >= 2) {
    const orders = await db.insert(ordersTable).values([
      { orderNumber: "ORD-2026-0001", sellerRef: "default", customerRef: "cust001", customerName: "Amara Johnson", customerEmail: "amara.j@example.com", status: "delivered", paymentStatus: "paid", total: "130.00", trackingNumber: "DHL9283746", courier: "DHL", estimatedDelivery: "Delivered Jun 15" },
      { orderNumber: "ORD-2026-0002", sellerRef: "default", customerRef: "cust002", customerName: "Kemi Adeyemi", customerEmail: "kemi.a@example.com", status: "shipped", paymentStatus: "paid", total: "85.00", trackingNumber: "FDX1234567", courier: "FedEx", estimatedDelivery: "Jun 28–30" },
      { orderNumber: "ORD-2026-0003", sellerRef: "default", customerRef: "cust003", customerName: "Blessing Okafor", customerEmail: "blessing.o@example.com", status: "processing", paymentStatus: "pending", total: "207.00" },
      { orderNumber: "ORD-2026-0004", sellerRef: "default", customerRef: "cust004", customerName: "Fatima Musa", customerEmail: "fatima.m@example.com", status: "confirmed", paymentStatus: "pending", total: "42.00" },
      { orderNumber: "ORD-2026-0005", sellerRef: "default", customerRef: "default", customerName: "Amara Johnson", customerEmail: "amara.j@example.com", status: "delivered", paymentStatus: "paid", total: "55.00", trackingNumber: "DHL8374652", courier: "DHL", estimatedDelivery: "Delivered Jun 5" },
    ]).onConflictDoNothing().returning();

    for (const order of orders) {
      if (products[0]) {
        await db.insert(orderItemsTable).values({ orderId: order.id, productId: products[0].id, productTitle: products[0].title, price: products[0].price, quantity: 1 }).onConflictDoNothing();
      }
      if (products[1] && (order.orderNumber === "ORD-2026-0001" || order.orderNumber === "ORD-2026-0003")) {
        await db.insert(orderItemsTable).values({ orderId: order.id, productId: products[1].id, productTitle: products[1].title, price: products[1].price, quantity: 1 }).onConflictDoNothing();
      }
    }
  }

  console.log("Seeding loyalty...");
  await db.insert(loyaltyTable).values({ customerRef: "default", sellerRef: "default", points: 1250, tier: "silver", totalSpent: "285.00", discountEarned: "14.25", referralCode: "AMARA2026", nextTierPoints: 2000 }).onConflictDoNothing();

  console.log("Seeding wishlist...");
  const wishProducts = await db.select().from(productsTable).limit(2);
  for (const p of wishProducts) {
    await db.insert(wishlistItemsTable).values({ customerRef: "default", sellerRef: "default", productId: p.id }).onConflictDoNothing();
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
