#!/usr/bin/env node

import { createImageDirectory, renameFilesToTimestamp, zipFolder } from './file'
import { downloadImagesFromUuids } from './download'
import { getImgUuids, goToAlbumPage, login } from './pageActions'
import { createPage } from './page'
import { log } from './console'
import { imagesDirectory } from './directory'
import { options } from './command'

const run = async () => {
  createImageDirectory()

  const { page, close } = await createPage()

  await goToAlbumPage(page)

  await login(page)

  const imgUuids = await getImgUuids(page)

  await downloadImagesFromUuids(page, imgUuids)

  await renameFilesToTimestamp(imgUuids)

  if (options.zip) {
    await zipFolder()
  } else {
    log(`Files saved to ${imagesDirectory}.`)
  }

  await close()
}

void run()
