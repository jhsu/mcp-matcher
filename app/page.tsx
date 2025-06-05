import { Suspense } from "react";
import ServerMatch from "./components/ServerMatch";
import { generateMetadata } from "./page-metadata";

export { generateMetadata };

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="text-gray-500">Loading...</div>
          </div>
        }
      >
        <ServerMatch />
      </Suspense>
    </div>
  );
}
