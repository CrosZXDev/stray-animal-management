import { AnimalList } from '../../features/animals/animal-list';

export default function AnimalsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🐾 สัตว์จรจัดในระบบ</h1>
        <a
          href="/animals/register"
          className="rounded-md bg-orange-600 px-4 py-2 text-sm text-white font-medium hover:bg-orange-700 transition"
        >
          + ลงทะเบียนสัตว์ใหม่
        </a>
      </div>
      <AnimalList />
    </div>
  );
}
