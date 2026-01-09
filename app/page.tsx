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
  //  {
  //   title: 'Phòng Học Tập',
  //   description: 'Theo dõi tiến độ, quản lý kết quả và kế hoạch học tập cá nhân.',
  //   href: '/study',
  //   icon: AcademicCapIcon,
  //   gradientClasses: 'from-white to-purple-50',
  //   iconBgClass: 'bg-purple-100',
  //   iconTextClass: 'text-purple-600',
  //   hoverBorderClass: 'hover:border-purple-200',
  //   hoverTextClass: 'group-hover:text-purple-700',
  //   arrowTextClass: 'text-purple-600',
  // },
  // {
  //   title: 'Tài Liệu Hữu Ích',
  //   description: 'Tổng hợp từ vựng, ngữ pháp và các tài liệu cần thiết khác.',
  //   href: '/materials',
  //   icon: DocumentTextIcon,
  //   gradientClasses: 'from-white to-yellow-50',
  //   iconBgClass: 'bg-yellow-100',
  //   iconTextClass: 'text-yellow-700',
  //   hoverBorderClass: 'hover:border-yellow-300', // Màu vàng cần đậm hơn chút
  //   hoverTextClass: 'group-hover:text-yellow-800',
  //   arrowTextClass: 'text-yellow-700',
  // },
];


export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-64px-56px)] px-4 sm:px-6 lg:px-8 pt-10 lg:pt-16 pb-12 flex flex-col">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-16">
          <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 mb-3 tracking-tight">
            Chào mừng đến với <span className="text-blue-600">TopikGo</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Nền tảng toàn diện giúp bạn luyện thi TOPIK hiệu quả
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {siteSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="block"
            >
              <div className="h-full p-8 bg-white rounded-2xl border border-black/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_0_rgba(0,0,0,0.05)] flex flex-col">
                {/* Content wrapper */}
                <div className="flex-1">
                  {/* Icon */}
                  {section.icon && (
                    <div className={`mb-5 inline-flex items-center justify-center h-11 w-11 rounded-xl ${section.iconBgClass}`}>
                      <section.icon className={`h-5 w-5 ${section.iconTextClass}`} strokeWidth={2} />
                    </div>
                  )}
                  
                  {/* Title */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {section.title}
                  </h2>
                  
                  {/* Description */}
                  <p className="text-[15px] text-gray-600 leading-relaxed">
                    {section.description}
                  </p>
                </div>
                
                {/* Arrow - Fixed at bottom-right */}
                <div className="mt-6 flex items-center justify-end text-sm font-medium text-blue-600">
                  <span>Xem chi tiết</span>
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}