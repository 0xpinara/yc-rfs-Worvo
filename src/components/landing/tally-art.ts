import type { StaticImageData } from "next/image";
import listening from "./tally/listening.svg";
import paid from "./tally/paid.svg";
import question from "./tally/question.svg";
import wave from "./tally/wave.svg";
import writing from "./tally/writing.svg";

// Tally, the Worvo sea otter. Artwork from the "Tally, the Worvo mascot" design export.

export const TALLY_WAVE: { src: StaticImageData; alt: string } = {
  src: wave,
  alt: "Tally, Worvo’s sea otter, in a white cap with a pencil behind one ear, waving a paw with a glowing wristband and holding an invoice",
};

export type TallyPose = "listening" | "writing" | "question" | "paid";

export const TALLY_POSES: Record<TallyPose, { src: StaticImageData; title: string; caption: string; alt: string }> = {
  listening: {
    src: listening,
    title: "Listening",
    caption: "Ears up while you describe the job.",
    alt: "Tally cupping a paw behind one ear, with sound waves reaching the wristband",
  },
  writing: {
    src: writing,
    title: "Writing it up",
    caption: "Every line comes from what you said.",
    alt: "Tally writing on an invoice with a pencil, tongue poking out in concentration",
  },
  question: {
    src: question,
    title: "Has a question",
    caption: "Asks before it guesses.",
    alt: "Tally scratching the side of its cap next to a question mark bubble",
  },
  paid: {
    src: paid,
    title: "Paid",
    caption: "Floats once the invoice is paid.",
    alt: "Tally floating on its back in the water, eyes closed and smiling, holding an invoice with a check mark",
  },
};

export const TALLY_POSE_ORDER: readonly TallyPose[] = ["listening", "writing", "question", "paid"];
