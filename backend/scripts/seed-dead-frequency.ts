import { supabase } from "../src/config/supabase.ts";
import { countSessionsForCase, upsertRows } from "./lib/seed-case.ts";

const SLUG = "the-dead-frequency";
const NIGHT = "1931-03-14";
const CASE_ID = "a1000002-0002-4000-8000-000000000002";
const BLACKWOOD_ID = "a1000001-0001-4000-8000-000000000001";

const VERA_ID = "a1000002-0002-4000-8000-000000000021";
const ARTHUR_ID = "a1000002-0002-4000-8000-000000000022";
const MIRIAM_ID = "a1000002-0002-4000-8000-000000000023";
const TOMMY_ID = "a1000002-0002-4000-8000-000000000024";

const EVIDENCE = {
  log: "a1000002-0002-4000-8000-000000000201",
  chart: "a1000002-0002-4000-8000-000000000202",
  notes: "a1000002-0002-4000-8000-000000000203",
  disc: "a1000002-0002-4000-8000-000000000204",
  generator: "a1000002-0002-4000-8000-000000000205",
  telegram: "a1000002-0002-4000-8000-000000000206",
  access: "a1000002-0002-4000-8000-000000000207",
  photo: "a1000002-0002-4000-8000-000000000208",
  cafe: "a1000002-0002-4000-8000-000000000209",
  condenser: "a1000002-0002-4000-8000-000000000210",
  patents: "a1000002-0002-4000-8000-000000000211",
  hatch: "a1000002-0002-4000-8000-000000000212",
  notebook: "a1000002-0002-4000-8000-000000000213",
  roof: "a1000002-0002-4000-8000-000000000214",
} as const;

const TRUTH_ID = "a1000002-0002-4000-8000-000000000291";

function at(time: string) {
  const day = time.startsWith("00:") ? "1931-03-15" : NIGHT;
  return `${day}T${time}:00+00:00`;
}

