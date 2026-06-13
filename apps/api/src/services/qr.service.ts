import QRCode from 'qrcode'

export async function generateQrPng(tagCode: string) {
  const url = `https://parksafe.tribly.ai/tag/${tagCode}`

  return await QRCode.toBuffer(url, {
    type: 'png',
    width: 500,
    margin: 2,
  })
}