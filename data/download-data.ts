// Dữ liệu cho trang Tải Đề
export interface ExamFile {
  id: string;
  name: string;
  type: 'TOPIK I' | 'TOPIK II';
  size: string;
  driveLink: string;
  description?: string;
}

export interface ExamSession {
  id: string;
  name: string;
  date: string;
  description: string;
  exams: ExamFile[];
}

// Dữ liệu TOPIK I
export const topikISessions: ExamSession[] = [
  {
    id: 'topik-91-i',
    name: 'Đề thi TOPIK I - Kỳ 91',
    date: 'Tháng 4/2024',
    description: 'Kỳ thi TOPIK I lần thứ 91 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-91-i-1',
        name: 'Đề nghe-đọc 듣기, 읽기 91',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1VEnjw1rp4N5ra6dIoPiEnv_8cSmmks6H/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 91'
      },
      {
        id: 'topik-91-i-2',
        name: 'Kịch bản nghe 듣기통합 91',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1dV2-zDXAGE-oEyrm9Ba8UWYzbFHiVsdB/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 91'
      },
      {
        id: 'topik-91-i-3',
        name: 'Đáp án 정답 91',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1bJ4i_7nl89OAOGv6jE4oWlisKB_ZjC-G/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 91'
      }
    ]
  },
  {
    id: 'topik-83-i',
    name: 'Đề thi TOPIK I - Kỳ 83',
    date: 'Tháng 4/2022',
    description: 'Kỳ thi TOPIK I lần thứ 83 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-83-i-1',
        name: 'Đề nghe-đọc 듣기, 읽기 83',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1W4uh5vV3y7mQk2MbAE4SVye0kXy5bVEv/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 83'
      },
      {
        id: 'topik-83-i-2',
        name: 'Kịch bản nghe 듣기통합 83',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1P-3GpVSqTyR7tn24cg0i6QjMCfQi86A_/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 83'
      },
      {
        id: 'topik-83-i-3',
        name: 'Đáp án 정답 83',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1bARNT06VLJBFCJSefsET56kl3Kx89iu7/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 83'
      }
    ]
  },
  {
    id: 'topik-64-i',
    name: 'Đề thi TOPIK I - Kỳ 64',
    date: 'Tháng 7/2019',
    description: 'Kỳ thi TOPIK I lần thứ 64 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-64-i-1',
        name: 'Đề nghe-đọc 듣기, 읽기 64',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1EXf9C2qxwLcafZGOVZGY1hp4aATlKQU-/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 64'
      },
      {
        id: 'topik-64-i-2',
        name: 'Kịch bản nghe 듣기통합 64',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1mzbW9PTvNwCnD-loAkY-hQsS4k49Sa3n/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 64'
      },
      {
        id: 'topik-64-i-3',
        name: 'Đáp án 정답 64',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1Cp2rENbQ5W8en1UnJejGaZS0tClqdxGn/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 64'
      }
    ]
  },
  {
    id: 'topik-60-i',
    name: 'Đề thi TOPIK I - Kỳ 60',
    date: 'Tháng 10/2018',
    description: 'Kỳ thi TOPIK I lần thứ 60 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-60-i-1',
        name: 'Đề nghe-đọc 듣기, 읽기 60',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1nUcXvSn40Ytz-C_YlfxiJDD9-KoxtrjE/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 60'
      },
      {
        id: 'topik-60-i-2',
        name: 'Kịch bản nghe 듣기통합 60',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1jMPNbUcT0rfh7JEhfQiqZmX4PhLQzddZ/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 60'
      },
      {
        id: 'topik-60-i-3',
        name: 'Đáp án 정답 60',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1L2YVOf73koLrYKUOZlP5Ejb3DjiWeVu4/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 60'
      }
    ]
  },
  {
    id: 'topik-52-i',
    name: 'Đề thi TOPIK I - Kỳ 52',
    date: 'Tháng 10/2017',
    description: 'Kỳ thi TOPIK I lần thứ 52 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-52-i-1',
        name: 'Đề nghe-đọc 듣기, 읽기 52',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1vqHjpGtkPfazDlmhyw5ABkG8gsaiwzzC/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 52'
      },
      {
        id: 'topik-52-i-2',
        name: 'Kịch bản nghe 듣기통합 52',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/149CKRXOA9m3JLsRFY1yYhQseTQ-bYHE7/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 52'
      },
      {
        id: 'topik-52-i-3',
        name: 'Đáp án 정답 52',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1LucKahRvYJtrlvTiWQgOqJHhncdniSlq/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 52'
      }
    ]
  },
  {
    id: 'topik-47-i',
    name: 'Đề thi TOPIK I - Kỳ 47',
    date: 'Tháng 4/2016',
    description: 'Kỳ thi TOPIK I lần thứ 47 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-47-i-1',
        name: 'Đề nghe-đọc 듣기, 읽기 47',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1XOFJLeYEdPOoDIvC17XedHM1R47e4zRo/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 47'
      },
      {
        id: 'topik-47-i-2',
        name: 'Kịch bản nghe 듣기통합 47',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1SekaW9qiAXFOWeEFymGR1iMc4-smhSuk/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 47'
      },
      {
        id: 'topik-47-i-3',
        name: 'Đáp án 정답 47',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/18Fwn99avRHP-dPx8GFw_hyxahBvMHAgH/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 47'
      }
    ]
  },
  {
    id: 'topik-41-i',
    name: 'Đề thi TOPIK I - Kỳ 41',
    date: 'Tháng 7/2015',
    description: 'Kỳ thi TOPIK I lần thứ 41 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-41-i-1',
        name: 'Đề nghe-đọc 듣기, 읽기 41',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/14up0YQl-4NWzCXvYAp50-kXC_PxBeh5j/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 41'
      },
      {
        id: 'topik-41-i-2',
        name: 'Kịch bản nghe 듣기통합 41',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1452XZR5t-aTohE0y872YR9PIdr-zumzo/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 41'
      },
      {
        id: 'topik-41-i-3',
        name: 'Đáp án 정답 41',
        type: 'TOPIK I',
        size: '',
        driveLink: 'https://drive.google.com/file/d/17y4z7CE-PDSkRAKyNpzoZS0Dw6zkP81m/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK I chính thức kỳ 41'
      }
    ]
  }
