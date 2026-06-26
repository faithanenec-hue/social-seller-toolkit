import { logger } from "./logger";

interface CaptionGenerateInput {
  productName: string;
  niche: string;
  tone: string;
  promotionGoal: string;
  platforms: string[];
}

interface GeneratedCaption {
  platform: string;
  text: string;
}

const toneOpeners: Record<string, string[]> = {
  funny: [
    "Warning: may cause extreme happiness 😂",
    "Your wallet called. It said go ahead.",
    "Plot twist: you actually deserve this.",
  ],
  luxury: [
    "Some things are simply worth it.",
    "Crafted for those who appreciate the finest.",
    "Elevate your standard. You've earned it.",
  ],
  urgent: [
    "This won't last long — act now!",
    "LIMITED TIME — don't miss out!",
    "Selling out FAST — grab yours today!",
  ],
  emotional: [
    "Every piece tells a story. This one is yours.",
    "The feeling when you find exactly what you've been looking for.",
    "Some purchases are investments in yourself.",
  ],
  promotional: [
    "Big deals, bigger smiles.",
    "Your favourite products, now at an unbeatable price.",
    "Don't sleep on this offer!",
  ],
  storytelling: [
    "Here's how it started...",
    "A customer walked in. This is what happened next.",
    "We didn't plan to sell this — until everyone kept asking for it.",
  ],
  educational: [
    "Did you know? Here's what makes this special.",
    "3 things you need to know before you buy.",
    "The truth about quality — a short thread.",
  ],
};

const platformFormats: Record<string, (opener: string, product: string, niche: string, goal: string) => string> = {
  Instagram: (opener, product, niche, goal) =>
    `${opener}\n\nIntroducing our ${product} — the piece your ${niche} collection has been missing.\n\n✨ ${goal}\n\nTap the link in bio to shop now. Comment "WANT" below to get more info!\n\n#${niche.replace(/\s/g, "")}Store #NewArrival #ShopNow #${product.replace(/\s/g, "")} #Fashion #Style #MustHave #BuyNow`,
  Facebook: (opener, product, niche, goal) =>
    `${opener}\n\nWe're excited to share our latest ${product} with our amazing community!\n\nFor all our ${niche} lovers — this one is for you. ${goal}.\n\nWe take pride in offering quality pieces that you'll love. Every order is carefully packaged and shipped with care.\n\n📦 Fast delivery available\n💳 Multiple payment options\n✅ Quality guaranteed\n\nComment below or send us a message to order yours today. We'd love to help you find the perfect fit! 💛`,
  TikTok: (opener, product, niche, goal) =>
    `${opener} POV: you just found the best ${product} for your ${niche} needs 🔥\n\n${goal} — and yes, it's as good as it looks!\n\nShip to your city 📦 DM to order!\n\n#${niche.replace(/\s/g, "")}TikTok #fyp #foryou #viral #${product.replace(/\s/g, "")}`,
  WhatsApp: (opener, product, niche, goal) =>
    `Hi! 👋\n\nWe just launched our ${product} and wanted you to be the first to know!\n\n${goal}.\n\nIt's perfect for anyone into ${niche}. Quality is top-notch and we have limited stock available.\n\nReply to this message to place your order or ask any questions. We'll get back to you right away!\n\nThank you for your continued support 🙏`,
};

export async function generateCaptionsAI(input: CaptionGenerateInput): Promise<GeneratedCaption[]> {
  const toneKey = input.tone.toLowerCase();
  const openers = toneOpeners[toneKey] ?? toneOpeners.promotional;
  const opener = openers[Math.floor(Math.random() * openers.length)];

  logger.info({ niche: input.niche, tone: input.tone }, "Generating template captions");

  return input.platforms.map((platform) => {
    const formatter = platformFormats[platform];
    if (!formatter) {
      return {
        platform,
        text: `${opener}\n\nShop our ${input.productName} today! ${input.promotionGoal}.`,
      };
    }
    return {
      platform,
      text: formatter(opener, input.productName, input.niche, input.promotionGoal),
    };
  });
}

