import { supabase } from "../src/config/supabase.ts";
import { countSessionsForCase, upsertRows } from "./lib/seed-case.ts";

const SLUG = "the-passenger-who-never-boarded";
const NIGHT = "1933-06-08";
const CASE_ID = "a1000003-0003-4000-8000-000000000003";
const BLACKWOOD_ID = "a1000001-0001-4000-8000-000000000001";
const FREQUENCY_ID = "a1000002-0002-4000-8000-000000000002";

const ANNETTE_ID = "a1000003-0003-4000-8000-000000000031";
const PAUL_ID = "a1000003-0003-4000-8000-000000000032";
const IRINA_ID = "a1000003-0003-4000-8000-000000000033";
const OTTO_ID = "a1000003-0003-4000-8000-000000000034";

const EVIDENCE = {
  ticket: "a1000003-0003-4000-8000-000000000301",
  ledger: "a1000003-0003-4000-8000-000000000302",
  tag: "a1000003-0003-4000-8000-000000000303",
  dining: "a1000003-0003-4000-8000-000000000304",
  telegram: "a1000003-0003-4000-8000-000000000305",
  vestibule: "a1000003-0003-4000-8000-000000000306",
  key: "a1000003-0003-4000-8000-000000000307",
  passport: "a1000003-0003-4000-8000-000000000308",
  manifest: "a1000003-0003-4000-8000-000000000309",
  countess: "a1000003-0003-4000-8000-000000000310",
  timetable: "a1000003-0003-4000-8000-000000000311",
  platform: "a1000003-0003-4000-8000-000000000312",
  coat: "a1000003-0003-4000-8000-000000000313",
  carbon: "a1000003-0003-4000-8000-000000000314",
} as const;

const TRUTH_ID = "a1000003-0003-4000-8000-000000000391";

function at(time: string) {
  const hour = Number(time.slice(0, 2));
  const day = hour < 12 ? "1933-06-09" : NIGHT;
  return `${day}T${time}:00+00:00`;
}

