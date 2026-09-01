import { supabase } from "../src/config/supabase.ts";

const SLUG = "the-last-guest-at-blackwood-manor";
const NIGHT = "1928-11-12";

const CASE_ID = "a1000001-0001-4000-8000-000000000001";
const CLARA_ID = "a1000001-0001-4000-8000-000000000011";
const SILAS_ID = "a1000001-0001-4000-8000-000000000012";
const JONAH_ID = "a1000001-0001-4000-8000-000000000013";
const ISOLDE_ID = "a1000001-0001-4000-8000-000000000014";

const EVIDENCE = {
  cctv: "a1000001-0001-4000-8000-000000000101",
  receipt: "a1000001-0001-4000-8000-000000000102",
  phone: "a1000001-0001-4000-8000-000000000103",
  photograph: "a1000001-0001-4000-8000-000000000104",
  statement: "a1000001-0001-4000-8000-000000000105",
  coupe: "a1000001-0001-4000-8000-000000000106",
  letter: "a1000001-0001-4000-8000-000000000107",
  glove: "a1000001-0001-4000-8000-000000000108",
  watch: "a1000001-0001-4000-8000-000000000109",
  key: "a1000001-0001-4000-8000-000000000110",
  soil: "a1000001-0001-4000-8000-000000000111",
  guestbook: "a1000001-0001-4000-8000-000000000112",
  vial: "a1000001-0001-4000-8000-000000000113",
  prints: "a1000001-0001-4000-8000-000000000114",
} as const;

function at(time: string) {
  return `${NIGHT}T${time}:00+00:00`;
}

async function assertOk<T>(
  label: string,
  result: { data: T; error: { message: string } | null }
): Promise<T> {
  if (result.error) {
    throw new Error(`Seed failed at ${label}.`);
  }
  return result.data;
}

async function removeExistingCase() {
  const existing = await supabase
    .from("cases")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing.error) {
    throw new Error("Seed failed while checking for an existing case.");
  }
  if (!existing.data) {
    return;
  }

  const groundTruth = await supabase
    .from("case_ground_truth")
    .delete()
    .eq("case_id", existing.data.id);
  if (groundTruth.error) {
    throw new Error("Seed failed while clearing existing ground truth.");
  }

  const removed = await supabase.from("cases").delete().eq("id", existing.data.id);
  if (removed.error) {
    throw new Error("Seed failed while clearing the existing case.");
  }
}

