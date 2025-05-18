import React from 'react';

// Định nghĩa các props mà Badge component có thể nhận
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  // children sẽ được bao gồm trong React.HTMLAttributes<HTMLDivElement>
}

const Badge: React.FC<BadgeProps> = ({
  children,
  className, // Cho phép truyền thêm class tùy chỉnh từ bên ngoài
  variant = 'default', // Giá trị mặc định cho variant
  ...props // Các props HTML khác (ví dụ: title, onClick, ...)
}) => {
  // Các lớp Tailwind CSS cơ bản cho tất cả các badge
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Các lớp Tailwind CSS cho từng loại variant
  let variantClasses = '';
  switch (variant) {
    case 'secondary':
      variantClasses = "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200/80 focus:ring-slate-400";
      break;
    case 'destructive':
      variantClasses = "border-transparent bg-red-500 text-white hover:bg-red-600/90 focus:ring-red-400";
      break;
    case 'outline':
      variantClasses = "text-slate-950 border-slate-300 bg-transparent hover:bg-slate-100 focus:ring-slate-400"; // Không có nền, chỉ viền
      break;
    case 'success':
      variantClasses = "border-transparent bg-green-500 text-white hover:bg-green-600/90 focus:ring-green-400";
      break;
    case 'warning':
      variantClasses = "border-transparent bg-yellow-400 text-yellow-900 hover:bg-yellow-500/90 focus:ring-yellow-300";
      break;
    case 'default':
    default:
      variantClasses = "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-800/90 focus:ring-slate-400"; // Ví dụ: badge mặc định màu tối
      break;
  }

  // Kết hợp các lớp: base, variant, và các class tùy chỉnh (nếu có)
  // Các class trong `className` được truyền vào sẽ được ưu tiên nếu có xung đột (do thứ tự trong chuỗi)
  const combinedClassName = `${baseClasses} ${variantClasses} ${className || ''}`;

  return (
    <div className={combinedClassName.trim()} {...props}>
      {children}
    </div>
  );
};

export { Badge };