interface BroadcastGenerateInput {
  niche: string;
  promotionType: string;
  audience: string;
  discountPercentage?: number | null;
  productName: string;
  businessName: string;
}

const broadcastTemplates: Record<string, (input: BroadcastGenerateInput) => { message: string; subject: string }> = {
  "flash sale": (i) => ({
    subject: `Flash Sale at ${i.businessName}!`,
    message: `Hi! 👋

We're running a FLASH SALE right now at ${i.businessName}!

${i.discountPercentage ? `Get ${i.discountPercentage}% OFF on` : "Amazing deals on"} our ${i.productName} collection — but only for the next few hours!

This offer is exclusively for our valued customers like you.

To place your order:
1. Reply to this message with the item(s) you want
2. We'll confirm availability and payment details
3. Enjoy fast delivery right to your door

Don't wait — stock is limited and this price won't last!

Thank you for shopping with us. We appreciate your support 🙏

– ${i.businessName} Team`,
  }),
  "new arrival": (i) => ({
    subject: `New Arrivals are Here – ${i.businessName}`,
    message: `Hi! 👋

Guess what just arrived at ${i.businessName}? 🎉

Our brand new ${i.productName} collection is finally here, and it's everything you've been waiting for!

These are fresh pieces, carefully selected for ${i.audience} who appreciate quality and style.

Whether you're looking for something for yourself or a special gift, we've got you covered.

Reply with "NEW" to see full details, sizes, and prices. We'd love to help you pick the perfect one!

Limited stock available — early birds get first pick 😊

– ${i.businessName} Team`,
  }),
  "restock": (i) => ({
    subject: `Your Favourite is Back – ${i.businessName}`,
    message: `Hi! 👋

Great news — your favourite ${i.productName} is BACK IN STOCK at ${i.businessName}!

We know many of you have been waiting for this, so we wanted to let you know right away.

${i.discountPercentage ? `And as a thank-you for your patience, enjoy ${i.discountPercentage}% OFF this restock!` : "Available now at the same great price you love."}

This restock won't last long. Reply to grab yours before it sells out again!

– ${i.businessName} Team`,
  }),
  "holiday": (i) => ({
    subject: `Special Holiday Offer from ${i.businessName}`,
    message: `Hi! 🎊

Wishing you a wonderful celebration from all of us at ${i.businessName}!

To mark the occasion, we're offering something special:
${i.discountPercentage ? `✨ ${i.discountPercentage}% OFF our ${i.productName} collection` : `✨ Exclusive deals on our ${i.productName} collection`}

Whether you're shopping for yourself or gifting someone special, this is the perfect moment.

Reply to place your order or ask about our full holiday collection. We'll be happy to help!

Happy holidays and thank you for your continued support 🙏

– ${i.businessName} Team`,
  }),
  "re-engagement": (i) => ({
    subject: `We Miss You – Special Offer Inside`,
    message: `Hi! 👋

It's been a while since we've seen you, and we've missed you at ${i.businessName}!

We wanted to check in and share something exclusive — just for customers like you who've supported us.

${i.discountPercentage ? `Here's a personal ${i.discountPercentage}% discount code just for you!` : `We have fresh ${i.productName} pieces we think you'll love.`}

A lot has changed since your last visit — new arrivals, better quality, and even faster delivery.

Reply "BACK" to see what's new and claim your exclusive offer. We'd love to welcome you back!

– ${i.businessName} Team`,
  }),
};

export async function generateBroadcastAI(input: BroadcastGenerateInput): Promise<{ message: string; subject: string }> {
  logger.info({ promotionType: input.promotionType, niche: input.niche }, "Generating template broadcast");

  const key = input.promotionType.toLowerCase();
  const templateFn =
    broadcastTemplates[key] ??
    broadcastTemplates["flash sale"];

  return templateFn(input);
}
