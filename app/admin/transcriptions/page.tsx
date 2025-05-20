'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

// Định nghĩa kiểu Transcription
type Transcription = {
  _id: string;
  title: string;
  type: 'mp3' | 'mp4' | 'youtube';
  url: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
  isPublic: boolean;
  duration: number;
  ytVideoId?: string;
  deviceId: string;
  data: any[]; // Giả sử data là mảng
};
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TranscriptionsPage() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Transcription | null>(null); // Lưu item đang được chọn để mở modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái mở/đóng modal
  const limit = 8;

  useEffect(() => {
    fetch(`${API_BASE_URL}/transcriptions?deviceId=000&page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        setTranscriptions(data.transcriptions);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  const handleDelete = (id: string) => {
    fetch(`${API_BASE_URL}/transcriptions/${id}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (res.ok) {
          setTranscriptions(transcriptions.filter((t) => t._id !== id));
        } else {
          alert('Không thể xóa transcription');
        }
      })
      .catch((error) => alert('Có lỗi xảy ra'));
  };
  const handleViewDetails = (id: string) => {
    fetch(`${API_BASE_URL}/transcriptions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedItem(data);
        setIsModalOpen(true);
      })
      .catch(() => alert('Không thể tải chi tiết transcription'));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null); // Reset selectedItem khi đóng modal
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Danh sách Transcriptions</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border rounded-md text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Duration</th>
              <th className="p-2 text-left">YT Video ID</th>
              <th className="p-2 text-left">Device ID</th>
              <th className="p-2 text-left">Created At</th>
              <th className="p-2 text-left">Updated At</th>
              <th className="p-2 text-left">Created By</th>
              <th className="p-2 text-left">Public</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 text-left">Actions</th> {/* Cột actions cho nút xóa và xem chi tiết */}
            </tr>
          </thead>
          <tbody>
            {transcriptions.map((t) => (
              <tr key={t._id} className="border-t">
                <td className="p-2">{t.title}</td>
                <td className="p-2">
                  <Badge variant="outline">{t.type}</Badge>
                </td>
                <td className="p-2">{t.duration} seconds</td>
                <td className="p-2">{t.ytVideoId || 'N/A'}</td>
                <td className="p-2">{t.deviceId}</td>
                <td className="p-2">{new Date(t.createdAt).toLocaleString()}</td>
                <td className="p-2">{new Date(t.updatedAt).toLocaleString()}</td>
                <td className="p-2">{t.createdBy}</td>
                <td className="p-2">
                  <Badge className={t.isPublic ? 'bg-blue-500' : 'bg-gray-500'}>
                    {t.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </td>
                <td className="p-2">
                  <Badge className={t.isActive ? 'bg-green-500' : 'bg-red-500'}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleViewDetails(t._id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md mr-2"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-400"
        >
          Previous
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-400"
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && selectedItem && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal} // Đóng modal khi nhấn ngoài
        >
          <div
            className="bg-white p-6 rounded-lg w-1/2"
            onClick={(e) => e.stopPropagation()} // Ngừng sự kiện để không đóng modal khi nhấn vào nội dung modal
          >
            <h2 className="text-xl font-bold mb-4">Detail: {selectedItem.title}</h2>
            <p><strong>Title:</strong> {selectedItem.title}</p>
            <p><strong>Type:</strong> {selectedItem.type}</p>
            <p><strong>URL:</strong> {selectedItem.url}</p>
            <p><strong>Duration:</strong> {selectedItem.duration} seconds</p>
            <p><strong>Device ID:</strong> {selectedItem.deviceId}</p>
            <p><strong>Created At:</strong> {new Date(selectedItem.createdAt).toLocaleString()}</p>
            <p><strong>Updated At:</strong> {new Date(selectedItem.updatedAt).toLocaleString()}</p>
            <p><strong>Created By:</strong> {selectedItem.createdBy}</p>
            <p><strong>Public:</strong> {selectedItem.isPublic ? 'Yes' : 'No'}</p>
            <p><strong>Active:</strong> {selectedItem.isActive ? 'Yes' : 'No'}</p>
            <p><strong>Data Elements:</strong> {selectedItem.data.length} items</p> {/* Hiển thị số phần tử của data */}
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-500 text-white rounded-md mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
