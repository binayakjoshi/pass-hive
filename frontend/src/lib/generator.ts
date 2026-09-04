// Cryptographically secure random int in [0, max)
function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  let val: number;
  do {
    crypto.getRandomValues(array);
    val = array[0];
  } while (val >= limit);
  return val % max;
}

function secureShuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- Password ----------

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SPECIAL = "!@#$%^&*()_+-=[]{}|;:,.<>?";

export interface PasswordOptions {
  length: number;
  useLower: boolean;
  useUpper: boolean;
  useNumbers: boolean;
  useSpecial: boolean;
  minNumbers: number;
  minSpecial: number;
}

export function generatePassword(opts: PasswordOptions): string {
  const pools: string[] = [];
  if (opts.useLower) pools.push(LOWER);
  if (opts.useUpper) pools.push(UPPER);
  if (opts.useNumbers) pools.push(NUMBERS);
  if (opts.useSpecial) pools.push(SPECIAL);
  if (pools.length === 0) return "";

  const allChars = pools.join("");
  const minRequired =
    (opts.useNumbers ? opts.minNumbers : 0) +
    (opts.useSpecial ? opts.minSpecial : 0);
  const length = Math.max(opts.length, minRequired);

  const required: string[] = [];
  if (opts.useNumbers) {
    for (let i = 0; i < opts.minNumbers; i++)
      required.push(NUMBERS[secureRandomInt(NUMBERS.length)]);
  }
  if (opts.useSpecial) {
    for (let i = 0; i < opts.minSpecial; i++)
      required.push(SPECIAL[secureRandomInt(SPECIAL.length)]);
  }

  const rest: string[] = [];
  for (let i = required.length; i < length; i++) {
    rest.push(allChars[secureRandomInt(allChars.length)]);
  }

  return secureShuffle([...required, ...rest]).join("");
}

export function passwordPoolSize(opts: PasswordOptions): number {
  let size = 0;
  if (opts.useLower) size += LOWER.length;
  if (opts.useUpper) size += UPPER.length;
  if (opts.useNumbers) size += NUMBERS.length;
  if (opts.useSpecial) size += SPECIAL.length;
  return size;
}

export function estimateEntropyBits(length: number, poolSize: number): number {
  if (poolSize <= 1) return 0;
  return Math.round(length * Math.log2(poolSize));
}

export type StrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export function getStrength(bits: number): {
  label: StrengthLabel;
  color: "error" | "warning" | "info" | "success";
  percent: number;
} {
  if (bits < 40) return { label: "Weak", color: "error", percent: 25 };
  if (bits < 65) return { label: "Fair", color: "warning", percent: 50 };
  if (bits < 90) return { label: "Good", color: "info", percent: 75 };
  return { label: "Strong", color: "success", percent: 100 };
}

// ---------- Passphrase ----------

export const PASSPHRASE_WORDS = [
  "amber",
  "anchor",
  "arrow",
  "aspen",
  "autumn",
  "banjo",
  "basil",
  "beacon",
  "birch",
  "blanket",
  "bloom",
  "boulder",
  "bramble",
  "breeze",
  "bridge",
  "canyon",
  "cedar",
  "cinder",
  "clover",
  "coast",
  "comet",
  "compass",
  "coral",
  "cotton",
  "crane",
  "crater",
  "crimson",
  "crystal",
  "dawn",
  "delta",
  "desert",
  "dolphin",
  "dune",
  "eagle",
  "ember",
  "falcon",
  "feather",
  "fern",
  "fjord",
  "flame",
  "forest",
  "fossil",
  "garnet",
  "glacier",
  "granite",
  "gravel",
  "harbor",
  "harvest",
  "hazel",
  "heron",
  "hollow",
  "horizon",
  "indigo",
  "island",
  "ivory",
  "jasper",
  "juniper",
  "kestrel",
  "lagoon",
  "lantern",
  "lavender",
  "ledge",
  "lichen",
  "linen",
  "lotus",
  "lumber",
  "lynx",
  "maple",
  "marble",
  "meadow",
  "mesa",
  "mist",
  "moraine",
  "moss",
  "nebula",
  "nectar",
  "nettle",
  "oak",
  "oasis",
  "obsidian",
  "opal",
  "orbit",
  "orchard",
  "otter",
  "paddle",
  "pebble",
  "petal",
  "pine",
  "plateau",
  "prairie",
  "quartz",
  "quiver",
  "raven",
  "reef",
  "ridge",
  "river",
  "robin",
  "rustic",
  "saffron",
  "sage",
  "sailfish",
  "sandstone",
  "sapphire",
  "savanna",
  "sequoia",
  "shale",
  "shore",
  "silver",
  "sonnet",
  "sparrow",
  "spruce",
  "starling",
  "summit",
  "sunrise",
  "swallow",
  "tangerine",
  "thistle",
  "thunder",
  "timber",
  "topaz",
  "trellis",
  "tundra",
  "turquoise",
  "valley",
  "velvet",
  "vessel",
  "violet",
  "voyage",
  "walnut",
  "willow",
  "wren",
  "zephyr",
];

