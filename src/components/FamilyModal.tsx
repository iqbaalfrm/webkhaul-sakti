import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { useAPIMutation } from '../hooks/useAPI';

interface AhliKubur {
  _id?: string;
  namaAhliKubur: string;
  binBinti: string;
  namaOrangTua: string;
}

interface FamilyData {
  _id: string;
  rt: string;
  namaKeluarga: string;
  ahliKubur: AhliKubur[];
}

interface FamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyData: FamilyData;
  onUpdateFamily: (familyId: string, data: any) => void;
  onDeleteFamily: (familyId: string) => void;
}

const FamilyModal: React.FC<FamilyModalProps> = ({
  isOpen,
  onClose,
  familyData,
  onUpdateFamily,
  onDeleteFamily
}) => {
  const [localFamilyData, setLocalFamilyData] = useState<FamilyData>(familyData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    namaAhliKubur: '',
    binBinti: '',
    namaOrangTua: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  const { mutate: updateFamily, loading: updating } = useAPIMutation();
  const { mutate: deleteFamily, loading: deleting } = useAPIMutation();

  const rtOptions = Array.from({ length: 6 }, (_, i) => `RT ${(i + 1).toString().padStart(2, '0')}`);
  const binBintiOptions = ['Bin', 'Binti'];

  useEffect(() => {
    setLocalFamilyData(familyData);
  }, [familyData]);

  const resetForm = () => {
    setFormData({ namaAhliKubur: '', binBinti: '', namaOrangTua: '' });
    setEditingIndex(null);
    setErrors({});
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.namaAhliKubur.trim()) newErrors.namaAhliKubur = 'Nama ahli kubur harus diisi';
    if (!formData.binBinti) newErrors.binBinti = 'Bin/Binti harus dipilih';
    if (!formData.namaOrangTua.trim()) newErrors.namaOrangTua = 'Nama orang tua harus diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitAhliKubur = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const newAhliKubur: AhliKubur = {
      namaAhliKubur: formData.namaAhliKubur.trim(),
      binBinti: formData.binBinti,
      namaOrangTua: formData.namaOrangTua.trim()
    };

    let updatedAhliKubur;
    if (editingIndex !== null) {
      updatedAhliKubur = localFamilyData.ahliKubur.map((item, index) => 
        index === editingIndex ? { ...item, ...newAhliKubur } : item
      );
    } else {
      updatedAhliKubur = [...localFamilyData.ahliKubur, newAhliKubur];
    }

    setLocalFamilyData(prev => ({ ...prev, ahliKubur: updatedAhliKubur }));
    resetForm();
  };

  const handleEditAhliKubur = (index: number) => {
    const ahliKubur = localFamilyData.ahliKubur[index];
    setEditingIndex(index);
    setFormData({
      namaAhliKubur: ahliKubur.namaAhliKubur,
      binBinti: ahliKubur.binBinti,
      namaOrangTua: ahliKubur.namaOrangTua
    });
  };

  const handleDeleteAhliKubur = (index: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ahli kubur ini?')) return;

    const updatedAhliKubur = localFamilyData.ahliKubur.filter((_, i) => i !== index);
    setLocalFamilyData(prev => ({ ...prev, ahliKubur: updatedAhliKubur }));
  };

  const handleSaveFamily = async () => {
    if (!localFamilyData.rt || !localFamilyData.namaKeluarga.trim()) {
      alert('RT dan Nama Keluarga harus diisi');
      return;
    }

    if (localFamilyData.ahliKubur.length === 0) {
      alert('Minimal satu data ahli kubur harus diisi');
      return;
    }

    const updateData = {
      rt: localFamilyData.rt,
      namaKeluarga: localFamilyData.namaKeluarga.trim(),
      ahliKubur: localFamilyData.ahliKubur.map(({ _id, ...rest }) => rest) // Remove _id for update
    };

    try {
      await onUpdateFamily(localFamilyData._id, updateData);
      showSuccess('Data keluarga berhasil diperbarui');
    } catch (error) {
      console.error('Error updating family:', error);
    }
  };

  const handleDeleteFamily = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus seluruh data keluarga ini?')) return;

    try {
      await onDeleteFamily(localFamilyData._id);
      onClose();
    } catch (error) {
      console.error('Error deleting family:', error);
    }
  };

  const isLoading = updating || deleting;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Kelola Data Keluarga</h2>
              <p className="text-gray-600">{localFamilyData.namaKeluarga || 'Data keluarga'}</p>
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

          {/* Family Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Keluarga</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RT <span className="text-red-500">*</span>
                </label>
                <select
                  value={localFamilyData.rt}
                  onChange={(e) => setLocalFamilyData(prev => ({ ...prev, rt: e.target.value }))}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Pilih RT</option>
                  {rtOptions.map(rt => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Keluarga <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={localFamilyData.namaKeluarga}
                  onChange={(e) => setLocalFamilyData(prev => ({ ...prev, namaKeluarga: e.target.value }))}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Masukkan nama keluarga"
                />
              </div>
            </div>
          </div>

          {/* Add/Edit Ahli Kubur Form */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingIndex !== null ? 'Edit Ahli Kubur' : 'Tambah Ahli Kubur'}
            </h3>
            
            <form onSubmit={handleSubmitAhliKubur} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Ahli Kubur <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.namaAhliKubur}
                  onChange={(e) => setFormData(prev => ({ ...prev, namaAhliKubur: e.target.value }))}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.namaAhliKubur ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nama ahli kubur"
                />
                {errors.namaAhliKubur && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle size={14} className="text-red-500" />
                    <p className="text-red-500 text-sm">{errors.namaAhliKubur}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bin/Binti <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.binBinti}
                  onChange={(e) => setFormData(prev => ({ ...prev, binBinti: e.target.value }))}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.binBinti ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih</option>
                  {binBintiOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.binBinti && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle size={14} className="text-red-500" />
                    <p className="text-red-500 text-sm">{errors.binBinti}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Orang Tua <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.namaOrangTua}
                  onChange={(e) => setFormData(prev => ({ ...prev, namaOrangTua: e.target.value }))}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.namaOrangTua ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nama orang tua"
                />
                {errors.namaOrangTua && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle size={14} className="text-red-500" />
                    <p className="text-red-500 text-sm">{errors.namaOrangTua}</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-3 flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{editingIndex !== null ? 'Update' : 'Tambah'}</span>
                </button>
                
                {editingIndex !== null && (
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

          {/* Ahli Kubur List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daftar Ahli Kubur</h3>
            
            {localFamilyData.ahliKubur.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Users size={48} className="mx-auto mb-2 opacity-50" />
                <p>Belum ada data ahli kubur</p>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama Ahli Kubur</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bin/Binti</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama Orang Tua</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {localFamilyData.ahliKubur.map((ahli, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{ahli.namaAhliKubur}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ahli.binBinti === 'Bin' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {ahli.binBinti}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{ahli.namaOrangTua}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditAhliKubur(index)}
                              disabled={isLoading}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAhliKubur(index)}
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

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handleDeleteFamily}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Trash2 size={18} />
              )}
              <span>Hapus Keluarga</span>
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleSaveFamily}
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save size={18} />
                )}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyModal;