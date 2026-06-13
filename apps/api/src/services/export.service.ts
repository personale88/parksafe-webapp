import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'

import { getAllTags } from '../repositories/tags.repository'
import { generateQrPng } from './qr.service'

export async function exportQrZip() {
  const tags = await getAllTags()

  const exportDir = path.join(process.cwd(), 'exports')

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }

  const zipName = `qr-batch-${Date.now()}.zip`
  const zipPath = path.join(exportDir, zipName)

  const output = fs.createWriteStream(zipPath)

  const archive = archiver('zip', {
    zlib: { level: 9 },
  })

  archive.pipe(output)

  for (const tag of tags) {
    const png = await generateQrPng(tag.tagCode)

    archive.append(png, {
      name: `${tag.tagCode}.png`,
    })
  }

  await archive.finalize()

  return {
    success: true,
    fileName: zipName,
    path: zipPath,
    count: tags.length,
  }
}