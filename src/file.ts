import fs from 'fs'
import path from 'path'
import { zip } from 'zip-a-folder'

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

const rename = async (oldPath: string, newPath: string) => {
  return await new Promise<string>((resolve, reject) => {
    fs.rename(oldPath, newPath, (err) => {
      if (err != null) reject(err)
      resolve(newPath)
    })
  })
}

const renameFile = async (
  oldPath: string,
  newPath: string
): Promise<string> => {
  return await rename(
    path.resolve(imagesDirectory, oldPath),
    path.resolve(imagesDirectory, newPath)
  )
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

  if (options.quiet && !options.zip)
    paths.forEach((path) => {
      console.log(path)
    })
}

export const createImageDirectory = () => {
  log('Creating directory if non-existant...')
  if (!fs.existsSync(imagesDirectory)) fs.mkdirSync(imagesDirectory)
}

export const zipFolder = async () => {
  const zipPath = path.resolve(imagesDirectory + '.zip')
  const tempPath = path.resolve('./.temp.zip')
  log(`Zipping files to ${zipPath}...`)
  await zip(imagesDirectory, tempPath)
  if (!options.preventDeletion) {
    fs.rmSync(imagesDirectory, { recursive: true, force: true })
  }
  await rename(tempPath, zipPath)
  log(`Zipping complete.`)
  if (options.quiet) console.log(zipPath)
}
