import { type Page } from 'puppeteer'

export const getImageUuidsOnPage = async (
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