//   ,
//   {
//     id: 'topik-37-i',
//     name: 'Đề thi TOPIK I - Kỳ 37',
//     date: 'Tháng 4/2014',
//     description: 'Kỳ thi TOPIK I lần thứ 37 - Đề thi chính thức',
//     exams: [
//       {
//         id: 'topik-37-i-1',
//         name: 'Đề nghe-đọc 듣기, 읽기 37',
//         type: 'TOPIK I',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK I chính thức kỳ 37'
//       },
//       {
//         id: 'topik-37-i-2',
//         name: 'Kịch bản nghe 듣기통합 37',
//         type: 'TOPIK I',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK I chính thức kỳ 37'
//       },
//       {
//         id: 'topik-37-i-3',
//         name: 'Đáp án 정답 37',
//         type: 'TOPIK I',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK I chính thức kỳ 37'
//       }
//     ]
//   },
//   {
//     id: 'topik-36-i',
//     name: 'Đề thi TOPIK I - Kỳ 36',
//     date: 'Tháng 10/2013',
//     description: 'Kỳ thi TOPIK I lần thứ 36 - Đề thi chính thức',
//     exams: [
//       {
//         id: 'topik-36-i-1',
//         name: 'Đề nghe-đọc 듣기, 읽기 36',
//         type: 'TOPIK I',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK I chính thức kỳ 36'
//       },
//       {
//         id: 'topik-36-i-2',
//         name: 'Kịch bản nghe 듣기통합 36',
//         type: 'TOPIK I',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK I chính thức kỳ 36'
//       },
//       {
//         id: 'topik-36-i-3',
//         name: 'Đáp án 정답 36',
//         type: 'TOPIK I',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK I chính thức kỳ 36'
//       }
//     ]
//   },
//   {
//     id: 'topik-35-i',
//     name: 'Đề thi TOPIK I - Kỳ 35',
//     date: 'Tháng 4/2013',
//     description: 'Kỳ thi TOPIK I lần thứ 35 - Đề thi chính thức',
//     exams: [
//       {
//         id: 'topik-35-i-1',
//         name: 'Đề nghe-đọc 듣기, 읽기 35',
//         type: 'TOPIK I',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK I chính thức kỳ 35'
//       },
//       {
//         id: 'topik-35-i-2',
//         name: 'Kịch bản nghe 듣기통합 35',
//         type: 'TOPIK I',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK I chính thức kỳ 35'
//       },
//       {
//         id: 'topik-35-i-3',
//         name: 'Đáp án 정답 35',
//         type: 'TOPIK I',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK I chính thức kỳ 35'
//       }
//     ]
//   }
];

