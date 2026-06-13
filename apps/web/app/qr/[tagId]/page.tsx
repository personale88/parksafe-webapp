import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ tagId: string }>
}

export default async function QRPage({ params }: Props) {
  const { tagId } = await params
  redirect(`/contact/${tagId}`)
}