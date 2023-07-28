import path from 'path'
import fs from 'fs'
import puppeteer, { type Page } from 'puppeteer'
import { getTimestampFromFilename } from './getTimestamp'
import { options } from './command'

const imgSelector = 'a.media-thumbnail-container'

const imagesDirectory = path.resolve('./images')

const { albumId, password } = options

const getPageUrl = (pageNumber: number) =>
  `https://mitene.us/f/${albumId}?page=${pageNumber}`

const getImageUuidsOnPage = async (
  page: Page
): Promise<Array<{ src: string; timestamp: Date }>> =>
  (
    await page.evaluate(() => {
      const imgUuidRegex =
        /\/((?:\w+-)*\w+)\.(?:png|jpg|gif|bmp|jpeg|PNG|JPG|GIF|BMP|JPEG)/
      const imgs = [
        ...document.querySelectorAll(
          '.media-thumbnail-container > .media-thumbnail-box > .media-thumbnail > img.media-img'
        )
      ] as HTMLImageElement[]

      return imgs.map((el) => {
        el.click()
        const dateString = document.querySelector('.media-took-at')?.textContent
        if (dateString === null || dateString === undefined)
          throw new Error("Couldn't get date for image: " + el.src)
        ;(
          document.querySelector('.overlay-whole-layer') as HTMLImageElement
        )?.click()
        console.log('src', el.src)
        const src = el.src.match(imgUuidRegex)?.[1]
        if (src === undefined)
          throw new Error('Failed to get src from image ' + el.src)

        // correct for American style dates
        const dateStringSplit = dateString
          .split('/')
          .map((n) => parseInt(n))
          .slice(0, 3)
        const timestamp = Date.UTC(
          dateStringSplit[2],
          dateStringSplit[0] - 1, // monthIndex
          dateStringSplit[1]
        )
        return {
          src,
          timestamp
        }
      })
    })
  ).map(({ timestamp, src }) => ({ timestamp: new Date(timestamp), src }))

const waitForDownload = async (filename: string): Promise<void> => {
  if (isFilenameUsedInDirectory(filename, imagesDirectory)) return

  await new Promise((resolve) => setTimeout(resolve, 50))
  await waitForDownload(filename)
}

const isFilenameUsedInDirectory = (filename: string, directoryPath: string) => {
  const files = fs.readdirSync(directoryPath)
  const regex = new RegExp(`^${filename}\\b`, 'i')

  return files.some(
    (file) => regex.test(file) && file.search('.crdownload') === -1
  )
}

const getFullFilenameFromTitle = (title: string): [string, string] => {
  const files = fs.readdirSync(imagesDirectory)
  const file = files.find((file) => file.includes(title))
  if (file === undefined)
    throw new Error("Couldn't find file with title: " + title)
  return [file, '.' + file.split('.').slice(1).join('')]
}

// using suggested workaround for direct download links:
// https://github.com/puppeteer/puppeteer/issues/6728#issuecomment-986082241
async function directDownload(page: Page, link: string) {
  await page.evaluate((link) => {
    // eslint-disable-next-line no-undef
    location.href = link
  }, link)
}

const downloadImageFromUuid = async (page: Page, uuid: string) => {
  await directDownload(
    page,
    `https://mitene.us/f/${albumId}/media_files/${uuid}/download`
  )

  await waitForDownload(uuid)
}

const downloadImagesFromUuids = async (page: Page, uuids: string[]) => {
  for (const uuid of uuids) {
    await downloadImageFromUuid(page, uuid)
  }
}

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
    console.log(
      imgData[imgData.length - 1].timestamp >= dateRange.to,
      imgData[imgData.length - 1].timestamp,
      dateRange.to
    )
    if (imgData[imgData.length - 1].timestamp >= dateRange.to) {
      currentPage++
      await page.goto(getPageUrl(currentPage))
      imgData.push(...(await getImageUuidsOnPage(page)))
      console.log(await page.$('.follower-paging-next-link .disabled'))
      continue
    }
    allImgsWithinDateRange = true
  }
  console.log(imgData)
  // filter imgData to remove images from before from range and after to range, and then map to src only
  console.log(imgData[5].timestamp)
  const imgUuids = imgData
    .filter(
      (img) => img.timestamp <= dateRange.from && img.timestamp >= dateRange.to
    )
    .map((img) => img.src)

  console.log('Reduction Count: ', imgData.length, imgUuids.length)

  await downloadImagesFromUuids(page, imgUuids)

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
  const renameFile = async (
    oldPath: string,
    newPath: string
  ): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      fs.rename(
        path.resolve(imagesDirectory, oldPath),
        path.resolve(imagesDirectory, newPath),
        (err) => {
          if (err != null) reject(err)
          resolve()
        }
      )
    })
  }
  await Promise.all(
    renameJobs.map(async ({ filename, newName }) => {
      await renameFile(filename, newName)
    })
  )

  await browser.close()
  console.log('end')
}

void run()