// Dữ liệu TOPIK II
export const topikIISessions: ExamSession[] = [
  {
    id: 'topik-91-ii',
    name: 'Đề thi TOPIK II - Kỳ 91',
    date: 'Tháng 4/2024',
    description: 'Kỳ thi TOPIK II lần thứ 91 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-91-ii-1',
        name: 'Đề đọc 읽기 91',
        type: 'TOPIK II',
        size: '18.7 MB',
        driveLink: 'https://drive.google.com/file/d/1GXZ6QKg760_eR3wYiTRdiAC5ViDOnQFu/view?usp=drive_link',
        description: 'Đề thi TOPIK II chính thức kỳ 91'
      },
      {
        id: 'topik-91-ii-2',
        name: 'Đề nghe-viết 듣기 - 쓰기 91',
        type: 'TOPIK II',
        size: '18.7 MB',
        driveLink: 'https://drive.google.com/file/d/1BVB-oWWKAsBYdMWsEQP7zXiqk6avApjP/view?usp=drive_link',
        description: 'Đề thi TOPIK II chính thức kỳ 91'
      },
      {
        id: 'topik-91-ii-3',
        name: 'Kịch bản nghe- 91',
        type: 'TOPIK II',
        size: '18.7 MB',
        driveLink: 'https://drive.google.com/file/d/1Vgks43_bdUjLj_Pr85-SiXY9tg67Y8-0/view?usp=drive_link',
        description: 'Đề thi TOPIK II chính thức kỳ 91'
      },
      {
        id: 'topik-91-ii-4',
        name: 'Đáp án 정답 91',
        type: 'TOPIK II',
        size: '18.7 MB',
        driveLink: 'https://drive.google.com/file/d/1oaBtJPasqx6nJP9m_SX1JznlWN8LSs82/view?usp=drive_link',
        description: 'Đề thi TOPIK II chính thức kỳ 91'
      }
    ]
  },
  {
    id: 'topik-83-ii',
    name: 'Đề thi TOPIK II - Kỳ 83',
    date: 'Tháng 4/2022',
    description: 'Kỳ thi TOPIK II lần thứ 83 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-83-ii-1',
        name: 'Đề đọc 읽기 83',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1cwmT72UeBgy-LhhLA9Bm4zPN7THJ3JiB/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 83'
      },
      {
        id: 'topik-83-ii-2',
        name: 'Đề nghe-viết 듣기 - 쓰기 83',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1EPSxVhDhb4de3f1AZcf3YttYgUl__qvN/view?usp=sharing', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 83'
      },
      {
        id: 'topik-83-ii-3',
        name: 'Kịch bản nghe- 83',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1qe3bCncqaAfk1jjXcGJPtQ-68S5Oe7RJ/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 83'
      },
      {
        id: 'topik-83-ii-4',
        name: 'Đáp án 정답 83',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1AOY0_wZNGc9jaS27YHZKiwI7sVnLJhpG/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 83'
      }
    ]
  },
  {
    id: 'topik-64-ii',
    name: 'Đề thi TOPIK II - Kỳ 64',
    date: 'Tháng 7/2019',
    description: 'Kỳ thi TOPIK II lần thứ 64 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-64-ii-1',
        name: 'Đề đọc 읽기 64',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1HvQWbhYKB9jzN4gMdoKmh-Kmw_N-IKcr/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 64'
      },
      {
        id: 'topik-64-ii-2',
        name: 'Đề nghe-viết 듣기 - 쓰기 64',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1VnkZzYAEDoGYnKVR2jAPsZzrJuZiFQjb/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 64'
      },
      {
        id: 'topik-64-ii-3',
        name: 'Kịch bản nghe- 64',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1M-FbRsKROHb3DxMRfdH8OFcm79ufbpvA/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 64'
      },
      {
        id: 'topik-64-ii-4',
        name: 'Đáp án 정답 64',
        type: 'TOPIK II',
        size: 'https://drive.google.com/file/d/1xGM-vTq4E_zNqktb8FsCO5xudoQFgFPW/view?usp=drive_link',
        driveLink: '', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 64'
      }
    ]
  },
  {
    id: 'topik-60-ii',
    name: 'Đề thi TOPIK II - Kỳ 60',
    date: 'Tháng 10/2018',
    description: 'Kỳ thi TOPIK II lần thứ 60 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-60-ii-1',
        name: 'Đề đọc 읽기 60',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1fghTctA6-M8rrQDsl6sWy9O5BzUpo9y6/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 60'
      },
      {
        id: 'topik-60-ii-2',
        name: 'Đề nghe-viết 듣기 - 쓰기 60',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1_0BJygJw49CQVfhy1Fq6FPPA1CgP_POE/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 60'
      },
      {
        id: 'topik-60-ii-3',
        name: 'Kịch bản nghe- 60',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1xQ7ff9CESmiYvUM0ZHv7_N5YiyqCA8hi/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 60'
      },
      {
        id: 'topik-60-ii-4',
        name: 'Đáp án 정답 60',
        type: 'TOPIK II',
        size: 'https://drive.google.com/file/d/1U5AKx0ib2CJ66QiQzWExnvOJzsMid685/view?usp=drive_link',
        driveLink: '', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 60'
      }
    ]
  },
  {
    id: 'topik-52-ii',
    name: 'Đề thi TOPIK II - Kỳ 52',
    date: 'Tháng 10/2017',
    description: 'Kỳ thi TOPIK II lần thứ 52 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-52-ii-1',
        name: 'Đề đọc 읽기 52',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1TGRO-vkwM-nB2l2XGNTd0aWeN5ZBcrLZ/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 52'
      },
      {
        id: 'topik-52-ii-2',
        name: 'Đề nghe-viết 듣기 - 쓰기 52',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1Q8spnp5-NZV1fBwVe-3rqJgtdTO-67gP/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 52'
      },
      {
        id: 'topik-52-ii-3',
        name: 'Kịch bản nghe- 52',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/17VnnypBdpDo30Xvemgv11_8uYZD34taq/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 52'
      },
      {
        id: 'topik-52-ii-4',
        name: 'Đáp án 정답 52',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1QTLFqibnyZQ07m3A_WF4p9ZMOXcKZCvg/view?usp=sharing', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 52'
      }
    ]
  },
  {
    id: 'topik-47-ii',
    name: 'Đề thi TOPIK II - Kỳ 47',
    date: 'Tháng 4/2016',
    description: 'Kỳ thi TOPIK II lần thứ 47 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-47-ii-1',
        name: 'Đề đọc 읽기 47',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1t2sMv6Np4izRdMHJlnwGKhP5dRlbuxlt/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 47'
      },
      {
        id: 'topik-47-ii-2',
        name: 'Đề nghe-viết 듣기 - 쓰기 47',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1twMGXcFkdX8ooXoaRLKtoB5ymfI0-7vQ/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 47'
      },
      {
        id: 'topik-47-ii-3',
        name: 'Kịch bản nghe- 47',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1hpv0RPC_aQUzKVZxeZXU9ssVHncUFvAH/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 47'
      },
      {
        id: 'topik-47-ii-4',
        name: 'Đáp án 정답 47',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1Y6cal7GgUg3ey4KavU8Wsi1ZRYwCbsLY/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 47'
      }
    ]
  },
  {
    id: 'topik-41-ii',
    name: 'Đề thi TOPIK II - Kỳ 41',
    date: 'Tháng 7/2015',
    description: 'Kỳ thi TOPIK II lần thứ 41 - Đề thi chính thức',
    exams: [
      {
        id: 'topik-41-ii-1',
        name: 'Đề đọc 읽기 41',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1hvRraYv0ZSPKKhNdkPeXGBtSbKqDIaqa/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 41'
      },
      {
        id: 'topik-41-ii-2',
        name: 'Đề nghe-viết 듣기 - 쓰기 41',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1hMwq9sf53R1YDN4Kk7qFbpNOov__v51v/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 41'
      },
      {
        id: 'topik-41-ii-3',
        name: 'Kịch bản nghe- 41',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/1vW4oeLgcQYIgMbrkOz5pUsxUBtt-9lYS/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 41'
      },
      {
        id: 'topik-41-ii-4',
        name: 'Đáp án 정답 41',
        type: 'TOPIK II',
        size: '',
        driveLink: 'https://drive.google.com/file/d/18b2aV0fH9f97wxYzWV-nKd7KqS453mea/view?usp=drive_link', // TODO: cập nhật link
        description: 'Đề thi TOPIK II chính thức kỳ 41'
      }
    ]
  }
