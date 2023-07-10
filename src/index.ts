import puppeteer from 'puppeteer'

const PASSWORD = '****'

const imgUuidRegex = /\/((?:\w+-)*\w+\.jp(?:e)?g)/

const imgSelector = 'a.media-thumbnail-container'

const run = async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto('https://mitene.us/f/****')

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 })

  // Type into password field
  const inputSelector = 'input#session_password'
  const loginButtonSelector = 'input.single'
  await page.waitForSelector(inputSelector)
  await page.type(inputSelector, PASSWORD)

  await page.click(loginButtonSelector)

  await page.waitForSelector(imgSelector)
  const thumbnailSources = await page.evaluate(() => {
    const thumbnails = [
      ...document.querySelectorAll(
        '.media-thumbnail-container > .media-thumbnail-box > .media-thumbnail > img.media-img'
      )
    ] as HTMLImageElement[]
    return thumbnails.map((el) => el.src)
  })
  const imgUuids = thumbnailSources.map((src) => src.match(imgUuidRegex)?.[1])
  imgUuids.forEach((uuid) => {
    console.log(uuid)
  })
  await browser.close()
}

void run()
