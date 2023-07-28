import fs from 'fs'
import puppeteer from 'puppeteer'
import { options } from './command'
import { getImageUuidsOnPage } from './getImageUuidsOnPage'
import { imagesDirectory } from './directory'
import { renameFilesToTimestamp } from './file'
import { downloadImagesFromUuids } from './download'

const imgSelector = 'a.media-thumbnail-container'

const { albumId, password } = options

const getPageUrl = (pageNumber: number) =>
  `https://mitene.us/f/${albumId}?page=${pageNumber}`

const run = async () => {
  const dateRange = {
    from: options.from,
    to: options.to
  }

  if (!fs.existsSync(imagesDirectory)) fs.mkdirSync(imagesDirectory)
  const browser = await puppeteer.launch({
    headless: options.headless ? 'new' : false
  })
  const page = await browser.newPage()

  const client = await page.target().createCDPSession()
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: imagesDirectory
  })

  await page.goto(`https://mitene.us/f/${albumId}`)

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 })

  // Type into password field
  if (password !== undefined) {
    const inputSelector = 'input#session_password'
    const loginButtonSelector = 'input.single'
    await page.waitForSelector(inputSelector)
    await page.type(inputSelector, password)

    await page.click(loginButtonSelector)
  }

  await page.waitForSelector(imgSelector)
  const imgData = await getImageUuidsOnPage(page)

  let allImgsWithinDateRange = false
  let currentPage = 1
  while (!allImgsWithinDateRange) {
    if (imgData[imgData.length - 1].timestamp >= dateRange.to) {
      currentPage++
      await page.goto(getPageUrl(currentPage))
      imgData.push(...(await getImageUuidsOnPage(page)))
      continue
    }
    allImgsWithinDateRange = true
  }
  // filter imgData to remove images from before from range and after to range, and then map to src only
  const imgUuids = imgData
    .filter(
      (img) => img.timestamp <= dateRange.from && img.timestamp >= dateRange.to
    )
    .map((img) => img.src)

  await downloadImagesFromUuids(page, imgUuids)

  await renameFilesToTimestamp(imgUuids)

  await browser.close()
}

void run()
