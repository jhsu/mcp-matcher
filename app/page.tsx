import ServerMatch from "./components/ServerMatch";
import { generateMetadata } from "./page-metadata";

export { generateMetadata };

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ServerMatch />
    </div>
  );
}
