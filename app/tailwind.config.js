module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          'topik-blue': '#005BAC',
          'topik-light-blue': '#E6F0FA',
          'topik-gray': '#F5F6F5',
          'topik-dark-gray': '#4B5EAA',
        },
        fontFamily: {
          sans: ['Noto Sans KR', 'sans-serif'],
        },
      },
    },
    plugins: [],
  };