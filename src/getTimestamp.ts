import FfmpegCommand from 'fluent-ffmpeg'
import { read as exifRead } from 'fast-exif'
import { isImage, isVideo } from './extensions'

const probe = async (file: string): Promise<FfmpegCommand.FfprobeData> => {
  return await new Promise((resolve, reject) => {
    FfmpegCommand.ffprobe(file, (err, info) => {
      if (err !== null) {
        reject(file)
      } else {
        resolve(info)
      }
    })
  })
}

const timestampToFilenameFormat = (timestamp: string) =>
  timestamp.split('Z')[0].replace(/[-:.T]/g, '_') + '_familyalbum'

// for files with no date, just use the previous date + 1
let lastDateSet = new Date()
const getSafetyDate = () => new Date(lastDateSet.getTime() + 1)

const getTimestampFromVideoFilename = async (file: string) => {
  const fileInfo = await probe(file)
  let timestamp = fileInfo.format.tags?.creation_time
  if (timestamp === undefined) {
    const safteyDate = getSafetyDate()
    lastDateSet = safteyDate
    timestamp = safteyDate.toISOString()
  }

  return timestampToFilenameFormat(timestamp as string)
}

const getTimestampFromImageFilename = async (file: string) => {
  const fileInfo = await exifRead(file)
  let date: Date
  try {
    if (fileInfo?.exif === undefined)
      throw new Error("Couldn't fetch EXIF data for file: " + file)
    date = fileInfo.exif.DateTimeOriginal as Date
    if (date === undefined) throw new Error("Couldn't get timestamp from file")
  } catch {
    date = getSafetyDate()
  }
  lastDateSet = date
  return timestampToFilenameFormat(date.toISOString())
}

export const getTimestampFromFilename = async (
  extension: string,
  file: string
) => {
  if (isVideo(extension)) {
    return await getTimestampFromVideoFilename(file)
  } else if (isImage(extension)) {
    return await getTimestampFromImageFilename(file)
  }
  throw new Error("Couldn't determine if file was video or image: " + file)
}