async function seed() {
  const blackwoodBefore = await countSessionsForCase(BLACKWOOD_ID);
  const frequencyBefore = await countSessionsForCase(FREQUENCY_ID);

  await upsertRows("case", "cases", [
    {
      id: CASE_ID,
      title: "The Passenger Who Never Boarded",
      slug: SLUG,
      description:
        "On the Paris–Vienna sleeping car of 8 June 1933, first-class berth 7-C is found locked in the morning. René Marchand’s luggage is present. His ticket is punched. Two passengers remember him in the corridor. Railway paper filled from the ticket bureau says he was aboard. A station plate and a telegraph window say he may never have boarded at all.",
      teaser:
        "An overnight train from Paris toward Vienna, 1933. A first-class berth is locked. The passenger may never have boarded.",
      difficulty: "hard",
      estimated_minutes: 30,
      cover_image_url: null,
      status: "published",
      case_number: 3,
      unlock_order: 3,
    },
  ]);

  await upsertRows("suspects", "suspects", [
    {
      id: ANNETTE_ID,
      case_id: CASE_ID,
      name: "Annette Croft",
      age: 36,
      occupation: "English secretary",
      relationship_to_victim: "Former clerk in Marchand’s Paris office; berth 7-E",
      bio: "Annette bought two first-class tickets in one visit. She knows Marchand’s grey coat and the papers he was taking to Vienna — papers that would ruin the house that still pays her. She can hold a ticket through a dark doorway and walk a corridor once in a man’s hat.",
      public_alibi:
        "Says she boarded alone with her own bag, barely knew Marchand, sat in the dining car from 9:50 PM, and then kept to berth 7-E.",
      portrait_url: null,
      personality:
        "Correct, unhurried, and fond of small denials. She will discuss soup before she will discuss a second bag.",
    },
    {
      id: PAUL_ID,
      case_id: CASE_ID,
      name: "Dr. Paul Henninger",
      age: 48,
      occupation: "Surgeon",
      relationship_to_victim: "Vienna colleague; berth 7-A; meant to meet Marchand on arrival",
      bio: "Henninger shared a visiting card with Marchand and expected a conference in Vienna. He knocked on 7-C at 10:40 PM and heard nothing. He believes he saw Marchand in the corridor at 10:15 because a grey coat passed him.",
      public_alibi:
        "Says he read in 7-A, asked the steward for mineral water at 10:00 PM and 1:00 AM, and only left his berth to knock on 7-C.",
      portrait_url: null,
      personality:
        "Precise about hours, willing to be wrong about a face in a dim corridor. He has no key to 7-C.",
    },
    {
      id: IRINA_ID,
      case_id: CASE_ID,
      name: "Countess Irina Markova",
      age: 52,
      occupation: "Travelling widow",
      relationship_to_victim: "Berth 7-B; claims she spoke to Marchand in the corridor",
      bio: "The countess is short of ready money and was seen near 7-C with the wrong key — the steward had mixed the tags. She is sure she greeted Marchand in French at 10:15; the figure only nodded. She later takes cognac in the dining car and will deny leaving her berth after dinner.",
      public_alibi:
        "Says she dined, spoke to Marchand in the corridor, and never left berth 7-B after she retired.",
      portrait_url: null,
      personality:
        "Grand in the voice, careless with keys, and ashamed of the cognac bill.",
    },
    {
      id: OTTO_ID,
      case_id: CASE_ID,
      name: "Otto Keller",
      age: 41,
      occupation: "Conductor, car 7",
      relationship_to_victim: "Punched the 7-C ticket at a half-open door",
      bio: "Keller fills the night ledger and keeps the master key. He punched Marchand’s ticket at 9:55 PM without seeing a face. He will say he always sees the face until his own line is read back to him. The spare key for 7-C went missing at Paris.",
      public_alibi:
        "Says he was punching tickets and in the staff cubicle, and that he always sees the passenger when he punches a berth.",
      portrait_url: null,
      personality:
        "Proud of the book. He hides sloppiness, not a body.",
    },
  ]);

  await upsertRows("evidence", "evidence", [
    {
      id: EVIDENCE.ticket,
      case_id: CASE_ID,
      title: "Punched ticket",
      type: "object",
      description:
        "René Marchand, Paris–Vienna, car 7 berth C. Punched at 9:55 PM. Found on the shelf of 7-C in the morning.",
      file_url: null,
      location_found: "Berth 7-C",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "high",
    },
    {
      id: EVIDENCE.ledger,
      case_id: CASE_ID,
      title: "Conductor ledger",
      type: "object",
      description:
        "Keller’s own hand: “21:55 7-C ticket shown at door, berth dark, face not seen.”",
      file_url: null,
      location_found: "Car 7 staff cubicle",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.tag,
      case_id: CASE_ID,
      title: "Luggage tag",
      type: "object",
      description:
        "Marchand’s trunk is labelled 7-C. The porter’s stamp reads “A.C. for R.M.”",
      file_url: null,
      location_found: "Luggage in 7-C",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.dining,
      case_id: CASE_ID,
      title: "Dining-car receipts",
      type: "receipt",
      description:
        "Annette Croft, 10:20 PM, consommé. Countess Markova, 11:40 PM, cognac. Both signed.",
      file_url: null,
      location_found: "Dining-car book",
      discovered_by_default: true,
      is_red_herring: true,
      importance: "medium",
    },
    {
      id: EVIDENCE.telegram,
      case_id: CASE_ID,
      title: "Ministry telegram form",
      type: "phone",
      description:
        "Handed in at Gare de l’Est at 9:18 PM, unsigned: “Marchand — collect reply window 12 before departure — Ministry.” The clerk’s sale stamp matches Annette Croft’s bureau carbon.",
      file_url: null,
      location_found: "Telegraph office copy",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.vestibule,
      case_id: CASE_ID,
      title: "Vestibule photograph",
      type: "photograph",
      description:
        "Official plate of car 7 at 9:40 PM departure. Annette Croft boards with two bags. René Marchand is not in the frame.",
      file_url: null,
      location_found: "Company plate file",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.key,
      case_id: CASE_ID,
      title: "Compartment key",
      type: "object",
      description:
        "The spare key for 7-C, missing from Keller’s board at Paris, is found in Annette’s dressing-case. Morning inspection: 7-C was locked from the corridor, not by the inside bolt.",
      file_url: null,
      location_found: "Berth 7-E dressing-case",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.passport,
      case_id: CASE_ID,
      title: "Passport copy",
      type: "object",
      description:
        "A photographic copy of Marchand’s passport page lies in 7-C on postcard stock. It is not an official duplicate.",
      file_url: null,
      location_found: "Berth 7-C writing shelf",
      discovered_by_default: false,
      is_red_herring: true,
      importance: "low",
    },
    {
      id: EVIDENCE.manifest,
      case_id: CASE_ID,
      title: "Sleeping-car manifest",
      type: "object",
      description:
        "The heading is printed at 7:00 PM from the ticket bureau: PREPARED FROM BUREAU — NOT A HEADCOUNT. Marchand is listed because a ticket was sold, not because a face was seen.",
      file_url: null,
      location_found: "Conductor’s folder",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "high",
    },
    {
      id: EVIDENCE.countess,
      case_id: CASE_ID,
      title: "Corridor statement",
      type: "statement",
      description:
        "Countess Markova: she spoke to Marchand in French at 10:15 PM in the corridor. He only nodded. She heard no voice. Dr. Henninger saw the same grey coat at the same minute.",
      file_url: null,
      location_found: "Interview file",
      discovered_by_default: true,
      is_red_herring: true,
      importance: "medium",
    },
    {
      id: EVIDENCE.timetable,
      case_id: CASE_ID,
      title: "Timetable discrepancy",
      type: "object",
      description:
        "The train leaves at 9:40 PM. Telegraph replies at window 12 are still being called until 9:45. A man at that window at 9:42 misses the departure.",
      file_url: null,
      location_found: "Station notice board copy",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "high",
    },
    {
      id: EVIDENCE.platform,
      case_id: CASE_ID,
      title: "Platform photograph",
      type: "photograph",
      description:
        "A second plate, 9:42 PM: a man matching Marchand stands at telegraph window 12. In the background the rear of the sleeping car is already moving.",
      file_url: null,
      location_found: "Station photographer’s second plate",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.coat,
      case_id: CASE_ID,
      title: "Grey coat",
      type: "object",
      description:
        "Marchand’s grey coat hangs in 7-C. The pocket holds a woman’s hairpin. The cloth smells of the same violet soap found in berth 7-E.",
      file_url: null,
      location_found: "Berth 7-C hook",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "high",
    },
    {
      id: EVIDENCE.carbon,
      case_id: CASE_ID,
      title: "Ticket-office carbon",
      type: "receipt",
      description:
        "Two first-class tickets sold in one transaction at 8:10 PM, sequential numbers, same clerk stamp: A. Croft and R. Marchand, berths 7-E and 7-C.",
      file_url: null,
      location_found: "Gare de l’Est bureau",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "critical",
    },
  ]);

  const timeline = [
    {
      id: "a1000003-0003-4000-8000-000000000351",
      sequence: 1,
      event_time: at("20:10"),
      related_suspect_id: ANNETTE_ID,
      related_evidence_id: EVIDENCE.carbon,
      public_description:
        "The ticket bureau sells two first-class seats in one visit, sequential numbers: A. Croft and R. Marchand.",
      hidden_description: "Annette buys both. Marchand has not yet arrived at the window.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000352",
      sequence: 2,
      event_time: at("21:05"),
      related_suspect_id: ANNETTE_ID,
      related_evidence_id: EVIDENCE.tag,
      public_description:
        "A porter tags Marchand’s trunk for 7-C. The stamp is A.C. for R.M.",
      hidden_description: "Annette sends the trunk aboard while Marchand is still on the platform.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000353",
      sequence: 3,
      event_time: at("21:18"),
      related_suspect_id: ANNETTE_ID,
      related_evidence_id: EVIDENCE.telegram,
      public_description:
        "A ministry telegram is handed in at the station: Marchand is to collect a reply at window 12 before departure.",
      hidden_description: "Annette paid for the form. There is no ministry. There is only a queue.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000354",
      sequence: 4,
      event_time: at("21:20"),
      related_suspect_id: ANNETTE_ID,
      related_evidence_id: EVIDENCE.telegram,
      public_description:
        "Marchand is seen on the platform with a woman near the telegraph windows.",
      hidden_description: "Annette walks him to window 12 and goes to the train with both bags.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000355",
      sequence: 5,
      event_time: at("21:35"),
      related_suspect_id: OTTO_ID,
      related_evidence_id: EVIDENCE.manifest,
      public_description: "Conductor Keller begins boarding car 7 from the bureau manifest.",
      hidden_description: "He is counting tickets, not heads.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000356",
      sequence: 6,
      event_time: at("21:40"),
      related_suspect_id: ANNETTE_ID,
      related_evidence_id: EVIDENCE.vestibule,
      public_description:
        "The train departs. The official vestibule plate shows Annette boarding with two bags and no Marchand.",
      hidden_description: "The second bag is his. She is already playing both berths.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000357",
      sequence: 7,
      event_time: at("21:42"),
      related_suspect_id: null,
      related_evidence_id: EVIDENCE.platform,
      public_description:
        "A second station plate shows a man matching Marchand at telegraph window 12. The sleeping car is already moving.",
      hidden_description: "He never reaches the step. He is still in Paris.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000358",
      sequence: 8,
      event_time: at("21:55"),
      related_suspect_id: OTTO_ID,
      related_evidence_id: EVIDENCE.ledger,
      public_description:
        "Keller punches the 7-C ticket at a half-open door. His ledger says the berth was dark and the face was not seen.",
      hidden_description: "Annette holds the ticket out from the dark. Keller is too proud to write that until he already has.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000359",
      sequence: 9,
      event_time: at("22:15"),
      related_suspect_id: IRINA_ID,
      related_evidence_id: EVIDENCE.countess,
      public_description:
        "The countess and Dr. Henninger see a grey coat in the corridor. She speaks in French. The figure only nods.",
      hidden_description: "Annette wears Marchand’s coat once so two witnesses will swear he was aboard.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000360",
      sequence: 10,
      event_time: at("22:20"),
      related_suspect_id: ANNETTE_ID,
      related_evidence_id: EVIDENCE.dining,
      public_description:
        "Annette is in the dining car in her own coat, calm, signing for consommé.",
      hidden_description: "The grey coat is already back on the hook in 7-C.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000361",
      sequence: 11,
      event_time: at("22:40"),
      related_suspect_id: PAUL_ID,
      related_evidence_id: EVIDENCE.ticket,
      public_description: "Dr. Henninger knocks on 7-C. No one answers.",
      hidden_description: "There is no one to answer. He is not part of the staging.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000362",
      sequence: 12,
      event_time: at("23:40"),
      related_suspect_id: IRINA_ID,
      related_evidence_id: EVIDENCE.dining,
      public_description: "The dining car records the countess’s cognac.",
      hidden_description: "She will later say she never left her berth after dinner.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000363",
      sequence: 13,
      event_time: at("01:10"),
      related_suspect_id: ANNETTE_ID,
      related_evidence_id: EVIDENCE.key,
      public_description:
        "The train stops at Strasbourg. No one is seen leaving 7-C. Annette does not leave the car.",
      hidden_description:
        "She has already locked 7-C from the corridor with the spare key and returned to 7-E. She does not need to get off.",
    },
    {
      id: "a1000003-0003-4000-8000-000000000364",
      sequence: 14,
      event_time: at("07:00"),
      related_suspect_id: OTTO_ID,
      related_evidence_id: EVIDENCE.key,
      public_description:
        "Morning call. 7-C does not answer. Keller uses the master key. The door was locked from the corridor. The bed is unslept. Luggage and a punched ticket are present. There is no passenger.",
      hidden_description: "The lock from outside is the last piece of theatre. Marchand was never in the berth.",
    },
  ];

  await upsertRows("timeline", "timeline_events", timeline.map((event) => ({ ...event, case_id: CASE_ID })));

  await upsertRows("ground truth", "case_ground_truth", [
    {
      id: TRUTH_ID,
      case_id: CASE_ID,
      culprit_id: ANNETTE_ID,
      motive:
        "Marchand was taking papers to Vienna that would ruin the house still paying Annette Croft. She needed him off the train and a locked berth to buy the hours until morning.",
      method:
        "Annette bought both tickets, sent his trunk aboard as A.C. for R.M., and lured him to telegraph window 12 with a false ministry wire so he missed the 9:40. She boarded with two bags, had his ticket punched from a dark doorway, walked the corridor once in his grey coat, locked 7-C from the corridor with the spare key, and returned to 7-E. The passenger never boarded.",
      time_of_crime: at("21:40"),
      location: "Gare de l’Est platform and sleeping car 7, Paris–Vienna night train",
      solution_explanation:
        "The manifest is not a headcount; it was printed from the bureau at 7:00 PM because a ticket was sold. Annette Croft bought that ticket with her own, sequential numbers, one clerk stamp. She tagged his trunk A.C. for R.M. and paid for a ministry telegram that sent him to window 12. The 9:40 vestibule plate shows her with two bags and no Marchand. The 9:42 plate shows him still at the telegraph window while the car is moving. Keller’s ledger admits the 9:55 punch was a dark berth and no face. At 10:15 a grey coat nodded in the corridor and did not speak; the coat later holds a hairpin and 7-E’s violet soap. Annette is in the dining car at 10:20 in her own coat. 7-C was locked from the corridor. The spare key is in her dressing-case. René Marchand never boarded. The locked compartment was arranged so morning would look like a disappearance. Annette Croft is the passenger who was never there — and the woman who was.",
    },
  ]);

  const blackwoodAfter = await countSessionsForCase(BLACKWOOD_ID);
  const frequencyAfter = await countSessionsForCase(FREQUENCY_ID);
  if (blackwoodAfter !== blackwoodBefore || frequencyAfter !== frequencyBefore) {
    throw new Error("Seed refused: existing sessions changed while adding Case #003.");
  }

  console.log("Seeded Case #003 The Passenger Who Never Boarded");
  console.log(`case_id: ${CASE_ID}`);
  console.log("suspects: 4  evidence: 14  timeline: 14");
  console.log(`Case #001 sessions preserved: ${blackwoodAfter}`);
  console.log(`Case #002 sessions preserved: ${frequencyAfter}`);
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to seed Case #003.");
  process.exit(1);
});
