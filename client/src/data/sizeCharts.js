export const SIZE_CHARTS = {
  player_jersey: {
    label: 'Player Edition Jersey',
    note: 'Slim athletic fit. Designed for on-pitch performance.',
    sizes: [
      { size: 'XS', chest: '34-36', length: '25', fit: 'Athletic' },
      { size: 'S', chest: '36-38', length: '26', fit: 'Athletic' },
      { size: 'M', chest: '38-40', length: '27', fit: 'Athletic' },
      { size: 'L', chest: '40-42', length: '28', fit: 'Athletic' },
      { size: 'XL', chest: '42-44', length: '29', fit: 'Athletic' },
      { size: 'XXL', chest: '44-46', length: '30', fit: 'Athletic' },
    ],
  },
  fan_jersey: {
    label: 'Fan Edition Jersey',
    note: 'Regular comfortable fit. Perfect for everyday wear.',
    sizes: [
      { size: 'S', chest: '36-38', length: '27', fit: 'Regular' },
      { size: 'M', chest: '38-40', length: '28', fit: 'Regular' },
      { size: 'L', chest: '40-42', length: '29', fit: 'Regular' },
      { size: 'XL', chest: '42-44', length: '30', fit: 'Regular' },
      { size: 'XXL', chest: '44-46', length: '31', fit: 'Regular' },
      { size: '3XL', chest: '46-48', length: '32', fit: 'Regular' },
    ],
  },
  retro_jersey: {
    label: 'Retro Edition Jersey',
    note: 'Classic loose fit. Inspired by vintage football kits.',
    sizes: [
      { size: 'S', chest: '38-40', length: '28', fit: 'Loose' },
      { size: 'M', chest: '40-42', length: '29', fit: 'Loose' },
      { size: 'L', chest: '42-44', length: '30', fit: 'Loose' },
      { size: 'XL', chest: '44-46', length: '31', fit: 'Loose' },
      { size: 'XXL', chest: '46-48', length: '32', fit: 'Loose' },
    ],
  },
  boot: {
    label: 'Football Boot',
    note: 'Measure foot length in cm. If between sizes, go half up.',
    sizes: [
      { size: '38',uk: '5', us: '6', eu: '38', cm: '24.0' },
      { size: '39',uk: '5.5', us: '6.5', eu: '39', cm: '24.5' },
      { size: '40',uk: '6', us: '7', eu: '40', cm: '25.0' },
      { size: '41',uk: '7', us: '8', eu: '41', cm: '25.5' },
      { size: '42',uk: '7.5', us: '8.5', eu: '42', cm: '26.5' },
      { size: '43',uk: '8.5', us: '9.5', eu: '43', cm: '27.5' },
      { size: '44',uk: '9.5', us: '10.5', eu: '44', cm: '28.5' },
      { size: '45',uk: '10', us: '11', eu: '45', cm: '29.0' },
      { size: '46',uk: '11', us: '12', eu: '46', cm: '30.0' },
    ],
  },
  accessory: {
    label: 'Accessories',
    note: 'One size fits most unless stated otherwise.',
    sizes: [
      { size: 'One Size', detail: 'Fits most adults' },
    ],
  },
}

export const getSizeChart = (type) => SIZE_CHARTS[type] || SIZE_CHARTS.fan_jersey
