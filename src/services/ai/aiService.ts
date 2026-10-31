import { sanitizePii } from "../security/piiSanitizer";
import {
  AiPlanRequest,
  AiPlanRequestSchema,
  AiPlanSuggestion,
  AiPlanSuggestionSchema
} from "./types";

/**
 * Generates deterministic fallback event recommendations based on event parameters.
 * Ensures zero failure rate when running in offline or test mode without external API keys.
 *
 * @param request - Sanitized planning request.
 * @returns Candidate suggestion payload.
 */
function generateDeterministicSuggestions(request: AiPlanRequest): unknown {
  const { eventType, title, location, totalBudget, guestCount, theme } = request;
  const perGuestBudget = Math.round(totalBudget / guestCount);

  if (eventType === "wedding") {
    return {
      overview: `A bespoke wedding plan for "${title}" in ${location}, budgeted at $${totalBudget.toLocaleString()} ($${perGuestBudget}/guest) for ${guestCount} guests. Designed to balance ceremony elegance with reception enjoyment.`,
      themeIdeas: [
        {
          title: theme ? `${theme} Luxe` : "Modern Botanical Elegance",
          description:
            "Neutral linen textures paired with soft eucalyptus greens and warm champagne accents.",
          colorPalette: ["#2D4739", "#E8DFD8", "#CBB89D", "#FAF7F2"]
        },
        {
          title: "Sunlit Tuscan Terrace",
          description:
            "Terracotta pots, olive leaf runners, natural wood farm tables, and ambient bistro string lights.",
          colorPalette: ["#A0522D", "#6B8E23", "#D2B48C", "#FFF8DC"]
        }
      ],
      customTimelineTips: [
        {
          title: "Golden Hour Photo Buffer",
          tip: "Block out 30 minutes 45 minutes before sunset for golden hour couple portraits without rushing guests.",
          phase: "Day-of Schedule"
        },
        {
          title: "Early Sound & Lighting Check",
          tip: "Ensure DJ conducts wireless mic acoustic checks at the venue 90 minutes before ceremony start.",
          phase: "Vendor Booking"
        }
      ],
      budgetOptimizationTips: [
        {
          category: "Floral & Decor",
          savingStrategy:
            "Repurpose ceremony arbor florals onto the bridal party head table for the reception.",
          estimatedImpact: "Saves $400 - $800"
        },
        {
          category: "Stationery",
          savingStrategy:
            "Opt for digital RSVP tracking alongside elegant printed ceremony invitations.",
          estimatedImpact: "Saves $200 - $450"
        }
      ],
      contingencyPlan: {
        riskScenario: "Inclement weather during outdoor ceremony or cocktail hour",
        mitigation:
          "Secure an all-weather transparent marquee tent backup reservation with 72-hour notice clause.",
        backupOption:
          "Transition cocktail hour indoors into the venue gallery hallway with pre-positioned auxiliary bars."
      }
    };
  }

  if (eventType === "birthday") {
    return {
      overview: `A vibrant birthday celebration plan for "${title}" in ${location}, planned for ${guestCount} attendees with a $${totalBudget.toLocaleString()} budget ceiling ($${perGuestBudget}/attendee).`,
      themeIdeas: [
        {
          title: theme || "Retro Neon Glow Fest",
          description:
            "Electric color splashes, custom LED signage, glow favors, and energetic synth-pop playlist.",
          colorPalette: ["#FF007F", "#00F0FF", "#FFE600", "#1A1A24"]
        },
        {
          title: "Cozy Artisan Garden Picnic",
          description:
            "Low pallet tables with plush floor cushions, fairy lights, charcuterie boards, and polaroid photo station.",
          colorPalette: ["#795548", "#E0B973", "#81C784", "#FFF9C4"]
        }
      ],
      customTimelineTips: [
        {
          title: "Paced Activity Timing",
          tip: "Keep high-energy group activities under 45 minutes so guests have ample time to chat and enjoy treats.",
          phase: "Activity Scheduling"
        },
        {
          title: "Dessert Reveal Staging",
          tip: "Position birthday cake on a dedicated spotlight table 20 minutes before singing Happy Birthday.",
          phase: "Day-of Run-of-Show"
        }
      ],
      budgetOptimizationTips: [
        {
          category: "Decor & Favors",
          savingStrategy:
            "Create a balloon garland focal photo backdrop rather than decorating every perimeter table.",
          estimatedImpact: "Saves $150 - $300"
        },
        {
          category: "Catering",
          savingStrategy:
            "Serve family-style gourmet sliders and flatbread stations rather than individual plated dishes.",
          estimatedImpact: "Saves $300 - $600"
        }
      ],
      contingencyPlan: {
        riskScenario: "Entertainer delay or equipment failure",
        mitigation:
          "Pre-load an offline high-energy party playlist and prepare interactive trivia games with prizes.",
        backupOption:
          "Designate host co-captain to initiate team party games while contacting backup performers."
      }
    };
  }

  return {
    overview: `A community event roadmap for "${title}" in ${location}, accommodating ${guestCount} community members with a total operational budget of $${totalBudget.toLocaleString()}.`,
    themeIdeas: [
      {
        title: theme || "Together in the Park: Community Showcase",
        description:
          "Open-air pavilion layout featuring neighborhood maker booths, acoustic stage, and lawn games.",
        colorPalette: ["#1B5E20", "#F57F17", "#0277BD", "#FAFAFA"]
      },
      {
        title: "Heritage & Harmony Gathering",
        description:
          "Cultural storyboards, communal potluck / food trucks, volunteer welcome stations, and live folk music.",
        colorPalette: ["#BF360C", "#4E342E", "#FFB300", "#ECEFF1"]
      }
    ],
    customTimelineTips: [
      {
        title: "Staggered Volunteer Shifts",
        tip: "Divide volunteer shifts into 2-hour rotations to avoid volunteer burnout and maintain fresh energy.",
        phase: "Volunteer Operations"
      },
      {
        title: "Sound Check Noise Ordinance Window",
        tip: "Test microphones and audio playback strictly within the municipal permitted sound test hours.",
        phase: "Permits & Tech Check"
      }
    ],
    budgetOptimizationTips: [
      {
        category: "Equipment & Stage",
        savingStrategy:
          "Partner with local high school or civic library for microphone and canopy loan agreements.",
        estimatedImpact: "Saves $500 - $1,200"
      },
      {
        category: "Promotion",
        savingStrategy:
          "Leverage municipal bulletins, community center boards, and parent WhatsApp groups for zero-cost outreach.",
        estimatedImpact: "Saves $300 - $700"
      }
    ],
    contingencyPlan: {
      riskScenario: "Sudden rain shower or severe heat advisory",
      mitigation:
        "Reserve the adjacent civic center community gymnasium or community hall as bad-weather refuge.",
      backupOption:
        "Deploy pop-up hydration tents and hand out branded reusable umbrellas if light rain occurs."
    }
  };
}

