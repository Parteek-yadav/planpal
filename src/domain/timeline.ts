import { EventType } from "./event/types";
import { EventProfile } from "./eventProfile";
import { TimelinePhase, MilestonePriority } from "./timeline/types";

export interface TimelineMilestoneItem {
  readonly id: string;
  readonly phase: TimelinePhase;
  readonly title: string;
  readonly description: string;
  readonly targetDaysBeforeEvent: number;
  readonly daysBeforeEvent: number; // alias
  readonly nominalDaysBefore: number;
  readonly targetDate: string; // YYYY-MM-DD
  readonly nominalTargetDate: string;
  readonly isCompleted: boolean;
  readonly isOverdue: boolean;
  readonly overdue: boolean; // alias
  readonly isCompressed: boolean;
  readonly priority: MilestonePriority;
}

interface MilestoneBlueprint {
  readonly phase: TimelinePhase;
  readonly title: string;
  readonly description: string;
  readonly daysBefore: number; // standard nominal days before event
  readonly minDaysBefore: number; // minimum viable days before event
  readonly priority: MilestonePriority;
}

export const TIMELINE_BLUEPRINTS: Record<EventType, readonly MilestoneBlueprint[]> = {
  wedding: [
    {
      phase: "concept_budget",
      title: "Finalize Guest Count & Set Budget Cap",
      description: "Align on non-negotiable elements and maximum financial ceiling.",
      daysBefore: 270,
      minDaysBefore: 30,
      priority: "high",
    },
    {
      phase: "concept_budget",
      title: "Secure Ceremony & Reception Venues",
      description: "Sign venue agreement and reserve event dates.",
      daysBefore: 240,
      minDaysBefore: 21,
      priority: "high",
    },
    {
      phase: "vendor_booking",
      title: "Book Photographer, Videographer & Catering",
      description: "Top creative vendors book out 9-12 months ahead.",
      daysBefore: 180,
      minDaysBefore: 14,
      priority: "high",
    },
    {
      phase: "vendor_booking",
      title: "Select Wedding Attire & Bridal Party Outfits",
      description: "Order dress and suits allowing time for alterations.",
      daysBefore: 150,
      minDaysBefore: 10,
      priority: "medium",
    },
    {
      phase: "detailed_coordination",
      title: "Send Formal Invitations & Track RSVPs",
      description: "Collect dietary requirements and seating preferences.",
      daysBefore: 60,
      minDaysBefore: 7,
      priority: "high",
    },
    {
      phase: "final_countdown",
      title: "Finalize Seating Chart & Vendor Headcounts",
      description: "Deliver confirmed meal counts to catering manager.",
      daysBefore: 14,
      minDaysBefore: 3,
      priority: "high",
    },
    {
      phase: "day_of",
      title: "Conduct Wedding Rehearsal & Day-Of Prep",
      description: "Walkthrough ceremony processional with wedding party and officiant.",
      daysBefore: 1,
      minDaysBefore: 1,
      priority: "medium",
    },
    {
      phase: "day_of",
      title: "Wedding Day Execution",
      description:
        "Coordinate day-of itinerary, ceremony, reception, and vendor load-out.",
      daysBefore: 0,
      minDaysBefore: 0,
      priority: "high",
    },
  ],
  birthday: [
    {
      phase: "concept_budget",
      title: "Choose Birthday Theme & Reserve Venue",
      description: "Lock in date, party theme, and venue or home setup.",
      daysBefore: 45,
      minDaysBefore: 14,
      priority: "high",
    },
    {
      phase: "vendor_booking",
      title: "Book Entertainer / DJ & Order Custom Cake",
      description: "Arrange entertainer or DJ plus specialty bakery order.",
      daysBefore: 30,
      minDaysBefore: 10,
      priority: "high",
    },
    {
      phase: "detailed_coordination",
      title: "Send Digital Invitations & Collect RSVPs",
      description: "Confirm head count for goodie bags and catering.",
      daysBefore: 21,
      minDaysBefore: 7,
      priority: "medium",
    },
    {
      phase: "final_countdown",
      title: "Purchase Decorations, Tableware & Favors",
      description: "Balloons, banners, tableware, and party favor bags.",
      daysBefore: 7,
      minDaysBefore: 3,
      priority: "medium",
    },
    {
      phase: "day_of",
      title: "Venue Setup & Party Execution",
      description: "Balloons, sound check, cake display, and guest welcome.",
      daysBefore: 0,
      minDaysBefore: 0,
      priority: "high",
    },
  ],
  community: [
    {
      phase: "concept_budget",
      title: "Secure Municipal Permits & Facility Insurance",
      description: "Obtain city sound, park usage, and food assembly permits.",
      daysBefore: 90,
      minDaysBefore: 21,
      priority: "high",
    },
    {
      phase: "vendor_booking",
      title: "Recruit Volunteer Leads & Book AV Equipment",
      description: "Confirm stage, sound system, generators, and volunteer team leads.",
      daysBefore: 60,
      minDaysBefore: 14,
      priority: "high",
    },
    {
      phase: "detailed_coordination",
      title: "Launch Public Promotion & Signage Printing",
      description: "Distribute community posters, social posts, and directional banners.",
      daysBefore: 30,
      minDaysBefore: 7,
      priority: "medium",
    },
    {
      phase: "final_countdown",
      title: "Volunteer Orientation & Safety Walkthrough",
      description: "Review first aid, emergency protocols, and shift assignments.",
      daysBefore: 7,
      minDaysBefore: 2,
      priority: "high",
    },
    {
      phase: "day_of",
      title: "Site Setup, Staging & Event Execution",
      description:
        "Erect canopies, establish info booth, sound check, and attendee check-in.",
      daysBefore: 0,
      minDaysBefore: 0,
      priority: "high",
    },
  ],
};

