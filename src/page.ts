import puppeteer from 'puppeteer'
import { options } from './command'
import { imagesDirectory } from './directory'
import { log } from './console'

export const createPage = async () => {
  log('Creating test browser...')
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
      log('Closing browser...')
      await browser.close()
    }
  }
}