//   ,
//   {
//     id: 'topik-37-ii',
//     name: 'Đề thi TOPIK II - Kỳ 37',
//     date: 'Tháng 4/2014',
//     description: 'Kỳ thi TOPIK II lần thứ 37 - Đề thi chính thức',
//     exams: [
//       {
//         id: 'topik-37-ii-1',
//         name: 'Đề đọc 읽기 37',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 37'
//       },
//       {
//         id: 'topik-37-ii-2',
//         name: 'Đề nghe-viết 듣기 - 쓰기 37',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 37'
//       },
//       {
//         id: 'topik-37-ii-3',
//         name: 'Kịch bản nghe- 37',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 37'
//       },
//       {
//         id: 'topik-37-ii-4',
//         name: 'Đáp án 정답 37',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 37'
//       }
//     ]
//   },
//   {
//     id: 'topik-36-ii',
//     name: 'Đề thi TOPIK II - Kỳ 36',
//     date: 'Tháng 10/2013',
//     description: 'Kỳ thi TOPIK II lần thứ 36 - Đề thi chính thức',
//     exams: [
//       {
//         id: 'topik-36-ii-1',
//         name: 'Đề đọc 읽기 36',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 36'
//       },
//       {
//         id: 'topik-36-ii-2',
//         name: 'Đề nghe-viết 듣기 - 쓰기 36',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 36'
//       },
//       {
//         id: 'topik-36-ii-3',
//         name: 'Kịch bản nghe- 36',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 36'
//       },
//       {
//         id: 'topik-36-ii-4',
//         name: 'Đáp án 정답 36',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 36'
//       }
//     ]
//   },
//   {
//     id: 'topik-35-ii',
//     name: 'Đề thi TOPIK II - Kỳ 35',
//     date: 'Tháng 4/2013',
//     description: 'Kỳ thi TOPIK II lần thứ 35 - Đề thi chính thức',
//     exams: [
//       {
//         id: 'topik-35-ii-1',
//         name: 'Đề đọc 읽기 35',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 35'
//       },
//       {
//         id: 'topik-35-ii-2',
//         name: 'Đề nghe-viết 듣기 - 쓰기 35',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 35'
//       },
//       {
//         id: 'topik-35-ii-3',
//         name: 'Kịch bản nghe- 35',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 35'
//       },
//       {
//         id: 'topik-35-ii-4',
//         name: 'Đáp án 정답 35',
//         type: 'TOPIK II',
//         size: '',
//         driveLink: '', // TODO: cập nhật link
//         description: 'Đề thi TOPIK II chính thức kỳ 35'
//       }
//     ]
//   },
//   {
//     id: 'topik-89-ii',
//     name: 'Đề thi TOPIK II - Kỳ 89',
//     date: 'Tháng 10/2023',
//     description: 'Kỳ thi TOPIK II lần thứ 89 - Đề thi chính thức',
//     exams: [
//       {
//         id: 'topik-89-ii-1',
//         name: 'Đề thi TOPIK II - Kỳ 89',
//         type: 'TOPIK II',
//         size: '19.2 MB',
//         driveLink: 'https://drive.google.com/file/d/1GXZ6QKg760_eR3wYiTRdiAC5ViDOnQFu/view?usp=drive_link',
//         description: 'Đề thi TOPIK II chính thức kỳ 89'
//       }
//     ]
//   },
//   {
//     id: 'topik-88-ii',
//     name: 'Đề thi TOPIK II - Kỳ 88',
//     date: 'Tháng 7/2023',
//     description: 'Kỳ thi TOPIK II lần thứ 88 - Đề thi chính thức',
//     exams: [
//       {
//         id: 'topik-88-ii-1',
//         name: 'Đề thi TOPIK II - Kỳ 88',
//         type: 'TOPIK II',
//         size: '18.9 MB',
//         driveLink: 'https://drive.google.com/file/d/1GXZ6QKg760_eR3wYiTRdiAC5ViDOnQFu/view?usp=drive_link',
//         description: 'Đề thi TOPIK II chính thức kỳ 88'
//       }
//     ]
//   }
];

// Hàm helper để lấy session theo ID (từ cả 2 mảng)
export const getExamSessionById = (id: string): ExamSession | undefined => {
  const topikISession = topikISessions.find(session => session.id === id);
  if (topikISession) return topikISession;
  
  const topikIISession = topikIISessions.find(session => session.id === id);
  return topikIISession;
};

// Hàm helper để lấy exam theo ID
export const getExamById = (examId: string): ExamFile | undefined => {
  for (const session of [...topikISessions, ...topikIISessions]) {
    const exam = session.exams.find(exam => exam.id === examId);
    if (exam) return exam;
  }
  return undefined;
};

// Hàm helper để lấy tất cả exams
export const getAllExams = (): ExamFile[] => {
  return [...topikISessions, ...topikIISessions].flatMap(session => session.exams);
};

// Hàm helper để lấy tất cả sessions
export const getAllSessions = (): ExamSession[] => {
  return [...topikISessions, ...topikIISessions];
};

// Hàm helper để tạo download link từ drive link
export const createDownloadLink = (driveLink: string): string => {
  // Extract file ID from drive link
  const match = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return driveLink; // Fallback to original link
}; 