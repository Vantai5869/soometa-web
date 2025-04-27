// app/page.tsx
import Link from 'next/link';

const levels = [
  {
    id: 'topik1',
    name: 'TOPIK I',
    description: 'Dành cho người mới bắt đầu, trình độ sơ cấp.',
  },
  {
    id: 'topik2',
    name: 'TOPIK II',
    description: 'Dành cho trình độ trung cấp đến cao cấp.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen px-4 py-12 bg-white">
      <h1 className="text-3xl font-bold text-center mb-8">Chào mừng đến với SooMeta</h1>
      <p className="text-center text-gray-500 mb-12">
        Chọn cấp độ và cách luyện để bắt đầu hành trình chinh phục TOPIK!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {levels.map((level) => (
          <div
            key={level.id}
            className="border rounded-2xl p-6 shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">{level.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{level.description}</p>
            <div className="flex gap-4">
              <Link
                href={`/practice/exam?level=${level.id}`}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Luyện theo đề
              </Link>
              <Link
                href={`/practice/type?level=${level.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Luyện theo dạng
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
