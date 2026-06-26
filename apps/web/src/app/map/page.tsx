import { MapView } from '../../features/map';

export default function MapPage() {
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 lg:-mx-8">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8 border-b bg-white">
        <h1 className="text-lg font-bold text-gray-900">🗺️ แผนที่สัตว์จรจัด</h1>
        <p className="text-sm text-gray-500 hidden sm:block">
          ดูตำแหน่งสัตว์จรจัด จุดให้อาหาร และพื้นที่ TNR
        </p>
      </div>
      <div className="h-[calc(100vh-8rem)]">
        <MapView />
      </div>
    </div>
  );
}
