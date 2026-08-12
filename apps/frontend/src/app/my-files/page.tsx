import { Suspense } from 'react';
import { MyFilesDashboard } from '@/components/dashboard/my-files-dashboard';

export default function MyFilesPage(): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <MyFilesDashboard />
    </Suspense>
  );
}
