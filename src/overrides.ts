import { normalize } from './normalize'

/**
 * Better words than the official emojibase labels, pitched at readers of
 * about 10 to 13.
 *
 * Only the clunky ones are listed. Anything absent keeps its official word,
 * which is usually already right: "pizza", "elephant", "rainbow", "sun".
 *
 * Rules of thumb used here:
 *  - Every word is distinct. Three emoji that all say "happy" is worse than
 *    the labels this replaces, because it flattens the differences a child
 *    is actually picking between. A test enforces this.
 *  - Drop the mechanical description. "dog", not "dog face"; "rain", not
 *    "cloud with rain"; "car", not "automobile".
 *  - Reach for the precise word rather than the simplest one. "smug" beats
 *    "pleased with himself"; "exasperated" beats "annoyed".
 *
 * Keys may be written with or without the invisible variation selector; they
 * are normalized below.
 */
const RAW: Record<string, string> = {
  // Cheerful
  '😀': 'grinning',
  '😃': 'delighted',
  '😄': 'cheerful',
  '😁': 'beaming',
  '😆': 'cracking up',
  '😅': 'relieved laugh',
  '🤣': 'howling with laughter',
  '😂': 'laughing till it hurts',
  '🙂': 'pleasant',
  '🙃': 'being sarcastic',
  '😉': 'winking',
  '😊': 'content',
  '😇': 'innocent',
  '☺️': 'serene',

  // Affection
  '🥰': 'adoring',
  '😍': 'smitten',
  '😘': 'blowing a kiss',
  '😗': 'kissing',
  '😚': 'sweet kiss',
  '😙': 'happy kiss',
  '💘': 'struck by cupid',
  '💝': 'gift of love',

  // Playful
  '😋': 'delicious',
  '😛': 'cheeky',
  '😜': 'playful',
  '🤪': 'wacky',
  '😝': 'teasing',
  '🤑': 'greedy',
  '🤗': 'welcoming hug',
  '🤭': 'stifling a giggle',
  '🤫': 'keeping a secret',
  '🤔': 'pondering',
  '🤐': 'lips sealed',
  '🤨': 'skeptical',
  '🤠': 'cowboy',
  '🥳': 'celebrating',
  '😎': 'effortlessly cool',
  '🤓': 'studious',
  '🧐': 'scrutinizing',
  '🤡': 'clown',
  '💩': 'poop',

  // Guarded
  '😐': 'indifferent',
  '😑': 'deadpan',
  '😶': 'speechless',
  '😏': 'smug',
  '😒': 'unimpressed',
  '🙄': 'exasperated',
  '😬': 'cringing',
  '🤥': 'fibbing',

  // Tired and unwell
  '😌': 'at ease',
  '😪': 'drowsy',
  '🤤': 'drooling',
  '😴': 'fast asleep',
  '🥱': 'yawning',
  '😷': 'masked',
  '🤒': 'feverish',
  '🤕': 'injured',
  '🤢': 'queasy',
  '🤧': 'sneezing',
  '🥵': 'overheating',
  '🥶': 'freezing',
  '🥴': 'woozy',
  '😵': 'knocked out',

  // Unhappy
  '😕': 'puzzled',
  '😟': 'concerned',
  '🙁': 'glum',
  '☹️': 'unhappy',
  '😔': 'wistful',
  '😥': 'disheartened',
  '😓': 'downcast',
  '😮': 'agape',
  '😯': 'taken aback',
  '😲': 'astonished',
  '😳': 'flustered',
  '🥺': 'pleading',
  '😦': 'dismayed',
  '😧': 'anguished',
  '😨': 'fearful',
  '😰': 'anxious',
  '😢': 'crying',
  '😭': 'sobbing',
  '😱': 'screaming in terror',
  '😖': 'frustrated',
  '😣': 'enduring',
  '😞': 'disappointed',
  '😩': 'weary',
  '😫': 'worn out',

  // Angry
  '😤': 'fuming',
  '😡': 'enraged',
  '😠': 'angry',
  '🤬': 'swearing',
  '😈': 'devious',
  '👿': 'wrathful',

  // Animals
  '🐵': 'monkey',
  '🐶': 'dog',
  '🐱': 'cat',
  '🐯': 'tiger',
  '🐴': 'horse',
  '🐮': 'cow',
  '🐷': 'pig',
  '🐭': 'mouse',
  '🐰': 'rabbit',
  '🐥': 'baby chick',
  '🐲': 'dragon',

  // Plants
  '🍀': 'clover',
  '🍃': 'leaves in the wind',
  '🌾': 'wheat',

  // Food
  '🌽': 'corn',
  '🍖': 'meat',
  '🥩': 'steak',
  '🍲': 'stew',
  '🥣': 'cereal',
  '🍠': 'sweet potato',
  '🍦': 'ice cream',
  '🥛': 'milk',
  '🥤': 'soft drink',
  '🍽️': 'place setting',

  // Vehicles
  '🚂': 'steam train',
  '🚗': 'car',
  '🚙': 'SUV',
  '🚔': 'police car',
  '🚨': 'siren',
  '🚥': 'traffic light',
  '🚦': 'traffic signal',

  // Weather
  // Plain sun keeps its official word: "sun" is already right.
  '🌞': 'sunshine',
  '⛅️': 'partly cloudy',
  '🌤️': 'mostly sunny',
  '🌥️': 'overcast',
  '🌦️': 'sun shower',
  '🌧️': 'rain',
  '🌨️': 'snow',
  '🌩️': 'lightning',
  '⛈️': 'thunderstorm',
  '🌬️': 'wind',
  '☔️': 'umbrella',
  '⛱️': 'beach umbrella',
  '⛄️': 'snowman',
  '🌚': 'new moon',
  '🌝': 'full moon',

  // Places
  '🌍️': 'earth',
  '🌎️': 'the Americas',
  '🌏️': 'Asia and Australia',
  '🌐': 'globe',
  '🏖️': 'beach',
  '🌄': 'sunrise',
  '🌃': 'starry night',

  // Things
  '🥇': 'gold medal',
  '🥈': 'silver medal',
  '🥉': 'bronze medal',
  '⛳️': 'golf',
  '🧻': 'toilet paper',
  '📸': 'camera flash',
  '🔊': 'loud',
  '🔈️': 'quiet',
  '🔍️': 'magnifying glass',
}

/**
 * The same list, keyed without variation selectors, so it matches whatever
 * the picker emits.
 */
export const overrides: Record<string, string> = Object.fromEntries(
  Object.entries(RAW).map(([emoji, word]) => [normalize(emoji), word]),
)
