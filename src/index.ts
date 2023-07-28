#!/usr/bin/env node

import { createImageDirectory, renameFilesToTimestamp } from './file'
import { downloadImagesFromUuids } from './download'
import { getImgUuids, goToAlbumPage, login } from './pageActions'
import { createPage } from './page'

const run = async () => {
  createImageDirectory()

  const { page, close } = await createPage()

  await goToAlbumPage(page)

  await login(page)

  const imgUuids = await getImgUuids(page)

  await downloadImagesFromUuids(page, imgUuids)

  await renameFilesToTimestamp(imgUuids)

  await close()
}

void run()
