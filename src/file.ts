import fs from 'fs'
import path from 'path'

import { imagesDirectory } from './directory'
import { getTimestampFromFilename } from './getTimestamp'
import { options } from './command'
import { log } from './console'

export const getFullFilenameFromTitle = (title: string): [string, string] => {
  const files = fs.readdirSync(imagesDirectory)
  const file = files.find((file) => file.includes(title))
  if (file === undefined)
    throw new Error("Couldn't find file with title: " + title)
  return [file, '.' + file.split('.').slice(1).join('')]
}

export const isFilenameUsedInDirectory = (
  filename: string,
  directoryPath: string
) => {
  const files = fs.readdirSync(directoryPath)
  const regex = new RegExp(`^${filename}\\b`, 'i')

  return files.some(
    (file) => regex.test(file) && file.search('.crdownload') === -1
  )
}

const renameFile = async (
  oldPath: string,
  newPath: string
): Promise<string> => {
  return await new Promise((resolve, reject) => {
    const filename = path.resolve(imagesDirectory, newPath)
    fs.rename(path.resolve(imagesDirectory, oldPath), filename, (err) => {
      if (err != null) reject(err)
      resolve(filename)
    })
  })
}

export const renameFilesToTimestamp = async (imgUuids: string[]) => {
  const renameJobs = await Promise.all(
    imgUuids.map(async (uuid) => {
      const [filename, extension] = getFullFilenameFromTitle(uuid)
      return {
        filename,
        newName:
          (await getTimestampFromFilename(
            extension,
            imagesDirectory + '/' + filename
          )) + extension
      }
    })
  )

  const paths = await Promise.all(
    renameJobs.map(async ({ filename, newName }) => {
      return await renameFile(filename, newName)
    })
  )

  if (options.quiet)
    paths.forEach((path) => {
      console.log(path)
    })
}

export const createImageDirectory = () => {
  if (!fs.existsSync(imagesDirectory)) fs.mkdirSync(imagesDirectory)
}