async function seed() {
  await removeExistingCase();

  await assertOk(
    "cases",
    await supabase.from("cases").insert({
      id: CASE_ID,
      title: "The Last Guest at Blackwood Manor",
      slug: SLUG,
      description:
        "A private supper at Blackwood Manor ended before the dessert wine was poured. Edmund Vale, a widower and collector of private correspondences, was found in the conservatory with the terrace doors ajar and a letter that was never signed. Three familiar faces had been invited. A fourth guest was not on the original card.",
      difficulty: "medium",
      estimated_minutes: 25,
      cover_image_url: null,
      status: "published",
    })
  );

  const suspects = [
    {
      id: CLARA_ID,
      case_id: CASE_ID,
      name: "Clara Vale",
      age: 36,
      occupation: "Widow of the Vale household",
      relationship_to_victim:
        "Sister-in-law; recently dependent on Edmund’s estate",
      bio: "Clara married into the Vale family eight years ago. After her husband’s death she remained at Blackwood under Edmund’s protection — a kindness that had begun to feel like a ledger. She sat at his right through the first four courses.",
      public_alibi:
        "Claims she left the dining room at 10:30 PM after the game course and retired to the east wing.",
      portrait_url: null,
      personality:
        "Composed, exacting, and rarely seen without a glass she does not finish. She keeps accounts, including those of affection.",
    },
    {
      id: SILAS_ID,
      case_id: CASE_ID,
      name: "Dr. Silas Rowe",
      age: 54,
      occupation: "Physician",
      relationship_to_victim: "Long-time physician and wartime acquaintance",
      bio: "Rowe attended Edmund through two winters of nervous complaints. He arrived tonight with his bag already packed, as if he expected to be needed, and was first to suggest the conservatory be closed for the season.",
      public_alibi:
        "Says he left the dining room at 10:52 PM to retrieve his medical bag from the cloakroom.",
      portrait_url: null,
      personality:
        "Soft-spoken and precise with time. He measures a room the way he measures a pulse — and dislikes being hurried.",
    },
    {
      id: JONAH_ID,
      case_id: CASE_ID,
      name: "Jonah Pike",
      age: 30,
      occupation: "Household valet",
      relationship_to_victim: "Valet to the Vale household for eleven years",
      bio: "Pike has served the Vales since he was nineteen. He keeps the keys, the cellar book, and a silence the staff describe as loyal — or convenient. He poured the champagne and knows every corridor by sound.",
      public_alibi:
        "Maintains he was polishing silver in the pantry from 10:40 PM until the house was raised.",
      portrait_url: null,
      personality:
        "Quiet, exact in his duties, and unwilling to speculate. He answers what is asked and nothing that is not.",
    },
    {
      id: ISOLDE_ID,
      case_id: CASE_ID,
      name: "Isolde Hart",
      age: 29,
      occupation: "Unlisted professional acquaintance",
      relationship_to_victim:
        "Unlisted guest; arrived late claiming a private matter with Edmund",
      bio: "Little is recorded of Miss Hart. The guest book shows no prior visit. She arrived twenty minutes late, declined wine, and asked twice to see the conservatory before supper was finished. She claims a professional matter that could not wait until morning.",
      public_alibi:
        "Says she was in the gallery studying the portraits when the clock struck eleven.",
      portrait_url: null,
      personality:
        "Self-possessed and economical with words. She watches doors more than faces, and does not drink when others do.",
    },
  ];

  await assertOk("suspects", await supabase.from("suspects").insert(suspects));

  const evidence = [
    {
      id: EVIDENCE.cctv,
      case_id: CASE_ID,
      title: "West Hallway Plate",
      type: "cctv",
      description:
        "A house camera plate above the west corridor recorded a figure passing toward the conservatory at 11:08 PM. The face is lost to the lamp glare.",
      file_url: null,
      location_found: "West hallway, first floor",
      discovered_by_default: true,
      is_red_herring: true,
      importance: "high",
    },
    {
      id: EVIDENCE.receipt,
      case_id: CASE_ID,
      title: "Cellar Receipt",
      type: "receipt",
      description:
        "A torn receipt for a 1919 champagne, charged to C. Vale two days before the supper. The second bottle was never entered in the cellar book.",
      file_url: null,
      location_found: "Butler’s ledger, pantry",
      discovered_by_default: true,
      is_red_herring: true,
      importance: "medium",
    },
    {
      id: EVIDENCE.phone,
      case_id: CASE_ID,
      title: "House Telephone Slip",
      type: "phone",
      description:
        "A message taken at the hall telephone: “Do not sign it until I arrive.” The operator logged the call under Hart, I.",
      file_url: null,
      location_found: "Front hall telephone",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.photograph,
      case_id: CASE_ID,
      title: "Supper Photograph",
      type: "photograph",
      description:
        "A plate taken before the fish course. Edmund is smiling. Clara’s hand is not on the table. Isolde is turned toward the terrace doors.",
      file_url: null,
      location_found: "Dining room",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "medium",
    },
    {
      id: EVIDENCE.statement,
      case_id: CASE_ID,
      title: "Kitchen Statement",
      type: "statement",
      description:
        "The kitchen maid heard Dr. Rowe in the cloakroom after 10:50 PM, then a second voice she could not name. She did not see who left for the conservatory.",
      file_url: null,
      location_found: "Servants’ hall",
      discovered_by_default: true,
      is_red_herring: true,
      importance: "medium",
    },
    {
      id: EVIDENCE.coupe,
      case_id: CASE_ID,
      title: "Broken Champagne Coupe",
      type: "object",
      description:
        "A crystal coupe shattered on the conservatory tiles. The stem is intact. There is no champagne in the glass — only a pale residue.",
      file_url: null,
      location_found: "Conservatory floor",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.letter,
      case_id: CASE_ID,
      title: "Unsigned Letter",
      type: "object",
      description:
        "A letter on cream stock, half-finished, in Edmund’s hand. It begins “If you have come for what I kept—” and ends without a signature.",
      file_url: null,
      location_found: "Conservatory writing table",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.glove,
      case_id: CASE_ID,
      title: "Muddy Evening Glove",
      type: "object",
      description:
        "A left evening glove, damp at the fingertips, found beneath the terrace step. The pair belongs to the household set issued to staff.",
      file_url: null,
      location_found: "Terrace, south door",
      discovered_by_default: true,
      is_red_herring: true,
      importance: "medium",
    },
    {
      id: EVIDENCE.watch,
      case_id: CASE_ID,
      title: "Stopped Pocket Watch",
      type: "object",
      description:
        "Edmund’s watch, face cracked, hands fixed at 11:17. It was not on his person. It was in the study, as if set down and never collected.",
      file_url: null,
      location_found: "Study, writing desk",
      discovered_by_default: true,
      is_red_herring: true,
      importance: "high",
    },
    {
      id: EVIDENCE.key,
      case_id: CASE_ID,
      title: "Study Key",
      type: "object",
      description:
        "The spare key to the study is missing from the valet’s board in the servants’ passage.",
      file_url: null,
      location_found: "Key board, servants’ passage",
      discovered_by_default: false,
      is_red_herring: true,
      importance: "low",
    },
    {
      id: EVIDENCE.soil,
      case_id: CASE_ID,
      title: "Conservatory Soil",
      type: "object",
      description:
        "A transfer of dark soil from the terrace beds, found on a woman’s hem near the conservatory threshold.",
      file_url: null,
      location_found: "Conservatory threshold",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "high",
    },
    {
      id: EVIDENCE.guestbook,
      case_id: CASE_ID,
      title: "Guest Book Page",
      type: "photograph",
      description:
        "The page for 12 November lists Clara Vale, Dr. S. Rowe, and the household. No Hart is written. A later hand added a mark in the margin after midnight.",
      file_url: null,
      location_found: "Entrance hall",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "medium",
    },
    {
      id: EVIDENCE.vial,
      case_id: CASE_ID,
      title: "Pharmacy Vial",
      type: "object",
      description:
        "A small vial from Rowe’s bag, unlabelled except for a date two winters past. The stopper is tight. Nothing has been poured from it tonight.",
      file_url: null,
      location_found: "Physician’s bag, cloakroom",
      discovered_by_default: false,
      is_red_herring: true,
      importance: "low",
    },
    {
      id: EVIDENCE.prints,
      case_id: CASE_ID,
      title: "Blotter Fingerprints",
      type: "object",
      description:
        "A partial left-hand print on the conservatory blotter beside the unfinished letter. It does not match the household staff set. The ink is still slightly tacky.",
      file_url: null,
      location_found: "Conservatory writing table",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "high",
    },
  ];

  await assertOk("evidence", await supabase.from("evidence").insert(evidence));

  const timeline = [
    {
      sequence: 1,
      event_time: at("20:45"),
      public_description:
        "Clara Vale and Dr. Rowe are received in the hall. Jonah Pike takes their coats. The guest book is opened for the evening.",
      hidden_description:
        "The original card listed three names besides the host. No fourth place was set until Edmund spoke to Pike at 8:50.",
      related_suspect_id: CLARA_ID,
      related_evidence_id: EVIDENCE.guestbook,
    },
    {
      sequence: 2,
      event_time: at("21:14"),
      public_description:
        "The hall telephone takes a message: “Do not sign it until I arrive.” The operator logs the call under Hart, I.",
      hidden_description:
        "The wording concerns a signature, not an arrival time. Edmund was already writing when the slip reached the dining room.",
      related_suspect_id: ISOLDE_ID,
      related_evidence_id: EVIDENCE.phone,
    },
    {
      sequence: 3,
      event_time: at("21:35"),
      public_description:
        "Isolde Hart arrives twenty minutes after the soup. She declines wine and asks the way to the conservatory before she is seated.",
      hidden_description:
        "Pike told her the glasshouse was closed for the evening. She asked a second time before the fish course.",
      related_suspect_id: ISOLDE_ID,
      related_evidence_id: EVIDENCE.guestbook,
    },
    {
      sequence: 4,
      event_time: at("21:50"),
      public_description:
        "A photograph is taken before the fish course. Edmund is smiling. Isolde is turned toward the terrace doors.",
      hidden_description:
        "Clara’s missing hand is only a folded napkin. Isolde’s chair is angled to the glass doors, not to the camera.",
      related_suspect_id: ISOLDE_ID,
      related_evidence_id: EVIDENCE.photograph,
    },
    {
      sequence: 5,
      event_time: at("22:30"),
      public_description:
        "Clara Vale excuses herself after the game course and says she is retiring to the east wing. No staff confirm her on the stair.",
      hidden_description:
        "The east-wing lamp was not lit when a maid passed at 10:48. The servants’ stair was unlocked.",
      related_suspect_id: CLARA_ID,
      related_evidence_id: EVIDENCE.receipt,
    },
    {
      sequence: 6,
      event_time: at("22:40"),
      public_description:
        "Jonah Pike leaves the dining room with the silver and says he will be in the pantry until he is called.",
      hidden_description:
        "A kitchen boy saw him there at 10:47 and again at 11:12. The west hall is not visible from the pantry.",
      related_suspect_id: JONAH_ID,
      related_evidence_id: EVIDENCE.glove,
    },
    {
      sequence: 7,
      event_time: at("22:42"),
      public_description:
        "Edmund Vale crosses the inner hall with a folded letter. The study lamp is lit.",
      hidden_description:
        "He set his watch on the study blotter and did not take it with him. The lamp was put out six minutes later.",
      related_suspect_id: null,
      related_evidence_id: EVIDENCE.watch,
    },
    {
      sequence: 8,
      event_time: at("22:48"),
      public_description:
        "The study lamp goes dark. Edmund is next seen turning toward the west corridor, still carrying paper.",
      hidden_description:
        "The spare study key is already missing from the board by this hour. Edmund used his own key.",
      related_suspect_id: null,
      related_evidence_id: EVIDENCE.key,
    },
    {
      sequence: 9,
      event_time: at("22:52"),
      public_description:
        "Dr. Rowe rises without finishing his wine and walks toward the cloakroom, citing a forgotten bag.",
      hidden_description:
        "The bag was packed before supper. The second voice in the cloakroom belongs to a footman asking after liniment, not to a conspirator.",
      related_suspect_id: SILAS_ID,
      related_evidence_id: EVIDENCE.statement,
    },
    {
      sequence: 10,
      event_time: at("23:02"),
      public_description:
        "A portrait light is found burning in the gallery. Isolde Hart says she was alone with the family pictures when the clock struck eleven.",
      hidden_description:
        "The gallery door was heard to close again before 11:06. No one remained to confirm she stayed.",
      related_suspect_id: ISOLDE_ID,
      related_evidence_id: null,
    },
    {
      sequence: 11,
      event_time: at("23:05"),
      public_description:
        "A maid is asked, for the second time that night, the shortest way to the conservatory. She does not recall the speaker’s name.",
      hidden_description:
        "She later said the voice was a woman’s, and not Clara’s.",
      related_suspect_id: ISOLDE_ID,
      related_evidence_id: EVIDENCE.soil,
    },
    {
      sequence: 12,
      event_time: at("23:08"),
      public_description:
        "The west hallway plate records a figure moving toward the conservatory. The face is unreadable in the lamp glare.",
      hidden_description:
        "The silhouette is slighter than Pike’s and shows the line of a dinner dress, not a valet’s coat.",
      related_suspect_id: ISOLDE_ID,
      related_evidence_id: EVIDENCE.cctv,
    },
    {
      sequence: 13,
      event_time: at("23:17"),
      public_description:
        "Edmund’s pocket watch is later found stopped at 11:17. The conservatory terrace doors are found ajar shortly afterward.",
      hidden_description:
        "The watch stopped in the study where Edmund left it; the hands were not an instrument of the blow. The hour still matches the glasshouse.",
      related_suspect_id: null,
      related_evidence_id: EVIDENCE.watch,
    },
    {
      sequence: 14,
      event_time: at("23:31"),
      public_description:
        "Pike raises the house. Edmund is found on the conservatory tiles. The coupe is broken. The letter is unsigned. A household glove is found under the terrace step at 11:44.",
      hidden_description:
        "The glove is from the staff pair Pike uses on wet nights and was dropped when he opened the terrace to call for help, not before the incident.",
      related_suspect_id: JONAH_ID,
      related_evidence_id: EVIDENCE.coupe,
    },
  ].map((event) => ({
    case_id: CASE_ID,
    ...event,
  }));

  await assertOk(
    "timeline_events",
    await supabase.from("timeline_events").insert(timeline)
  );

  await assertOk(
    "case_ground_truth",
    await supabase.from("case_ground_truth").insert({
      case_id: CASE_ID,
      culprit_id: ISOLDE_ID,
      motive:
        "A private correspondence Edmund Vale would not surrender or sign. Isolde came to collect letters that bound her name to his; he began a reply and refused to finish it.",
      method:
        "A blow with a champagne coupe already cracked in the glasshouse. The pale residue is wine left in the broken bowl, not a poured poison.",
      time_of_crime: at("23:17"),
      location: "Conservatory, Blackwood Manor",
      solution_explanation:
        "Isolde Hart was never on the supper card. She telephoned at 9:14 to stop Edmund signing whatever he had begun, then arrived late and asked twice for the conservatory. Her gallery alibi covers the stroke of eleven only; by 11:05 a woman who was not Clara asked again for the glasshouse, and at 11:08 the west plate recorded a slight figure in a dinner dress, not Pike. Edmund had already left his watch on the study desk at 10:42 and carried the unfinished letter west. In the conservatory she confronted him over the packet he kept. He would not sign. The cracked coupe was on the writing table; it was used as the instrument and left with only a pale wine residue. Soil from the terrace beds marked a woman’s hem. A partial print on the blotter is not staff. Clara’s champagne receipt, Rowe’s packed bag and vial, Pike’s pantry hour, the household glove, the missing study key, and the watch’s resting place in the study are all consistent with other people’s evenings — not with the blow. The true hour is 11:17 in the conservatory. Isolde Hart is the last guest.",
    })
  );

  const [cases, suspectRows, evidenceRows, timelineRows] = await Promise.all([
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("id", CASE_ID),
    supabase
      .from("suspects")
      .select("id", { count: "exact", head: true })
      .eq("case_id", CASE_ID),
    supabase
      .from("evidence")
      .select("id", { count: "exact", head: true })
      .eq("case_id", CASE_ID),
    supabase
      .from("timeline_events")
      .select("id", { count: "exact", head: true })
      .eq("case_id", CASE_ID),
  ]);

  if (
    cases.error ||
    suspectRows.error ||
    evidenceRows.error ||
    timelineRows.error
  ) {
    throw new Error("Seed finished but verification queries failed.");
  }

  console.log("Blackwood case seeded.");
  console.log(`cases: ${cases.count ?? 0}`);
  console.log(`suspects: ${suspectRows.count ?? 0}`);
  console.log(`evidence: ${evidenceRows.count ?? 0}`);
  console.log(`timeline_events: ${timelineRows.count ?? 0}`);
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Seed failed.";
  console.error(message);
  process.exit(1);
});