/**
 * Computes calendar date YYYY-MM-DD by subtracting days from event date.
 * Handles leap years and variable month lengths cleanly using UTC calendar arithmetic.
 *
 * @param eventDate - ISO string date YYYY-MM-DD of the event.
 * @param daysBefore - Number of days prior to event.
 * @returns Target calendar date in YYYY-MM-DD format.
 */
export function computeTargetCalendarDate(eventDate: string, daysBefore: number): string {
  const [yearStr, monthStr, dayStr] = eventDate.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const target = new Date(Date.UTC(year, month - 1, day));
  target.setUTCDate(target.getUTCDate() - daysBefore);
  return target.toISOString().split("T")[0];
}

/**
 * Calculates calendar day difference (endDate - startDate).
 */
export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const [y1, m1, d1] = startDateStr.split("-").map(Number);
  const [y2, m2, d2] = endDateStr.split("-").map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((t2 - t1) / MS_PER_DAY);
}

/**
 * Options configuring timeline generation.
 */
export interface GenerateTimelineOptions {
  readonly currentDate?: Date | string;
  readonly compress?: boolean;
}

/**
 * Pure function: Generates backward-scheduled event planning timeline milestones.
 * Compresses gracefully when lead time is short, and flags milestones already overdue.
 *
 * @param profile - Validated EventProfile or object with eventType and date/eventDate
 * @param optionsOrCurrentDate - Optional current reference date or timeline options
 * @returns Array of TimelineMilestoneItem scheduled backwards from event date
 */
export function generateTimeline(
  profile:
    | EventProfile
    | {
        readonly eventType: EventType;
        readonly date?: string;
        readonly eventDate?: string;
      },
  optionsOrCurrentDate?: Date | string | GenerateTimelineOptions,
): TimelineMilestoneItem[] {
  const eventDate = profile.date ?? (profile as { eventDate?: string }).eventDate;

  if (!eventDate || typeof eventDate !== "string") {
    throw new TypeError("Event date must be provided in YYYY-MM-DD format");
  }

  let refDateStr: string;
  let shouldCompress = true;

  if (optionsOrCurrentDate instanceof Date || typeof optionsOrCurrentDate === "string") {
    const d =
      optionsOrCurrentDate instanceof Date
        ? optionsOrCurrentDate
        : new Date(optionsOrCurrentDate);
    refDateStr = d.toISOString().split("T")[0];
  } else if (typeof optionsOrCurrentDate === "object" && optionsOrCurrentDate !== null) {
    if (optionsOrCurrentDate.currentDate) {
      const d =
        optionsOrCurrentDate.currentDate instanceof Date
          ? optionsOrCurrentDate.currentDate
          : new Date(optionsOrCurrentDate.currentDate);
      refDateStr = d.toISOString().split("T")[0];
    } else {
      refDateStr = new Date().toISOString().split("T")[0];
    }
    if (optionsOrCurrentDate.compress !== undefined) {
      shouldCompress = optionsOrCurrentDate.compress;
    }
  } else {
    refDateStr = new Date().toISOString().split("T")[0];
  }

  const blueprints = TIMELINE_BLUEPRINTS[profile.eventType];
  if (!blueprints) {
    throw new Error(`Unsupported event type: ${profile.eventType}`);
  }

  // Calculate available lead time in days between currentDate and eventDate
  const leadTimeDays = calculateDaysBetween(refDateStr, eventDate);
  const maxNominalDays = blueprints[0]?.daysBefore ?? 0;

  return blueprints.map((bp, idx) => {
    const nominalTargetDate = computeTargetCalendarDate(eventDate, bp.daysBefore);
    const isNominalPast = bp.daysBefore > leadTimeDays || nominalTargetDate < refDateStr;

    let targetDaysBefore = bp.daysBefore;
    let isCompressed = false;

    if (shouldCompress && leadTimeDays < maxNominalDays && leadTimeDays > 0) {
      // Compress gracefully when lead time is short
      if (bp.daysBefore > 0) {
        // Proportional compression scaled to available lead time
        const scaledDays = Math.round((bp.daysBefore / maxNominalDays) * leadTimeDays);
        // Ensure milestones within available lead time don't drop below 0
        const viableDays = Math.max(0, Math.min(bp.daysBefore, scaledDays));

        if (viableDays < bp.daysBefore) {
          targetDaysBefore = viableDays;
          isCompressed = true;
        }
      }
    }

    const targetDate = computeTargetCalendarDate(eventDate, targetDaysBefore);

    // Flag milestone as overdue if target date is in the past, or if nominal deadline has elapsed
    // and milestone had to be compressed because lead time is already short.
    const isOverdue =
      targetDate < refDateStr ||
      (isNominalPast && (leadTimeDays < bp.minDaysBefore || !shouldCompress));

    return {
      id: `milestone-${profile.eventType}-${idx + 1}`,
      phase: bp.phase,
      title: bp.title,
      description: bp.description,
      targetDaysBeforeEvent: targetDaysBefore,
      daysBeforeEvent: targetDaysBefore,
      nominalDaysBefore: bp.daysBefore,
      targetDate,
      nominalTargetDate,
      isCompleted: false,
      isOverdue,
      overdue: isOverdue,
      isCompressed,
      priority: bp.priority,
    };
  });
}
