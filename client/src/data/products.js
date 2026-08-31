export const CATEGORIES = [
  { id: 'jersey', name: 'Jerseys', blurb: 'Club · National · Retro' },
  { id: 'boots', name: 'Boots', blurb: 'FG · Turf · Indoor' },
  { id: 'football', name: 'Footballs', blurb: 'Match · Training · Futsal' },
  { id: 'training', name: 'Training', blurb: 'Cones · Bibs · Ladders' },
  { id: 'goalkeeper', name: 'Goalkeeping', blurb: 'Gloves · GK Kits' },
  { id: 'turf', name: 'Turf & Grass', blurb: 'Artificial · Installation' },
  { id: 'accessories', name: 'Accessories', blurb: 'Guards · Socks · Bags' },
  { id: 'merch', name: 'Fan Merch', blurb: 'Scarves · Caps · Mugs' },
]

export const BRANDS = ['Fleetmart Pro', 'StrikerX', 'Velocita', 'Northwall', 'TitanGrip']

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
export const BOOT_SIZES = ['39', '40', '41', '42', '43', '44', '45']

export const TEAMS = {
  omega: { name: 'Omega FC', primary: '#7C1D2E', secondary: '#F5E9DC', number: '#F5E9DC' },
  azurecity: { name: 'Azure City', primary: '#1D5C9E', secondary: '#0A0E13', number: '#F5F7F4' },
  voltarmada: { name: 'Volt Armada', primary: '#2A3320', secondary: '#C6F53F', number: '#C6F53F' },
  crimson: { name: 'Crimson United', primary: '#B3222B', secondary: '#1A1A1A', number: '#FFFFFF' },
  royal: { name: 'Royal Athletic', primary: '#23306B', secondary: '#E8C36A', number: '#F5F7F4' },
  midnight: { name: 'Midnight SC', primary: '#101418', secondary: '#3FA9F5', number: '#3FA9F5' },
  saffron: { name: 'Saffron Kings', primary: '#E07C1F', secondary: '#12203A', number: '#FFFFFF' },
  emerald: { name: 'Emerald Rovers', primary: '#146B45', secondary: '#F5F7F4', number: '#F5F7F4' },
  bd: { name: 'Bangladesh', primary: '#0E6B3A', secondary: '#C62828', number: '#F5F7F4' },
  argento: { name: 'Argento Bianco', primary: '#F5F7F4', secondary: '#0A3D91', number: '#0A3D91' },
}

export const categoryMeta = (id) => CATEGORIES.find((c) => c.id === id)
