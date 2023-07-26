const videoExtensions = [
  '.webm',
  '.mkv',
  '.flv',
  '.flv',
  '.vob',
  '.ogv',
  '.drc',
  '.gif',
  '.gifv',
  '.mng',
  '.avi',
  '.MTS',
  '.mov',
  '.wmv',
  '.yuv',
  '.rm',
  '.rmvb',
  '.viv',
  '.asf',
  '.amv',
  '.mp4',
  '.mpg',
  '.mpg',
  '.m4v',
  '.svi',
  '.3gp',
  '.3g2',
  '.mxf',
  '.roq',
  '.nsv',
  '.flv',
  '.qt'
]

export const isVideo = (extension: string) =>
  videoExtensions.includes(extension)

const imageExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.tiff',
  '.webp',
  '.svg'
]

export const isImage = (extension: string) =>
  imageExtensions.includes(extension)
