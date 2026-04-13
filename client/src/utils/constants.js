export const STAGES = {
  el_desconocido: {
    id: 'el_desconocido',
    label: 'El Desconocido',
    subtitle: 'The Stranger',
    description: 'Heavy English narration. Single Spanish words. 3 response choices shown.',
    color: '#9a8e7e',
  },
  el_visitante: {
    id: 'el_visitante',
    label: 'El Visitante',
    subtitle: 'The Visitor',
    description: 'Narration thins. More Spanish dialogue. Choices still visible as phrases.',
    color: '#d4a853',
  },
  el_residente: {
    id: 'el_residente',
    label: 'El Residente',
    subtitle: 'The Resident',
    description: 'Minimal narration. You are in the scene. Free speech unlocks.',
    color: '#c4603a',
  },
  el_habitante: {
    id: 'el_habitante',
    label: 'El Habitante',
    subtitle: 'The Local',
    description: 'Full immersion. Native speed. No narration. Free speech only.',
    color: '#5a8a5e',
  },
}

export const CITY_IMAGES = {
  madrid: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1200&q=80',
  'mexico-city': 'https://images.unsplash.com/photo-1518659526054-190340b32735?w=1200&q=80',
  'buenos-aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&q=80',
}

export const CITY_NAMES = {
  madrid: 'Madrid',
  'mexico-city': 'Mexico City',
  'buenos-aires': 'Buenos Aires',
}

export const CONFIDENCE_COLORS = {
  unknown: '#3a342e',
  frontier: '#d4a853',
  acquired: '#5a8a5e',
}