/**
 * Sanitizes input text, constructs prompt, calls LLM or fallback engine,
 * and validates the resulting suggestions with strict Zod parsing.
 *
 * @param rawInput - Raw untrusted user event input.
 * @returns Validated, structured AiPlanSuggestion.
 * @throws Error if input or output schema validation fails.
 */
export async function generateEventPlanSuggestions(
  rawInput: unknown
): Promise<AiPlanSuggestion> {
  const parsedInput = AiPlanRequestSchema.parse(rawInput);

  // Sanitize all untrusted string fields to remove any PII before processing
  const sanitizedInput: AiPlanRequest = {
    ...parsedInput,
    title: sanitizePii(parsedInput.title),
    location: sanitizePii(parsedInput.location),
    theme: parsedInput.theme ? sanitizePii(parsedInput.theme) : undefined,
    dietaryPreferences: parsedInput.dietaryPreferences.map((d) => sanitizePii(d)),
    specialNotes: parsedInput.specialNotes ? sanitizePii(parsedInput.specialNotes) : undefined
  };

  // If a GEMINI_API_KEY is present in server environment, we can invoke Gemini API
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `You are PlanPal, a senior professional event planning AI.
Generate structured JSON suggestions for this event:
Type: ${sanitizedInput.eventType}
Title: ${sanitizedInput.title}
Date: ${sanitizedInput.date}
Guests: ${sanitizedInput.guestCount}
Budget: $${sanitizedInput.totalBudget}
Location: ${sanitizedInput.location}
Theme: ${sanitizedInput.theme || "None specified"}
Dietary: ${sanitizedInput.dietaryPreferences.join(", ") || "None"}
Notes: ${sanitizedInput.specialNotes || "None"}

You must return pure JSON matching this exact structure:
{
  "overview": string,
  "themeIdeas": [{"title": string, "description": string, "colorPalette": string[]}],
  "customTimelineTips": [{"title": string, "tip": string, "phase": string}],
  "budgetOptimizationTips": [{"category": string, "savingStrategy": string, "estimatedImpact": string}],
  "contingencyPlan": {"riskScenario": string, "mitigation": string, "backupOption": string}
}`
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.3
            }
          })
        }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const rawParsed = JSON.parse(rawJsonText);
          return AiPlanSuggestionSchema.parse(rawParsed);
        }
      }
    } catch {
      // In case of network / remote error, fall back to robust heuristic engine
    }
  }

  // Fallback to deterministic AI suggestion generator
  const candidate = generateDeterministicSuggestions(sanitizedInput);
  return AiPlanSuggestionSchema.parse(candidate);
}
