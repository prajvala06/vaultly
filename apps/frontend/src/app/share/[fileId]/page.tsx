import type { Metadata } from 'next';
import { ShareFileView } from '@/components/share/share-file-view';

type SharePageProps = {
  params: Promise<{ fileId: string }>;
};

export const metadata: Metadata = {
  title: 'Shared file · Vaultly',
  description: 'Open a shared Vaultly file in the app.',
};

export default async function SharePage({ params }: SharePageProps): Promise<React.ReactElement> {
  const { fileId } = await params;
  return <ShareFileView fileId={fileId} />;
}