async function seed() {
  const blackwoodSessionsBefore = await countSessionsForCase(BLACKWOOD_ID);

  await upsertRows("case", "cases", [
    {
      id: CASE_ID,
      title: "The Dead Frequency",
      slug: SLUG,
      description:
        "Station Vox-9, a private experimental shortwave room in Limehouse, went to midnight with its founder at the console. Several seconds of silence followed, then a repeating tone. Julian Crowe was found dead inside the locked transmission room. The door log shows nobody entered. Someone still altered what the station recorded.",
      teaser:
        "A private experimental station in London, 1931. A midnight broadcast ends in silence — and a locked room.",
      difficulty: "medium",
      estimated_minutes: 30,
      cover_image_url: null,
      status: "published",
      case_number: 2,
      unlock_order: 2,
    },
  ]);

  await upsertRows("suspects", "suspects", [
    {
      id: VERA_ID,
      case_id: CASE_ID,
      name: "Vera Lang",
      age: 34,
      occupation: "Chief engineer",
      relationship_to_victim: "Built the transmitter with Julian; her oscillator is in the sale papers",
      bio: "Vera wired Vox-9 from a warehouse shell. She oils hatches, signs out spares, and keeps the generator book. She knows the aerial-feed hatch opens into the valve closet behind the console — a space the listening-gallery glass does not show.",
      public_alibi:
        "Says she was in the generator shed from 11:20 PM until the tone, checking the diesel, and came running when she heard OSC-3.",
      portrait_url: null,
      personality:
        "Exact, tired, and proud of work she will not see given away. She answers technical questions readily and personal ones with a shrug.",
    },
    {
      id: ARTHUR_ID,
      case_id: CASE_ID,
      name: "Arthur Finch",
      age: 51,
      occupation: "Night announcer",
      relationship_to_victim: "The voice Julian meant to replace with recorded lectures",
      bio: "Finch has spoken for Vox-9 since the first licence. He leaves handkerchiefs and arguments behind him. He knows the corridor and the coat pegs, not the hatch or the oscillator keys.",
      public_alibi:
        "Says he left at 11:15 PM after the evening hour and sat at the all-night café on Commercial Road until past midnight. He first claims he never came back.",
      portrait_url: null,
      personality:
        "Warm on the air, thin-skinned off it. He will deny a return to the building until a key log is set in front of him.",
    },
    {
      id: MIRIAM_ID,
      case_id: CASE_ID,
      name: "Dr. Miriam Hale",
      age: 42,
      occupation: "Patron and scientific advisor",
      relationship_to_victim: "Funds the midnight experiments; her name is on the gallery notebook",
      bio: "Miriam pays for valves and paper. From the gallery glass she can see the desk and the microphone, not the valve closet behind Julian. She had been more than a patron. The sale would have ended that as well.",
      public_alibi:
        "Says she sat in the listening gallery for the whole midnight hour and never left her chair. She will say she watched Julian the entire time.",
      portrait_url: null,
      personality:
        "Measured, proprietary, and unwilling to admit a gap in her notes. She hides an affair more readily than a walk to the WC.",
    },
    {
      id: TOMMY_ID,
      case_id: CASE_ID,
      name: "Tommy Reed",
      age: 22,
      occupation: "Junior technician",
      relationship_to_victim: "Night runner; reports to Vera",
      bio: "Tommy keeps the roof log and the aerial. He uses the roof ladder, not the east hatch, unless he is sent. He saw a figure on the east ladder at 11:47 and is afraid to name his chief.",
      public_alibi:
        "Says he was on the roof from 11:30 PM taking wind readings and came down when the tone started.",
      portrait_url: null,
      personality:
        "Eager, loyal upward, and slow to accuse. He will talk about wind and wire before he will say a name.",
    },
  ]);

  await upsertRows("evidence", "evidence", [
    {
      id: EVIDENCE.log,
      case_id: CASE_ID,
      title: "Broadcast log",
      type: "object",
      description:
        "The paper log is in Julian’s brown ink until 11:28 PM: “load disc B, then live hour.” The last three lines — “00:00 live experimental, no visitors” — are in a different blue-black hand.",
      file_url: null,
      location_found: "Transmission-room desk",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.chart,
      case_id: CASE_ID,
      title: "Frequency chart",
      type: "object",
      description:
        "The midnight strip shows Julian’s carrier for forty seconds, an eight-second drop, then a clean 800-cycle tone. The printed legend reads OSC-3 TEST TONE — ENGINEER ONLY.",
      file_url: null,
      location_found: "Monitor bench",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "high",
    },
    {
      id: EVIDENCE.notes,
      case_id: CASE_ID,
      title: "Transmission notes",
      type: "object",
      description:
        "Julian’s handwritten card: “load disc B, speak 60s, then QRN experiment.” Disc B is the live blank. The machine holds a disc labelled A — Thursday’s rehearsal.",
      file_url: null,
      location_found: "Console blotter",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.disc,
      case_id: CASE_ID,
      title: "Damaged rehearsal disc",
      type: "object",
      description:
        "Disc A is Thursday’s rehearsal of Julian’s voice. After a short groove the wax is scraped silent, then the same 800-cycle tone is cut in. It is not tonight’s live blank.",
      file_url: null,
      location_found: "Recorder platter",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "high",
    },
    {
      id: EVIDENCE.generator,
      case_id: CASE_ID,
      title: "Generator maintenance record",
      type: "receipt",
      description:
        "The diesel book shows a service at 6:00 PM and no load tick from 11:20 PM to 12:10 AM. A later line in Vera’s hand: “aerial hatch latch oiled 14 Mar 18:00 — V.Lang.” The spares drawer lists a condenser housing signed out to V.Lang at 18:00.",
      file_url: null,
      location_found: "Generator shed clipboard",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.telegram,
      case_id: CASE_ID,
      title: "Meridian telegram",
      type: "phone",
      description:
        "A wire on the hall spike from Meridian Wireless: “Contract dawn 15 March. Patents schedule Annex C as discussed. Crowe.”",
      file_url: null,
      location_found: "Front hall spike",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "high",
    },
    {
      id: EVIDENCE.access,
      case_id: CASE_ID,
      title: "Door access log",
      type: "object",
      description:
        "Finch’s key in and out at 11:25 PM. Julian’s lock from inside at 11:30. No further door event until the forced entry at 12:06 AM. The aerial hatch is not on this book.",
      file_url: null,
      location_found: "Night-watch cupboard",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "high",
    },
    {
      id: EVIDENCE.photo,
      case_id: CASE_ID,
      title: "Alley photograph",
      type: "photograph",
      description:
        "A night plate of the east wall at 11:48 PM. A figure in engineer’s overalls is on the aerial-hatch ladder. The face is lost to steam, but the chalk V Vera uses on valves is on the breast pocket. The hatch stands ajar.",
      file_url: null,
      location_found: "Watchman’s plate box",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.cafe,
      case_id: CASE_ID,
      title: "Café statement",
      type: "statement",
      description:
        "The Commercial Road café keeps Finch from 11:32 PM to 12:20 AM without a gap. He arrived in a temper and did not leave.",
      file_url: null,
      location_found: "Interview file",
      discovered_by_default: true,
      is_red_herring: true,
      importance: "medium",
    },
    {
      id: EVIDENCE.condenser,
      case_id: CASE_ID,
      title: "Spare condenser housing",
      type: "object",
      description:
        "A heavy spare condenser housing on the transmission-room floor, dented, with blood at one rim. It matches the housing Vera signed out of the spares drawer at 6:00 PM.",
      file_url: null,
      location_found: "Beside the console chair",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.patents,
      case_id: CASE_ID,
      title: "Sale draft, Annex C",
      type: "object",
      description:
        "Julian’s office copy of the Meridian sale. Annex C lists the Lang oscillator as “Crowe-Lang, assignor Crowe.” Vera’s surname is struck through in Julian’s hand.",
      file_url: null,
      location_found: "Julian’s office",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "high",
    },
    {
      id: EVIDENCE.hatch,
      case_id: CASE_ID,
      title: "Aerial-feed hatch",
      type: "object",
      description:
        "The hatch opens inward into the valve closet behind the console. Gallery glass shows only the desk and microphone. Fresh oil and a scrape of overalls dye mark the inner rim. The door log never records this opening.",
      file_url: null,
      location_found: "East wall of the transmission room",
      discovered_by_default: false,
      is_red_herring: false,
      importance: "critical",
    },
    {
      id: EVIDENCE.notebook,
      case_id: CASE_ID,
      title: "Gallery notebook",
      type: "object",
      description:
        "Miriam’s times: 11:40, 11:45, 11:50 — then a blank until 12:06 AM, “tone, door forced.” A later line in different ink says “I did not leave.” The gallery chair was found pushed back.",
      file_url: null,
      location_found: "Listening gallery",
      discovered_by_default: false,
      is_red_herring: true,
      importance: "medium",
    },
    {
      id: EVIDENCE.roof,
      case_id: CASE_ID,
      title: "Roof wind log",
      type: "object",
      description:
        "Tommy’s readings at 11:30, 11:45, and midnight. A note in the margin: “saw someone on the east ladder 11:47, thought it was Vera doing a feed check.” His glove is on the roof ladder, not the east hatch.",
      file_url: null,
      location_found: "Roof locker",
      discovered_by_default: true,
      is_red_herring: false,
      importance: "high",
    },
  ]);

  const timeline = [
    {
      id: "a1000002-0002-4000-8000-000000000251",
      sequence: 1,
      event_time: at("21:00"),
      related_suspect_id: ARTHUR_ID,
      related_evidence_id: EVIDENCE.log,
      public_description:
        "The evening hour begins. Arthur Finch is at the microphone; Julian is in the office with papers.",
      hidden_description:
        "Finch already knows Julian means to replace live announcing with discs. He is angry and loud about it later, not violent.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000252",
      sequence: 2,
      event_time: at("22:10"),
      related_suspect_id: VERA_ID,
      related_evidence_id: EVIDENCE.patents,
      public_description:
        "Julian shows Miriam the draft of a dawn sale in his office. Vera is seen outside the office door and does not come in.",
      hidden_description:
        "Vera hears enough to know Annex C takes her oscillator. She decides the contract must not be signed.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000253",
      sequence: 3,
      event_time: at("22:40"),
      related_suspect_id: null,
      related_evidence_id: EVIDENCE.telegram,
      public_description:
        "A telegram from Meridian Wireless arrives and is left on the hall spike: the contract is for dawn.",
      hidden_description: "The wire fixes the hour. After dawn the patents will not be Vera’s to keep.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000254",
      sequence: 4,
      event_time: at("23:00"),
      related_suspect_id: ARTHUR_ID,
      related_evidence_id: EVIDENCE.notes,
      public_description:
        "Finch’s last live segment ends. Julian says he will take the midnight experimental hour alone.",
      hidden_description: "Julian wants the room empty so the sale demonstration is his voice only.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000255",
      sequence: 5,
      event_time: at("23:10"),
      related_suspect_id: ARTHUR_ID,
      related_evidence_id: EVIDENCE.access,
      public_description:
        "Finch and Julian argue in the corridor about being replaced. Finch slams the studio door. His handkerchief is later found in the transmission room.",
      hidden_description:
        "The handkerchief fell during the evening hour. Finch does not re-enter the locked room after 11:30.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000256",
      sequence: 6,
      event_time: at("23:15"),
      related_suspect_id: ARTHUR_ID,
      related_evidence_id: EVIDENCE.cafe,
      public_description: "The night book records Finch clocking out. He says he is going to the café.",
      hidden_description: "He means it, but he has forgotten his coat.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000257",
      sequence: 7,
      event_time: at("23:20"),
      related_suspect_id: VERA_ID,
      related_evidence_id: EVIDENCE.generator,
      public_description:
        "Vera tells Tommy she will be in the generator shed. Tommy goes up to the roof for the wind check.",
      hidden_description:
        "Vera does not open the diesel book. She waits for Julian to lock the door, then uses the east hatch.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000258",
      sequence: 8,
      event_time: at("23:25"),
      related_suspect_id: ARTHUR_ID,
      related_evidence_id: EVIDENCE.access,
      public_description:
        "Finch’s key is logged in and out. He returns for his coat and leaves again.",
      hidden_description: "He never goes past the pegs. He is at the café by 11:32.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000259",
      sequence: 9,
      event_time: at("23:30"),
      related_suspect_id: null,
      related_evidence_id: EVIDENCE.access,
      public_description:
        "Julian locks the transmission-room door from inside. The night watch writes: Crowe sealed for midnight.",
      hidden_description: "The door is honest. The hatch is not on the watch’s book.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000260",
      sequence: 10,
      event_time: at("23:40"),
      related_suspect_id: MIRIAM_ID,
      related_evidence_id: EVIDENCE.notebook,
      public_description:
        "Miriam sits in the listening gallery with her notebook. The glass shows the desk and the microphone.",
      hidden_description:
        "She can see Julian at the desk. She cannot see the valve closet. She will later claim the glass showed the whole room.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000261",
      sequence: 11,
      event_time: at("23:47"),
      related_suspect_id: VERA_ID,
      related_evidence_id: EVIDENCE.photo,
      public_description:
        "Tommy notes a figure on the east ladder. A watch plate at 11:48 shows overalls and a chalk V at the ajar hatch.",
      hidden_description:
        "Vera enters through the hatch into the valve closet and waits behind the console.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000262",
      sequence: 12,
      event_time: at("23:52"),
      related_suspect_id: MIRIAM_ID,
      related_evidence_id: EVIDENCE.notebook,
      public_description:
        "Miriam’s notebook goes blank. The gallery chair is later found pushed back.",
      hidden_description:
        "She left for the WC and did not see the blow. She writes “I did not leave” after the door is forced, to keep the affair and the gap off the page.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000263",
      sequence: 13,
      event_time: at("00:00"),
      related_suspect_id: VERA_ID,
      related_evidence_id: EVIDENCE.chart,
      public_description:
        "The broadcast carries Julian’s voice for forty seconds, then eight seconds of silence, then OSC-3’s repeating tone.",
      hidden_description:
        "Vera strikes Julian with the signed-out condenser housing as he sits, starts OSC-3 and Thursday’s disc A so the hour will not die, and alters the last lines of the paper log.",
    },
    {
      id: "a1000002-0002-4000-8000-000000000264",
      sequence: 14,
      event_time: at("00:04"),
      related_suspect_id: TOMMY_ID,
      related_evidence_id: EVIDENCE.hatch,
      public_description:
        "Tommy comes down from the roof. Vera arrives from the shed direction. They force the door at 12:06. Julian is dead at the console. The headset is still on.",
      hidden_description:
        "Vera has already left through the hatch and circled to the shed path. The door was never the way in.",
    },
  ];

  await upsertRows("timeline", "timeline_events", timeline.map((event) => ({ ...event, case_id: CASE_ID })));

  await upsertRows("ground truth", "case_ground_truth", [
    {
      id: TRUTH_ID,
      case_id: CASE_ID,
      culprit_id: VERA_ID,
      motive:
        "Julian was selling Station Vox-9 at dawn and taking Vera Lang’s oscillator in Annex C as his assignment. The Meridian telegram fixed the hour. She would not let the patents leave with him.",
      method:
        "After Julian locked the door at 11:30, Vera entered through the aerial-feed hatch into the valve closet — a space the gallery glass does not show. At midnight she struck him with the spare condenser housing she had signed out, started the engineer-only OSC-3 tone and Thursday’s rehearsal disc so the broadcast would not die, altered the last lines of the paper log, and left by the same hatch.",
      time_of_crime: at("00:00"),
      location: "Transmission room, Station Vox-9, Limehouse",
      solution_explanation:
        "Julian Crowe locked the transmission-room door at 11:30. The door log is not a lie; it is incomplete. The aerial-feed hatch opens into the valve closet behind the console, which the gallery glass does not show. Vera oiled that latch at 6:00 PM and signed out the condenser housing. She told Tommy she would be in the generator shed, but the diesel book has no midnight load. At 11:47 Tommy saw someone on the east ladder; the 11:48 plate shows overalls with her chalk V and the hatch ajar. Miriam’s notebook goes blank at 11:52 — she left the gallery and did not see the blow. At midnight Julian’s live voice lasts forty seconds. Then silence, then OSC-3, an engineer-only tone, cut onto Thursday’s disc A instead of the live disc B he had written down. The last three lines of the broadcast log are in another hand. Vera appears from the shed path after leaving by the hatch. Finch’s 11:25 key and the café clock him away. The sale telegram and Annex C, with her name struck through, are why the hour could not wait until dawn. Vera Lang is the dead frequency.",
    },
  ]);

  const blackwoodSessionsAfter = await countSessionsForCase(BLACKWOOD_ID);
  if (blackwoodSessionsAfter !== blackwoodSessionsBefore) {
    throw new Error("Seed refused: Case #001 sessions changed while adding Case #002.");
  }

  console.log("Seeded Case #002 The Dead Frequency");
  console.log(`case_id: ${CASE_ID}`);
  console.log("suspects: 4  evidence: 14  timeline: 14");
  console.log(`Case #001 sessions preserved: ${blackwoodSessionsAfter}`);
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unable to seed Case #002.");
  process.exit(1);
});
