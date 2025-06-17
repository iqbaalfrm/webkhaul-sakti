import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { iuranAPI } from '../services/api';
import { useAPIMutation } from '../hooks/useAPI';

interface IuranRecord {
  _id?: string;
  rt: string;
  nominal: number;
  tanggal: string;
  keterangan?: string;
}

interface FinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  iuranRecords: IuranRecord[];
  onUpdateRecords: () => void;
}

const FinancialModal: React.FC<FinancialModalProps> = ({
  isOpen,
  onClose,
  iuranRecords,
  onUpdateRecords
}) => {
  const [editingRecord, setEditingRecord] = useState<IuranRecord | null>(null);
  const [formData, setFormData] = useState({
    rt: '',
    nominal: '',
    tanggal: '',
    keterangan: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  const { mutate: createIuran, loading: creating } = useAPIMutation();
  const { mutate: updateIuran, loading: updating } = useAPIMutation();
  const { mutate: deleteIuran, loading: deleting } = useAPIMutation();

  const rtOptions = Array.from({ length: 6 }, (_, i) => `RT ${(i + 1).toString().padStart(2, '0')}`);

  const resetForm = () => {
    setFormData({ rt: '', nominal: '', tanggal: '', keterangan: '' });
    setEditingRecord(null);
    setErrors({});
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.rt) newErrors.rt = 'RT harus dipilih';
    if (!formData.nominal) newErrors.nominal = 'Nominal harus diisi';
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal harus diisi';

    const nominal = parseInt(formData.nominal);
    if (formData.nominal && (isNaN(nominal) || nominal <= 0)) {
      newErrors.nominal = 'Nominal harus berupa angka positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submissionData = {
      rt: formData.rt,
      nominal: parseInt(formData.nominal),
      tanggal: formData.tanggal,
      keterangan: formData.keterangan.trim()
    };

    try {
      if (editingRecord) {
        await updateIuran(
          () => iuranAPI.update(editingRecord._id!, submissionData),
          {
            onSuccess: () => {
              showSuccess('Data iuran berhasil diperbarui');
              onUpdateRecords();
              resetForm();
            }
          }
        );
      } else {
        await createIuran(
          () => iuranAPI.create(submissionData),
          {
            onSuccess: () => {
              showSuccess('Data iuran berhasil ditambahkan');
              onUpdateRecords();
              resetForm();
            }
          }
        );
      }
    } catch (error) {
      console.error('Error saving iuran:', error);
    }
  };

  const handleEdit = (record: IuranRecord) => {
    setEditingRecord(record);
    setFormData({
      rt: record.rt,
      nominal: record.nominal.toString(),
      tanggal: record.tanggal.split('T')[0], // Format for date input
      keterangan: record.keterangan || ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      await deleteIuran(
        () => iuranAPI.delete(id),
        {
          onSuccess: () => {
            showSuccess('Data iuran berhasil dihapus');
            onUpdateRecords();
          }
        }
      );
    } catch (error) {
      console.error('Error deleting iuran:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const totalIuran = iuranRecords.reduce((sum, record) => sum + record.nominal, 0);
  const isLoading = creating || updating || deleting;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-yellow-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Kelola Data Iuran</h2>
              <p className="text-gray-600">Tambah, edit, atau hapus data iuran per RT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium opacity-90">Total Iuran Terkumpul</h3>
                <p className="text-2xl font-bold">{formatCurrency(totalIuran)}</p>
              </div>
              <div className="text-yellow-100">
                <DollarSign size={32} />
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingRecord ? 'Edit Data Iuran' : 'Tambah Data Iuran'}
            </h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RT <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.rt}
                  onChange={(e) => setFormData(prev => ({ ...prev, rt: e.target.value }))}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.rt ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih RT</option>
                  {rtOptions.map(rt => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
                {errors.rt && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle size={14} className="text-red-500" />
                    <p className="text-red-500 text-sm">{errors.rt}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nominal Iuran (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.nominal}
                  onChange={(e) => setFormData(prev => ({ ...prev, nominal: e.target.value }))}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.nominal ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="500000"
                />
                {errors.nominal && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle size={14} className="text-red-500" />
                    <p className="text-red-500 text-sm">{errors.nominal}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Pembayaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.tanggal ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.tanggal && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle size={14} className="text-red-500" />
                    <p className="text-red-500 text-sm">{errors.tanggal}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={formData.keterangan}
                  onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Keterangan tambahan"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4 flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{editingRecord ? 'Update' : 'Simpan'}</span>
                </button>
                
                {editingRecord && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Data Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Iuran yang Tercatat</h3>
            
            {iuranRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign size={48} className="mx-auto mb-2 opacity-50" />
                <p>Belum ada data iuran yang tercatat</p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">RT</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nominal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Keterangan</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {iuranRecords.map((record, index) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {record.rt}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatCurrency(record.nominal)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(record.tanggal)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {record.keterangan || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(record)}
                              disabled={isLoading}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(record._id!)}
                              disabled={isLoading}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialModal;