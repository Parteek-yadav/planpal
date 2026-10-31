import { EventType } from "../event/types";
import { TimelineMilestone, RunOfShowItem, TimelinePhase, MilestonePriority } from "./types";

interface MilestoneBlueprint {
  readonly phase: TimelinePhase;
  readonly title: string;
  readonly description: string;
  readonly daysBefore: number;
  readonly priority: MilestonePriority;
}

const WEDDING_BLUEPRINTS: readonly MilestoneBlueprint[] = [
  {
    phase: "concept_budget",
    title: "Finalize Guest Count & Set Budget Cap",
    description: "Align on non-negotiable elements and maximum financial ceiling.",
    daysBefore: 270,
    priority: "high"
  },
  {
    phase: "concept_budget",
    title: "Secure Ceremony & Reception Venues",
    description: "Sign venue agreement and reserve event dates.",
    daysBefore: 240,
    priority: "high"
  },
  {
    phase: "vendor_booking",
    title: "Book Photographer, Videographer & Catering",
    description: "Top creative vendors book out 9-12 months ahead.",
    daysBefore: 180,
    priority: "high"
  },
  {
    phase: "vendor_booking",
    title: "Select Wedding Attire & Bridal Party Outfits",
    description: "Order dress and suits allowing 4-6 months for alterations.",
    daysBefore: 150,
    priority: "medium"
  },
  {
    phase: "detailed_coordination",
    title: "Send Formal Invitations & Track RSVPs",
    description: "Collect dietary requirements and seating preferences.",
    daysBefore: 60,
    priority: "high"
  },
  {
    phase: "final_countdown",
    title: "Finalize Seating Chart & Vendor Headcounts",
    description: "Deliver confirmed meal counts to catering manager.",
    daysBefore: 14,
    priority: "high"
  },
  {
    phase: "day_of",
    title: "Conduct Wedding Rehearsal & Distribute Day-Of Kits",
    description: "Walkthrough with wedding party and officiant.",
    daysBefore: 1,
    priority: "medium"
  }
];

const BIRTHDAY_BLUEPRINTS: readonly MilestoneBlueprint[] = [
  {
    phase: "concept_budget",
    title: "Choose Birthday Theme & Reserve Venue",
    description: "Lock in date, party theme, and party room or home setup.",
    daysBefore: 45,
    priority: "high"
  },
  {
    phase: "vendor_booking",
    title: "Book Entertainer / DJ & Order Custom Cake",
    description: "Arrange magician, face painter, or DJ plus bakery order.",
    daysBefore: 30,
    priority: "high"
  },
  {
    phase: "detailed_coordination",
    title: "Send Digital Invitations & Collect RSVPs",
    description: "Confirm head count for goodie bags and food ordering.",
    daysBefore: 21,
    priority: "medium"
  },
  {
    phase: "final_countdown",
    title: "Purchase Decorations, Tableware & Favors",
    description: "Balloons, banners, tableware, and party favor bags.",
    daysBefore: 7,
    priority: "medium"
  },
  {
    phase: "day_of",
    title: "Venue Setup & Cake Pickup",
    description: "Set up balloon arches, sound check, and position dessert table.",
    daysBefore: 0,
    priority: "high"
  }
];

const COMMUNITY_BLUEPRINTS: readonly MilestoneBlueprint[] = [
  {
    phase: "concept_budget",
    title: "Secure Municipal Permits & Facility Insurance",
    description: "Obtain city sound, park usage, and food assembly permits.",
    daysBefore: 90,
    priority: "high"
  },
  {
    phase: "vendor_booking",
    title: "Recruit Volunteer Leads & Book AV Equipment",
    description: "Confirm stage, microphones, generators, and volunteer captains.",
    daysBefore: 60,
    priority: "high"
  },
  {
    phase: "detailed_coordination",
    title: "Launch Public Promotion & Signage Printing",
    description: "Distribute community posters, social posts, and banners.",
    daysBefore: 30,
    priority: "medium"
  },
  {
    phase: "final_countdown",
    title: "Conduct Volunteer Orientation & Safety Walkthrough",
    description: "Review first aid, emergency exits, and shift assignments.",
    daysBefore: 7,
    priority: "high"
  },
  {
    phase: "day_of",
    title: "Site Setup, Staging & Registration Check-In",
    description: "Erect canopies, establish info desk, test sound levels.",
    daysBefore: 0,
    priority: "high"
  }
];

/**
 * Computes calendar date YYYY-MM-DD by subtracting days from event date.
 *
 * @param eventDate - ISO string date YYYY-MM-DD of the event.
 * @param daysBefore - Number of days prior to event.
 * @returns Target calendar date in YYYY-MM-DD format.
 */
export function computeTargetCalendarDate(eventDate: string, daysBefore: number): string {
  const [year, month, day] = eventDate.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));
  target.setUTCDate(target.getUTCDate() - daysBefore);
  return target.toISOString().split("T")[0];
}

/**
 * Generates milestone checklist customized for the event archetype and calendar date.
 *
 * @param eventType - Event archetype (wedding, birthday, community).
 * @param eventDate - Event date in YYYY-MM-DD format.
 * @returns Array of initialized TimelineMilestone items.
 */
export function generateMilestones(
  eventType: EventType,
  eventDate: string
): TimelineMilestone[] {
  const blueprints =
    eventType === "wedding"
      ? WEDDING_BLUEPRINTS
      : eventType === "birthday"
        ? BIRTHDAY_BLUEPRINTS
        : COMMUNITY_BLUEPRINTS;

  return blueprints.map((bp, idx) => ({
    id: `milestone-${eventType}-${idx + 1}`,
    phase: bp.phase,
    title: bp.title,
    description: bp.description,
    targetDaysBeforeEvent: bp.daysBefore,
    targetDate: computeTargetCalendarDate(eventDate, bp.daysBefore),
    isCompleted: false,
    priority: bp.priority
  }));
}

/**
 * Generates a standard day-of run-of-show schedule tailored to the event archetype.
 *
 * @param eventType - Event archetype.
 * @returns Array of RunOfShowItem objects in chronological sequence.
 */
export function generateDefaultRunOfShow(eventType: EventType): RunOfShowItem[] {
  if (eventType === "wedding") {
    return [
      {
        id: "ros-1",
        time: "10:00",
        activity: "Hair, Makeup & Wedding Attire Prep",
        leadPerson: "Bridal Party Lead",
        location: "Bridal Suite",
        isCompleted: false
      },
      {
        id: "ros-2",
        time: "13:00",
        activity: "First Look & Couple Portraits",
        leadPerson: "Lead Photographer",
        location: "Garden Pavilion",
        isCompleted: false
      },
      {
        id: "ros-3",
        time: "15:30",
        activity: "Guest Arrival & Welcome Refreshments",
        leadPerson: "Venue Host",
        location: "Foyer",
        isCompleted: false
      },
      {
        id: "ros-4",
        time: "16:00",
        activity: "Ceremony Processional & Vows",
        leadPerson: "Officiant",
        location: "Main Sanctuary",
        isCompleted: false
      },
      {
        id: "ros-5",
        time: "17:00",
        activity: "Cocktail Hour & Extended Family Photos",
        leadPerson: "Catering Lead",
        location: "Terrace Courtyard",
        isCompleted: false
      },
      {
        id: "ros-6",
        time: "18:30",
        activity: "Grand Entrance & Plated Dinner",
        leadPerson: "DJ / MC",
        location: "Grand Ballroom",
        isCompleted: false
      },
      {
        id: "ros-7",
        time: "20:00",
        activity: "Toasts, Cake Cutting & First Dance",
        leadPerson: "Maid of Honor & Best Man",
        location: "Ballroom Dance Floor",
        isCompleted: false
      },
      {
        id: "ros-8",
        time: "22:30",
        activity: "Sparkler Send-Off & Teardown",
        leadPerson: "Event Coordinator",
        location: "Front Plaza",
        isCompleted: false
      }
    ];
  }

  if (eventType === "birthday") {
    return [
      {
        id: "ros-1",
        time: "13:00",
        activity: "Host Arrival, Balloon Arch & Decor Setup",
        leadPerson: "Party Host",
        location: "Main Party Room",
        isCompleted: false
      },
      {
        id: "ros-2",
        time: "14:00",
        activity: "Guest Welcome & Free Play / Mingling",
        leadPerson: "Greeting Helper",
        location: "Entrance Area",
        isCompleted: false
      },
      {
        id: "ros-3",
        time: "14:45",
        activity: "Organized Games & Entertainment Show",
        leadPerson: "Entertainer / Magician",
        location: "Central Activity Mat",
        isCompleted: false
      },
      {
        id: "ros-4",
        time: "15:45",
        activity: "Happy Birthday Chorus & Cake Cutting",
        leadPerson: "Party Host",
        location: "Dessert Table",
        isCompleted: false
      },
      {
        id: "ros-5",
        time: "16:30",
        activity: "Party Favor Bags & Guest Farewell",
        leadPerson: "Host Helper",
        location: "Exit Hallway",
        isCompleted: false
      }
    ];
  }

  return [
    {
      id: "ros-1",
      time: "07:30",
      activity: "Site Load-In, Canopy Setup & Power Hookup",
      leadPerson: "Logistics Lead",
      location: "Community Park Grounds",
      isCompleted: false
    },
    {
      id: "ros-2",
      time: "08:30",
      activity: "Volunteer Briefing & First-Aid Check",
      leadPerson: "Volunteer Coordinator",
      location: "Information Tent",
      isCompleted: false
    },
    {
      id: "ros-3",
      time: "09:30",
      activity: "Official Welcome & Community Keynote",
      leadPerson: "Master of Ceremonies",
      location: "Main Stage",
      isCompleted: false
    },
    {
      id: "ros-4",
      time: "11:30",
      activity: "Food Truck Service & Community Activities",
      leadPerson: "Vendor Captain",
      location: "Food Pavilion",
      isCompleted: false
    },
    {
      id: "ros-5",
      time: "14:30",
      activity: "Closing Remarks & Volunteer Cleanup Sweep",
      leadPerson: "Event Director",
      location: "Entire Grounds",
      isCompleted: false
    }
  ];
}

/**
 * Toggles completion status of a target milestone item.
 *
 * @param milestones - Read-only array of milestones.
 * @param milestoneId - Unique ID of milestone to toggle.
 * @returns New array with targeted milestone toggled.
 */
export function toggleMilestoneStatus(
  milestones: readonly TimelineMilestone[],
  milestoneId: string
): TimelineMilestone[] {
  return milestones.map((m) =>
    m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
  );
}

/**
 * Calculates overall completion percentage of a milestone list.
 *
 * @param milestones - Read-only array of milestones.
 * @returns Integer percentage between 0 and 100.
 */
export function calculatePlanningProgress(
  milestones: readonly TimelineMilestone[]
): number {
  if (milestones.length === 0) return 0;
  const completed = milestones.filter((m) => m.isCompleted).length;
  return Math.round((completed / milestones.length) * 100);
}
