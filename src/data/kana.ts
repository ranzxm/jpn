export type KanaScript = "hiragana" | "katakana";
export type ScriptFilter = KanaScript | "all";

export interface KanaCard {
  id: string;
  kana: string;
  romaji: string;
  script: KanaScript;
}

// ponytail: 104 kana per aksara (46 gojuon + 25 dakuten/handakuten + 33 kombinasi yoon);
// pisahkan filter kategori hanya jika diminta
const KANA_TABLE: ReadonlyArray<readonly [hiragana: string, katakana: string, romaji: string]> = [
  // Gojuon (46)
  ["あ", "ア", "a"], ["い", "イ", "i"], ["う", "ウ", "u"], ["え", "エ", "e"], ["お", "オ", "o"],
  ["か", "カ", "ka"], ["き", "キ", "ki"], ["く", "ク", "ku"], ["け", "ケ", "ke"], ["こ", "コ", "ko"],
  ["さ", "サ", "sa"], ["し", "シ", "shi"], ["す", "ス", "su"], ["せ", "セ", "se"], ["そ", "ソ", "so"],
  ["た", "タ", "ta"], ["ち", "チ", "chi"], ["つ", "ツ", "tsu"], ["て", "テ", "te"], ["と", "ト", "to"],
  ["な", "ナ", "na"], ["に", "ニ", "ni"], ["ぬ", "ヌ", "nu"], ["ね", "ネ", "ne"], ["の", "ノ", "no"],
  ["は", "ハ", "ha"], ["ひ", "ヒ", "hi"], ["ふ", "フ", "fu"], ["へ", "ヘ", "he"], ["ほ", "ホ", "ho"],
  ["ま", "マ", "ma"], ["み", "ミ", "mi"], ["む", "ム", "mu"], ["め", "メ", "me"], ["も", "モ", "mo"],
  ["や", "ヤ", "ya"], ["ゆ", "ユ", "yu"], ["よ", "ヨ", "yo"],
  ["ら", "ラ", "ra"], ["り", "リ", "ri"], ["る", "ル", "ru"], ["れ", "レ", "re"], ["ろ", "ロ", "ro"],
  ["わ", "ワ", "wa"], ["を", "ヲ", "wo"],
  ["ん", "ン", "n"],

  // Dakuten & Handakuten (25)
  ["が", "ガ", "ga"], ["ぎ", "ギ", "gi"], ["ぐ", "グ", "gu"], ["げ", "ゲ", "ge"], ["ご", "ゴ", "go"],
  ["ざ", "ザ", "za"], ["じ", "ジ", "ji"], ["ず", "ズ", "zu"], ["ぜ", "ゼ", "ze"], ["ぞ", "ゾ", "zo"],
  ["だ", "ダ", "da"], ["ぢ", "ヂ", "ji"], ["づ", "ヅ", "zu"], ["で", "デ", "de"], ["ど", "ド", "do"],
  ["ば", "バ", "ba"], ["び", "ビ", "bi"], ["ぶ", "ブ", "bu"], ["べ", "ベ", "be"], ["ぼ", "ボ", "bo"],
  ["ぱ", "パ", "pa"], ["ぴ", "ピ", "pi"], ["ぷ", "プ", "pu"], ["ぺ", "ペ", "pe"], ["ぽ", "ポ", "po"],

  // Combinations / Yoon (33)
  ["きゃ", "キャ", "kya"], ["きゅ", "キュ", "kyu"], ["きょ", "キョ", "kyo"],
  ["しゃ", "シャ", "sha"], ["しゅ", "シュ", "shu"], ["しょ", "ショ", "sho"],
  ["ちゃ", "チャ", "cha"], ["ちゅ", "チュ", "chu"], ["ちょ", "チョ", "cho"],
  ["にゃ", "ニャ", "nya"], ["にゅ", "ニュ", "nyu"], ["にょ", "ニョ", "nyo"],
  ["ひゃ", "ヒャ", "hya"], ["ひゅ", "ヒュ", "hyu"], ["ひょ", "ヒョ", "hyo"],
  ["みゃ", "ミャ", "mya"], ["みゅ", "ミュ", "myu"], ["みょ", "ミョ", "myo"],
  ["りゃ", "リャ", "rya"], ["りゅ", "リュ", "ryu"], ["りょ", "リョ", "ryo"],
  ["ぎゃ", "ギャ", "gya"], ["ぎゅ", "ギュ", "gyu"], ["ぎょ", "ギョ", "gyo"],
  ["じゃ", "ジャ", "ja"], ["じゅ", "ジュ", "ju"], ["じょ", "ジョ", "jo"],
  ["びゃ", "ビャ", "bya"], ["びゅ", "ビュ", "byu"], ["びょ", "ビョ", "byo"],
  ["ぴゃ", "ピャ", "pya"], ["ぴゅ", "ピュ", "pyu"], ["ぴょ", "ピョ", "pyo"],
];

export const HIRAGANA: readonly KanaCard[] = KANA_TABLE.map(([kana, , romaji]) => ({
  id: `hira-${kana}`,
  kana,
  romaji,
  script: "hiragana" as const,
}));

export const KATAKANA: readonly KanaCard[] = KANA_TABLE.map(([, kana, romaji]) => ({
  id: `kata-${kana}`,
  kana,
  romaji,
  script: "katakana" as const,
}));

export const ALL_KANA: readonly KanaCard[] = [...HIRAGANA, ...KATAKANA];

export function getPool(filter: ScriptFilter): readonly KanaCard[] {
  if (filter === "hiragana") return HIRAGANA;
  if (filter === "katakana") return KATAKANA;
  return ALL_KANA;
}

export function createShuffledDeck(
  filter: ScriptFilter,
  avoidFirstId?: string,
  rng: () => number = Math.random
): KanaCard[] {
  const deck = [...getPool(filter)];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  // Hindari kartu pertama siklus baru persis sama dengan kartu terakhir siklus sebelumnya
  if (avoidFirstId && deck.length > 1 && deck[0].id === avoidFirstId) {
    const swapIdx = 1 + Math.floor(rng() * (deck.length - 1));
    [deck[0], deck[swapIdx]] = [deck[swapIdx], deck[0]];
  }
  return deck;
}
