import { type Page } from 'puppeteer'
import { options } from './command'
import { getImageUuidsOnPage } from './getImageUuidsOnPage'
import { log } from './console'

export const login = async (page: Page) => {
  if (options.password !== undefined) {
    log('Authenticating...')
    const inputSelector = 'input#session_password'
    const loginButtonSelector = 'input.single'
    await page.waitForSelector(inputSelector)
    await page.type(inputSelector, options.password)

    await page.click(loginButtonSelector)
  }
}

const getPageUrl = (pageNumber: number) =>
  `https://mitene.us/f/${options.albumId}?page=${pageNumber}`

const imgSelector = 'a.media-thumbnail-container'
export const getImgData = async (page: Page) => {
  await page.waitForSelector(imgSelector)
  const imgData = await getImageUuidsOnPage(page)

  let allImgsWithinDateRange = false
  let currentPage = 1
  while (!allImgsWithinDateRange) {
    if (imgData[imgData.length - 1].timestamp >= options.to) {
      currentPage++
      await page.goto(getPageUrl(currentPage))
      imgData.push(...(await getImageUuidsOnPage(page)))
      continue
    }
    allImgsWithinDateRange = true
  }

  return imgData
}

// filter imgData to remove images from before from range and after to range, and then map to src only
export const getImgUuids = async (page: Page) => {
  log('Finding media file data...')
  const imgData = (await getImgData(page))
    .filter(
      (img) => img.timestamp <= options.from && img.timestamp >= options.to
    )
    .map((img) => img.src)
  log(`Found ${imgData.length} files in date range.`)
  return imgData
}

export const goToAlbumPage = async (page: Page) =>
  await page.goto(`https://mitene.us/f/${options.albumId}`)
