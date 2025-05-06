// app/page.tsx
import Link from 'next/link';
// Import icons (ví dụ dùng Heroicons)
import { BookOpenIcon, DocumentTextIcon, AcademicCapIcon, RectangleStackIcon } from '@heroicons/react/24/outline';

// Cấu trúc dữ liệu, thêm các class Tailwind cụ thể để tối ưu build
const siteSections = [
  {
    title: 'Luyện Thi Theo Đề',
    description: 'Tuyển tập các đề thi TOPIK công khai chính thức qua các năm.',
    href: '/exams',
    icon: BookOpenIcon,
    gradientClasses: 'from-white to-blue-50', // Gradient từ trắng -> xanh nhạt
    iconBgClass: 'bg-blue-100',           // Nền icon
    iconTextClass: 'text-blue-600',         // Màu icon
    hoverBorderClass: 'hover:border-blue-200',// Viền khi hover mảnh hơn
    hoverTextClass: 'group-hover:text-blue-700', // Màu chữ tiêu đề khi hover
    arrowTextClass: 'text-blue-600',        // Màu mũi tên/chữ xem thêm
  },
  {
    title: 'Luyện Thi Theo Dạng',
    description: 'Rèn luyện kỹ năng theo từng dạng bài cụ thể trong đề thi TOPIK.',
    href: '/practice',
    icon: RectangleStackIcon,
    gradientClasses: 'from-white to-emerald-50',
    iconBgClass: 'bg-emerald-100',
    iconTextClass: 'text-emerald-600',
    hoverBorderClass: 'hover:border-emerald-200',
    hoverTextClass: 'group-hover:text-emerald-700',
    arrowTextClass: 'text-emerald-600',
  },
   {
    title: 'Phòng Học Tập',
    description: 'Theo dõi tiến độ, quản lý kết quả và kế hoạch học tập cá nhân.',
    href: '/study',
    icon: AcademicCapIcon,
    gradientClasses: 'from-white to-purple-50',
    iconBgClass: 'bg-purple-100',
    iconTextClass: 'text-purple-600',
    hoverBorderClass: 'hover:border-purple-200',
    hoverTextClass: 'group-hover:text-purple-700',
    arrowTextClass: 'text-purple-600',
  },
  {
    title: 'Tài Liệu Hữu Ích',
    description: 'Tổng hợp từ vựng, ngữ pháp và các tài liệu cần thiết khác.',
    href: '/materials',
    icon: DocumentTextIcon,
    gradientClasses: 'from-white to-yellow-50',
    iconBgClass: 'bg-yellow-100',
    iconTextClass: 'text-yellow-700',
    hoverBorderClass: 'hover:border-yellow-300', // Màu vàng cần đậm hơn chút
    hoverTextClass: 'group-hover:text-yellow-800',
    arrowTextClass: 'text-yellow-700',
  },
];


export default function HomePage() {
  return (
    // Nền trang với gradient nhẹ và padding lớn hơn
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      {/* Tăng max-width để nội dung rộng hơn trên màn hình lớn */}
      <div className="max-w-6xl mx-auto">
        {/* Phần Giới Thiệu - Tinh chỉnh font và khoảng cách */}
        <div className="text-center mb-20 lg:mb-28">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-6"> {/* tracking-tight cho chữ gần nhau hơn */}
            Chào mừng đến với SooMeta
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"> {/* leading-relaxed cho dãn dòng */}
            Nền tảng toàn diện giúp bạn luyện thi TOPIK hiệu quả. Khám phá các tính năng luyện đề, học theo dạng bài, quản lý tiến độ và tài liệu học tập phong phú.
          </p>
        </div>

        {/* Phần Card Liên Kết - Nâng cấp giao diện */}
        {/* Giảm số cột trên màn hình lớn để card to hơn? Ví dụ: md:grid-cols-2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {siteSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              // Hiệu ứng scale tinh tế hơn, bo góc lớn hơn
              className="block group rounded-2xl overflow-hidden transition-all duration-300 ease-in-out transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div
                // Gradient nền, border mảnh, shadow tinh tế hơn, flex column
                className={`relative h-full p-8 lg:p-10 bg-gradient-to-br ${section.gradientClasses} border border-gray-100 shadow-sm hover:shadow-md ${section.hoverBorderClass} transition-all duration-300 ease-in-out flex flex-col justify-between`} // flex-col và justify-between để đẩy mũi tên xuống dưới
              >
                {/* Phần trên: Icon và Text */}
                <div>
                  {/* Icon trong vòng tròn màu */}
                  {section.icon && (
                    <div className={`mb-6 inline-flex items-center justify-center h-12 w-12 rounded-full ${section.iconBgClass} transition-colors duration-300`}>
                       <section.icon className={`h-6 w-6 ${section.iconTextClass}`} aria-hidden="true" />
                    </div>
                  )}
                  {/* Tiêu đề */}
                  <h2 className={`text-xl lg:text-2xl font-semibold text-gray-900 mb-3 ${section.hoverTextClass} transition-colors duration-300`}>
                    {section.title}
                  </h2>
                  {/* Mô tả */}
                  <p className="text-base text-gray-600 leading-relaxed"> {/* Dãn dòng */}
                    {section.description}
                  </p>
                </div>

                {/* Phần dưới: Mũi tên/Chữ xem thêm (xuất hiện khi hover) */}
                <div className="mt-8 text-right"> {/* Tăng khoảng cách mt */}
                    <span className={`inline-flex items-center text-sm font-medium ${section.arrowTextClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out`}>
                        Xem chi tiết
                        {/* Icon mũi tên SVG */}
                        <svg className="ml-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                        </svg>
                    </span>
                 </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}