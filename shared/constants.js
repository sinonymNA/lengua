export const STAGES = {
  el_desconocido: {
    id: 'el_desconocido',
    label: 'El Desconocido',
    subtitle: 'The Stranger',
    description: 'Heavy English narration. Single Spanish words. 3 response choices shown.',
    speechSpeed: 0.75,
    narrationOpacity: 1.0,
    choicesVisible: true,
    freeSpeak: false,
    minConfidenceToAdvance: 300,
  },
  el_visitante: {
    id: 'el_visitante',
    label: 'El Visitante',
    subtitle: 'The Visitor',
    description: 'Narration thins. More Spanish dialogue. Choices still visible as phrases.',
    speechSpeed: 0.85,
    narrationOpacity: 0.7,
    choicesVisible: true,
    freeSpeak: false,
    minConfidenceToAdvance: 800,
  },
  el_residente: {
    id: 'el_residente',
    label: 'El Residente',
    subtitle: 'The Resident',
    description: 'Minimal narration. You are in the scene. Free speech unlocks.',
    speechSpeed: 1.0,
    narrationOpacity: 0.3,
    choicesVisible: false,
    freeSpeak: true,
    minConfidenceToAdvance: 2000,
  },
  el_habitante: {
    id: 'el_habitante',
    label: 'El Habitante',
    subtitle: 'The Local',
    description: 'Full immersion. Native speed. No narration. Free speech only.',
    speechSpeed: 1.15,
    narrationOpacity: 0,
    choicesVisible: false,
    freeSpeak: true,
    minConfidenceToAdvance: null,
  },
}

export const STAGE_ORDER = ['el_desconocido', 'el_visitante', 'el_residente', 'el_habitante']

export const CONFIDENCE_RULES = {
  encounter: 5,
  contextCorrect: 10,
  replayRequested: -8,
  hesitation: -5,
  freeSpeechCorrect: 15,
  sceneMissed: -10,
}

export const CONFIDENCE_STATUS = {
  unknown: [0, 39],
  frontier: [40, 79],
  acquired: [80, 100],
}

export const CITIES = [
  {
    slug: 'madrid',
    name: 'Madrid',
    country: 'Spain',
    description:
      'The heart of Spain pulses with flamenco rhythms and the scent of churros. Navigate its historic barrios, grand boulevards, and hidden plazas.',
    unlocksAt: null,
    image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80',
    episodes: 5,
  },
  {
    slug: 'mexico-city',
    name: 'Mexico City',
    country: 'Mexico',
    description:
      'A megalopolis alive with color, noise, and ancient history. From Aztec ruins to taco stands, the city demands your full attention.',
    unlocksAt: { city: 'madrid', episode: 3 },
    image: 'https://images.unsplash.com/photo-1518659526054-190340b32735?w=800&q=80',
    episodes: 5,
  },
  {
    slug: 'buenos-aires',
    name: 'Buenos Aires',
    country: 'Argentina',
    description:
      'The Paris of South America. Tango on every corner, steak on every table, and a melancholy beauty that gets under your skin.',
    unlocksAt: { city: 'mexico-city', episode: 3 },
    image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&q=80',
    episodes: 5,
  },
]
