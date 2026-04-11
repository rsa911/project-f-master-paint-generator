/**
 * Color swatch hex values derived from CMY position on the color wheel.
 * Base colors computed from pigment ratios. Variants adjusted:
 *   -T (tint): lightened ~40%
 *   -G (grey): desaturated ~50%
 *   -S (shadow): darkened ~35%
 */
const colorMap = {
  // Family 1: Pure Yellow
  '1':    '#FFE800',
  '1-T':  '#FFF5A0',
  '1-G':  '#C8C07A',
  '1-S':  '#6B6000',

  // Family 2: Yellow-Orange (tiny Magenta)
  '2':    '#FFD700',
  '2-T':  '#FFF0A0',
  '2-G':  '#C8B87A',
  '2-S':  '#665500',

  // Family 3: Orange-Yellow (1M:3Y)
  '3':    '#FF9900',
  '3-T':  '#FFCC99',
  '3-G':  '#C8946A',
  '3-S':  '#663C00',

  // Family 4: Orange (3M:5Y)
  '4':    '#FF6600',
  '4-T':  '#FFAA80',
  '4-G':  '#C8704D',
  '4-S':  '#662800',

  // Family 5: Orange-Red (5M:2Y)
  '5':    '#FF2200',
  '5-T':  '#FF8877',
  '5-G':  '#C8584A',
  '5-S':  '#660D00',

  // Family 6: Primary Red (4M:1Y)
  '6':    '#EE0022',
  '6-T':  '#F77799',
  '6-G':  '#C84460',
  '6-S':  '#5E000D',

  // Family 7: Magenta-Red (7M:1Y)
  '7':    '#DD0066',
  '7-T':  '#EE88BB',
  '7-G':  '#B85585',
  '7-S':  '#580029',

  // Family 8: Hot Pink (12M:1Y)
  '8':    '#EE0099',
  '8-T':  '#F077CC',
  '8-G':  '#BB55A0',
  '8-S':  '#5E003D',

  // Family 9: Primary Magenta
  '9':    '#DD00BB',
  '9-T':  '#EE88DD',
  '9-G':  '#B05598',
  '9-S':  '#55004A',

  // Family 10: Magenta-Violet (1C:40M)
  '10':   '#CC00DD',
  '10-T': '#DD88EE',
  '10-G': '#A455BB',
  '10-S': '#500055',

  // Family 11: Mid Purple (1C:15M)
  '11':   '#9900CC',
  '11-T': '#CC77EE',
  '11-G': '#8855AA',
  '11-S': '#3C0052',

  // Family 12: Violet (1C:7M)
  '12':   '#7700CC',
  '12-T': '#BB88EE',
  '12-G': '#7755AA',
  '12-S': '#300052',

  // Family 13: Purple-Blue (2C:5M)
  '13':   '#5500CC',
  '13-T': '#AA88EE',
  '13-G': '#6655AA',
  '13-S': '#220052',

  // Family 14: True Blue (2C:1M)
  '14':   '#2244CC',
  '14-T': '#88AAEE',
  '14-G': '#5566AA',
  '14-S': '#0A1A52',

  // Family 15: Mid Blue (4C:1M)
  '15':   '#0066DD',
  '15-T': '#77AAEE',
  '15-G': '#4477AA',
  '15-S': '#002A58',

  // Family 16: Light Blue (10C:1M)
  '16':   '#0099EE',
  '16-T': '#88CCFF',
  '16-G': '#5599BB',
  '16-S': '#003D5E',

  // Family 17: Primary Cyan
  '17':   '#00CCEE',
  '17-T': '#88EEFF',
  '17-G': '#55AABB',
  '17-S': '#00525E',

  // Family 18: Turquoise Blue (20C:1Y)
  '18':   '#00CCCC',
  '18-T': '#88EEEE',
  '18-G': '#55AAAA',
  '18-S': '#005252',

  // Family 19: Turquoise (10C:1Y)
  '19':   '#00CC99',
  '19-T': '#88EED9',
  '19-G': '#55AAAA',
  '19-S': '#005240',

  // Family 20: Green Blue (5C:1Y)
  '20':   '#00CC66',
  '20-T': '#88EEB8',
  '20-G': '#55AA88',
  '20-S': '#00522A',

  // Family 21: Brilliant Green (3C:2Y)
  '21':   '#00CC00',
  '21-T': '#88EE88',
  '21-G': '#55AA55',
  '21-S': '#005200',

  // Family 22: Kelly Green (1C:2Y)
  '22':   '#44CC00',
  '22-T': '#AAEE88',
  '22-G': '#77AA55',
  '22-S': '#1A5200',

  // Family 23: Green Yellow (1C:6Y)
  '23':   '#99CC00',
  '23-T': '#CCEE88',
  '23-G': '#99AA55',
  '23-S': '#3D5200',

  // Family 24: Lime (1C:30Y)
  '24':   '#CCDD00',
  '24-T': '#EEEE88',
  '24-G': '#AAAA55',
  '24-S': '#525200',
}

export default colorMap
