/**
 * Admin tag batch generation — creates unique QR tags and packages downloads.
 */

import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import type { TagBatchSummary } from '@parksafe/types'
import {
  createTagBatch,
  findTagBatchById,
  insertBatchTags,
  listRecentTagBatches,
  listTagsByBatchId,
  markBatchCompleted,
  markBatchFailed,
  markBatchProcessing,
  updateBatchProgress,
  type TagBatchRow,
} from '../repositories/tagBatches.repository'
import { getDb } from '../lib/db'
import {
  adminDevCreateBatch,
  adminDevFindBatch,
  adminDevGetBatchSummary,
  adminDevListBatchSummaries,
  adminDevListTagsByBatch,
  adminDevProcessBatch,
} from './admin-dev-store'
import { adminDistinctId, trackServer } from '../lib/analytics'

const CHUNK_SIZE = 50
/** Rough tags/sec for ETA — tuned from local bulk insert + UUID generation. */
const TAGS_PER_SECOND_ESTIMATE = 120

function getContactBaseUrl(): string {
  return (
    process.env['SITE_URL'] ??
    process.env['ALLOWED_ORIGIN'] ??
    'https://parksafe.tribly.ai'
  ).replace(/\/$/, '')
}

function buildContactUrl(tagCode: string): string {
  return `${getContactBaseUrl()}/contact/${encodeURIComponent(tagCode)}`
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function computeProgress(batch: TagBatchRow): Pick<
  TagBatchSummary,
  'progressPercent' | 'estimatedSecondsRemaining'
> {
  const { requestedCount, completedCount, status, startedAt } = batch

  if (requestedCount <= 0) {
    return { progressPercent: 0, estimatedSecondsRemaining: null }
  }

  const progressPercent = Math.min(
    100,
    Math.round((completedCount / requestedCount) * 100)
  )

  if (status === 'COMPLETED') {
    return { progressPercent: 100, estimatedSecondsRemaining: 0 }
  }

  if (status === 'FAILED' || status === 'PENDING') {
    const remaining = Math.max(0, requestedCount - completedCount)
    const eta =
      remaining > 0 ? Math.max(1, Math.ceil(remaining / TAGS_PER_SECOND_ESTIMATE)) : null
    return { progressPercent, estimatedSecondsRemaining: eta }
  }

  const remaining = Math.max(0, requestedCount - completedCount)
  if (remaining === 0) {
    return { progressPercent, estimatedSecondsRemaining: 0 }
  }

  if (startedAt) {
    const elapsedSec = Math.max(0.5, (Date.now() - startedAt.getTime()) / 1000)
    const rate = completedCount > 0 ? completedCount / elapsedSec : TAGS_PER_SECOND_ESTIMATE
    const effectiveRate = Math.max(rate, 1)
    return {
      progressPercent,
      estimatedSecondsRemaining: Math.max(1, Math.ceil(remaining / effectiveRate)),
    }
  }

  return {
    progressPercent,
    estimatedSecondsRemaining: Math.max(1, Math.ceil(remaining / TAGS_PER_SECOND_ESTIMATE)),
  }
}

export function mapBatchToSummary(batch: TagBatchRow): TagBatchSummary {
  const { progressPercent, estimatedSecondsRemaining } = computeProgress(batch)

  return {
    id: batch.id,
    requestedCount: batch.requestedCount,
    completedCount: batch.completedCount,
    status: batch.status,
    errorMessage: batch.errorMessage,
    progressPercent,
    estimatedSecondsRemaining,
    startedAt: toIso(batch.startedAt),
    completedAt: toIso(batch.completedAt),
    createdAt: batch.createdAt.toISOString(),
  }
}

async function generateUniqueTagCodes(count: number): Promise<string[]> {
  return Array.from({ length: count }, () => randomUUID())
}

async function processBatchAsync(batchId: string, requestedCount: number): Promise<void> {
  try {
    const started = await markBatchProcessing(batchId)
    if (!started) {
      throw new Error('Batch not found or already processing')
    }

    let completed = 0

    while (completed < requestedCount) {
      const remaining = requestedCount - completed
      const chunkSize = Math.min(CHUNK_SIZE, remaining)
      const tagCodes = await generateUniqueTagCodes(chunkSize)
      const inserted = await insertBatchTags(batchId, tagCodes)

      if (inserted === 0) {
        throw new Error('Failed to insert tags — possible duplicate collision')
      }

      completed += inserted
      await updateBatchProgress(batchId, completed)
    }

    await markBatchCompleted(batchId)
    trackServer(adminDistinctId(), {
      event: 'admin_batch_completed',
      properties: { tagCount: requestedCount },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown batch processing error'
    console.error(`[admin] Batch ${batchId} failed:`, message)
    await markBatchFailed(batchId, message)
    trackServer(adminDistinctId(), {
      event: 'admin_batch_failed',
      properties: { tagCount: requestedCount },
    })
  }
}

export async function startTagBatchGeneration(
  count: number
): Promise<{ success: true; batch: TagBatchSummary } | { success: false; error: string }> {
  if (!getDb()) {
    const batch = adminDevCreateBatch(count)
    void adminDevProcessBatch(batch.id, count)
    const summary = adminDevGetBatchSummary(batch.id)
    if (!summary) {
      return { success: false, error: 'Failed to create batch' }
    }
    return { success: true, batch: summary }
  }

  const batch = await createTagBatch(count)
  if (!batch) {
    return { success: false, error: 'Database unavailable' }
  }

  void processBatchAsync(batch.id, count)

  return { success: true, batch: mapBatchToSummary(batch) }
}

export async function getTagBatchStatus(
  batchId: string
): Promise<TagBatchSummary | null> {
  if (!getDb()) {
    return adminDevGetBatchSummary(batchId)
  }

  const batch = await findTagBatchById(batchId)
  if (!batch) return null
  return mapBatchToSummary(batch)
}

export async function listBatchTagSamples(
  batchId: string,
  limit = 5
): Promise<
  Array<{ tagCode: string; contactUrl: string; status: 'UNREGISTERED' | 'ACTIVE' | 'INACTIVE' }>
> {
  const tagRows = getDb()
    ? await listTagsByBatchId(batchId)
    : adminDevListTagsByBatch(batchId)

  return tagRows.slice(0, limit).map(row => ({
    tagCode: row.tagCode,
    contactUrl: buildContactUrl(row.tagCode),
    status: row.status,
  }))
}

export async function listTagBatchHistory(limit = 10): Promise<TagBatchSummary[]> {
  if (!getDb()) {
    return adminDevListBatchSummaries(limit)
  }

  const batches = await listRecentTagBatches(limit)
  return batches.map(mapBatchToSummary)
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function buildInventoryCsv(
  rows: Awaited<ReturnType<typeof listTagsByBatchId>>
): string {
  const header = 'Tag ID,Tag Code,Contact URL,Status,Created At'
  const lines = rows.map(row => {
    const fields = [
      row.id,
      row.tagCode,
      buildContactUrl(row.tagCode),
      row.status,
      row.createdAt.toISOString(),
    ]
    return fields.map(escapeCsvField).join(',')
  })
  return [header, ...lines].join('\n')
}

async function generateQrPng(contactUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(contactUrl, {
    type: 'png',
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
  })
}

export async function buildBatchZipStream(
  batchId: string
): Promise<
  | { success: true; stream: Readable; filename: string }
  | { success: false; error: string; status: number }
> {
  const batch = getDb() ? await findTagBatchById(batchId) : adminDevFindBatch(batchId)
  if (!batch) {
    return { success: false, error: 'Batch not found', status: 404 }
  }

  if (batch.status !== 'COMPLETED') {
    return {
      success: false,
      error: 'Batch is not ready for download',
      status: batch.status === 'FAILED' ? 422 : 409,
    }
  }

  const tagRows = getDb()
    ? await listTagsByBatchId(batchId)
    : adminDevListTagsByBatch(batchId)
  if (tagRows.length === 0) {
    return { success: false, error: 'No tags found for this batch', status: 404 }
  }

  const zip = new JSZip()
  zip.file('tag_inventory.csv', buildInventoryCsv(tagRows))

  const batchFolderName = batchId.slice(0, 8)
  const readme = [
    'ParkSafe QR batch export',
    '',
    `Batch ID: ${batchId}`,
    `Tags in this ZIP: ${tagRows.length}`,
    '',
    'Files:',
    '- tag_inventory.csv — Tag Code and Contact URL for each tag',
    `- qr-codes/${batchFolderName}/ — PNG files named by Tag Code (UUID)`,
    '',
    'Testing locally:',
    '- Open the Contact URL from the CSV on the same PC (not your phone).',
    '- localhost URLs in QR codes only work on the machine running the dev server.',
    '- Each PNG is unique — do not reuse PNG files from older batches.',
  ].join('\n')
  zip.file('README.txt', readme)

  const qrFolder = zip.folder(`qr-codes/${batchFolderName}`)

  if (!qrFolder) {
    return { success: false, error: 'Failed to create ZIP archive', status: 500 }
  }

  for (const row of tagRows) {
    const contactUrl = buildContactUrl(row.tagCode)
    const png = await generateQrPng(contactUrl)
    qrFolder.file(`${row.tagCode}.png`, png)
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  const stream = Readable.from(buffer)

  const dateStamp = batch.completedAt?.toISOString().slice(0, 10) ?? 'export'
  const filename = `parksafe-tags-${dateStamp}-${batchId.slice(0, 8)}.zip`

  return { success: true, stream, filename }
}
