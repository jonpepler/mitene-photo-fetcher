import { type Page } from 'puppeteer'
import { imagesDirectory } from './directory'
import { isFilenameUsedInDirectory } from './file'
import { options } from './command'
import { createProgressBar, log } from './console'

const waitForDownload = async (filename: string): Promise<void> => {
  if (isFilenameUsedInDirectory(filename, imagesDirectory)) return

  await new Promise((resolve) => setTimeout(resolve, 50))
  await waitForDownload(filename)
}

// using suggested workaround for direct download links:
// https://github.com/puppeteer/puppeteer/issues/6728#issuecomment-986082241
const directDownload = async (page: Page, link: string) => {
  await page.evaluate((link) => {
    // eslint-disable-next-line no-undef
    location.href = link
  }, link)
}

const downloadImageFromUuid = async (page: Page, uuid: string) => {
  await directDownload(
    page,
    `https://mitene.us/f/${options.albumId}/media_files/${uuid}/download`
  )

  await waitForDownload(uuid)
}

export const downloadImagesFromUuids = async (page: Page, uuids: string[]) => {
  log(`Downloading files to ${imagesDirectory}...`)
  const { increase, stop } = createProgressBar(uuids.length)

  for (const uuid of uuids) {
    await downloadImageFromUuid(page, uuid)
    increase()
  }

  stop()
}
