import OpenAI from "openai";
import { logger } from "./logger";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Please add it to your environment secrets.");
  }
  return new OpenAI({ apiKey });
}

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

export async function generateCaptionsAI(input: CaptionGenerateInput): Promise<GeneratedCaption[]> {
  const openai = getOpenAIClient();

  const platformList = input.platforms.join(", ");
  const prompt = `You are an expert social media copywriter for ${input.niche} businesses. Generate engaging captions for the following:

Product/Service: ${input.productName}
Business Niche: ${input.niche}
Tone: ${input.tone}
Promotion Goal: ${input.promotionGoal}
Platforms: ${platformList}

For each platform listed, generate ONE caption optimized specifically for that platform's style and character limits:
- Instagram: up to 2200 chars, use hashtags, engaging and visual
- Facebook: conversational, can be longer, storytelling style
- TikTok: short, energetic, trend-aware, use relevant hooks
- WhatsApp: personal, direct, no hashtags, conversational

Respond ONLY with a JSON array like:
[{"platform": "Instagram", "text": "..."}, {"platform": "Facebook", "text": "..."}, ...]

Only include platforms from the list: ${platformList}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.captions && Array.isArray(parsed.captions)) return parsed.captions;
    return input.platforms.map((platform) => ({
      platform,
      text: `Check out our amazing ${input.productName}! Perfect for your ${input.niche} needs. ${input.promotionGoal}.`,
    }));
  } catch {
    logger.error({ content }, "Failed to parse AI caption response");
    return input.platforms.map((platform) => ({
      platform,
      text: `Check out our amazing ${input.productName}! Perfect for your ${input.niche} needs.`,
    }));
  }
}

interface BroadcastGenerateInput {
  niche: string;
  promotionType: string;
  audience: string;
  discountPercentage?: number | null;
  productName: string;
  businessName: string;
}

export async function generateBroadcastAI(input: BroadcastGenerateInput): Promise<{ message: string; subject: string }> {
  const openai = getOpenAIClient();

  const discountLine = input.discountPercentage ? `Discount: ${input.discountPercentage}% off` : "";

  const prompt = `You are a WhatsApp marketing expert for social commerce businesses. Create a broadcast message:

Business: ${input.businessName}
Niche: ${input.niche}
Product: ${input.productName}
Promotion Type: ${input.promotionType}
Target Audience: ${input.audience}
${discountLine}

Write a WhatsApp broadcast message that:
- Feels personal and conversational
- Has urgency where appropriate
- Is concise (under 300 words)
- Uses line breaks for readability
- Ends with a clear call to action
- Does NOT use hashtags (it's WhatsApp, not Instagram)

Also provide a short subject/title for this broadcast (under 10 words).

Respond ONLY as JSON: {"message": "...", "subject": "..."}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    max_tokens: 800,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      message: parsed.message ?? "Hi! We have an exciting offer just for you. Reply to learn more!",
      subject: parsed.subject ?? `${input.promotionType} - ${input.businessName}`,
    };
  } catch {
    logger.error({ content }, "Failed to parse AI broadcast response");
    return {
      message: `Hi! We have an exciting ${input.promotionType} offer just for you at ${input.businessName}. Reply to learn more!`,
      subject: `${input.promotionType} - ${input.businessName}`,
    };
  }
}
