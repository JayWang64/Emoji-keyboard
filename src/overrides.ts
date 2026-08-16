import { normalize } from './normalize'

/**
 * Kid-friendly words that beat the official emojibase label.
 *
 * Only the clunky ones are listed. Anything absent keeps its official word,
 * which is usually fine: "pizza", "elephant", "rainbow", "birthday cake".
 *
 * Rules of thumb used here:
 *  - Drop the trailing "face". A four-year-old says "dog", not "dog face".
 *  - Say the everyday word: "car", not "automobile"; "train", not
 *    "locomotive".
 *  - Say the feeling, not the description: "laughing", not "face with tears
 *    of joy"; "rain", not "cloud with rain".
 *
 * Keys may be written with or without the invisible variation selector; they
 * are normalized below.
 */
const RAW: Record<string, string> = {
  // Happy faces
  '😀': 'happy',
  '😃': 'happy',
  '😄': 'happy',
  '😁': 'big smile',
  '😆': 'giggling',
  '😅': 'phew',
  '🤣': 'laughing so hard',
  '😂': 'laughing',
  '🙂': 'smiling',
  '🙃': 'silly',
  '😉': 'winking',
  '😊': 'happy',
  '😇': 'angel',
  '☺️': 'smiling',

  // Love and kisses
  '🥰': 'loved',
  '😍': 'in love',
  '😘': 'blowing a kiss',
  '😗': 'kiss',
  '😚': 'kiss',
  '😙': 'kiss',
  '💘': 'love arrow',
  '💝': 'heart gift',

  // Silly faces
  '😋': 'yummy',
  '😛': 'tongue out',
  '😜': 'silly',
  '🤪': 'goofy',
  '😝': 'silly',
  '🤑': 'rich',
  '🤗': 'hug',
  '🤭': 'oops',
  '🤫': 'shh',
  '🤔': 'thinking',
  '🤐': 'zipped lips',
  '🤨': 'suspicious',
  '🤠': 'cowboy',
  '🥳': 'party',
  '😎': 'cool',
  '🤓': 'nerdy',
  '🧐': 'curious',
  '🤡': 'clown',
  '💩': 'poop',

  // Blank and grumpy faces
  '😐': 'blank',
  '😑': 'blank',
  '😶': 'no mouth',
  '😏': 'smirk',
  '😒': 'not amused',
  '🙄': 'eye roll',
  '😬': 'awkward',
  '🤥': 'fibbing',

  // Sleepy and sick
  '😌': 'relieved',
  '😪': 'sleepy',
  '🤤': 'drooling',
  '😴': 'sleeping',
  '🥱': 'yawning',
  '😷': 'wearing a mask',
  '🤒': 'sick',
  '🤕': 'hurt',
  '🤢': 'yucky',
  '🤧': 'sneezing',
  '🥵': 'too hot',
  '🥶': 'freezing',
  '🥴': 'dizzy',
  '😵': 'dizzy',

  // Sad and scared
  '😕': 'confused',
  '😟': 'worried',
  '🙁': 'sad',
  '☹️': 'sad',
  '😔': 'sad',
  '😥': 'sad',
  '😓': 'sad',
  '😮': 'surprised',
  '😯': 'surprised',
  '😲': 'shocked',
  '😳': 'embarrassed',
  '🥺': 'pleading',
  '😦': 'worried',
  '😧': 'upset',
  '😨': 'scared',
  '😰': 'nervous',
  '😢': 'crying',
  '😭': 'crying a lot',
  '😱': 'screaming',
  '😖': 'frustrated',
  '😣': 'struggling',
  '😞': 'disappointed',
  '😩': 'tired',
  '😫': 'so tired',

  // Angry
  '😤': 'huffy',
  '😡': 'very angry',
  '😠': 'angry',
  '🤬': 'very angry',
  '😈': 'mischief',
  '👿': 'angry devil',

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
  '🍃': 'leaves',
  '🌾': 'wheat',

  // Food
  '🌽': 'corn',
  '🍖': 'meat',
  '🥩': 'steak',
  '🍲': 'soup',
  '🥣': 'cereal',
  '🍠': 'sweet potato',
  '🍦': 'ice cream',
  '🥛': 'milk',
  '🥤': 'drink',
  '🍽️': 'plate',

  // Vehicles
  '🚂': 'train',
  '🚗': 'car',
  '🚙': 'big car',
  '🚔': 'police car',
  '🚨': 'siren',
  '🚥': 'traffic light',
  '🚦': 'traffic light',

  // Weather and sky
  // Plain sun keeps its official word: "sun" is already the kid word.
  '🌞': 'sunshine',
  '⛅️': 'sun and clouds',
  '🌤️': 'mostly sunny',
  '🌥️': 'cloudy',
  '🌦️': 'sun shower',
  '🌧️': 'rain',
  '🌨️': 'snow',
  '🌩️': 'lightning',
  '⛈️': 'thunderstorm',
  '🌬️': 'wind',
  '☔️': 'umbrella',
  '⛱️': 'beach umbrella',
  '⛄️': 'snowman',
  '🌚': 'moon',
  '🌝': 'full moon',

  // Places
  '🌍️': 'earth',
  '🌎️': 'earth',
  '🌏️': 'earth',
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
  '📸': 'camera',
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