export interface PassphraseOptions {
  wordCount: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
}

export function generatePassphrase(opts: PassphraseOptions): string {
  const words: string[] = [];
  for (let i = 0; i < opts.wordCount; i++) {
    let w = PASSPHRASE_WORDS[secureRandomInt(PASSPHRASE_WORDS.length)];
    if (opts.capitalize) w = w[0].toUpperCase() + w.slice(1);
    words.push(w);
  }
  if (opts.includeNumber) {
    words.push(String(secureRandomInt(90) + 10));
  }
  return words.join(opts.separator);
}

export function passphraseEntropyBits(wordCount: number): number {
  return Math.round(wordCount * Math.log2(PASSPHRASE_WORDS.length));
}

// ---------- Username ----------

export const USERNAME_ADJECTIVES = [
  "brave",
  "calm",
  "clever",
  "cosmic",
  "curious",
  "daring",
  "eager",
  "electric",
  "fierce",
  "gentle",
  "golden",
  "happy",
  "hidden",
  "jolly",
  "keen",
  "lively",
  "lucky",
  "mellow",
  "mighty",
  "misty",
  "noble",
  "playful",
  "quick",
  "quiet",
  "rapid",
  "silent",
  "silver",
  "sleepy",
  "sly",
  "solar",
  "spry",
  "sturdy",
  "sunny",
  "swift",
  "vivid",
  "witty",
  "wild",
  "wise",
  "zesty",
  "bold",
];

export const USERNAME_NOUNS = [
  "badger",
  "bear",
  "beetle",
  "bison",
  "cobra",
  "condor",
  "cougar",
  "coyote",
  "crane",
  "eagle",
  "falcon",
  "ferret",
  "finch",
  "fox",
  "gecko",
  "hawk",
  "heron",
  "ibis",
  "jaguar",
  "kestrel",
  "kingfisher",
  "koala",
  "lemur",
  "leopard",
  "lynx",
  "magpie",
  "marten",
  "mongoose",
  "moose",
  "orca",
  "osprey",
  "otter",
  "owl",
  "panther",
  "panda",
  "phoenix",
  "puma",
  "raven",
  "rhino",
  "salamander",
  "shark",
  "sparrow",
  "stallion",
  "swan",
  "tiger",
  "toucan",
  "viper",
  "walrus",
  "weasel",
  "wolf",
  "wolverine",
  "wren",
  "yak",
  "zebra",
];

export type UsernameStyle = "adjective-noun" | "noun-noun" | "single-word";

export interface UsernameOptions {
  style: UsernameStyle;
  separator: string;
  includeNumber: boolean;
  titleCase: boolean;
}

export function generateUsername(opts: UsernameOptions): string {
  let parts: string[];
  if (opts.style === "adjective-noun") {
    parts = [
      USERNAME_ADJECTIVES[secureRandomInt(USERNAME_ADJECTIVES.length)],
      USERNAME_NOUNS[secureRandomInt(USERNAME_NOUNS.length)],
    ];
  } else if (opts.style === "noun-noun") {
    parts = [
      USERNAME_NOUNS[secureRandomInt(USERNAME_NOUNS.length)],
      USERNAME_NOUNS[secureRandomInt(USERNAME_NOUNS.length)],
    ];
  } else {
    parts = [USERNAME_NOUNS[secureRandomInt(USERNAME_NOUNS.length)]];
  }

  if (opts.titleCase) {
    parts = parts.map((p) => p[0].toUpperCase() + p.slice(1));
  }

  let result = parts.join(opts.separator);
  if (opts.includeNumber) {
    result += String(secureRandomInt(900) + 100);
  }
  return result;
}
