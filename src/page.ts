import puppeteer from 'puppeteer'
import { options } from './command'
import { imagesDirectory } from './directory'

export const createPage = async () => {
  const browser = await puppeteer.launch({
    headless: options.headless ? 'new' : false
  })
  const page = await browser.newPage()

  const client = await page.target().createCDPSession()
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: imagesDirectory
  })

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 })

  return {
    page,
    close: async () => {
      await browser.close()
    }
  }
}
