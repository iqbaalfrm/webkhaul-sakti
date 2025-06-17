import React, { useState } from 'react';
import { Plus, Minus, Save, Users, AlertCircle } from 'lucide-react';
import { familyAPI } from '../services/api';
import { useAPIMutation } from '../hooks/useAPI';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface AhliKubur {
  id: string;
  namaAhliKubur: string;
  binBinti: string;
  namaOrangTua: string;
}

interface FormData {
  rt: string;
  namaKeluarga: string;
  ahliKubur: AhliKubur[];
}

const FormInput: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    rt: '',
    namaKeluarga: '',
    ahliKubur: Array.from({ length: 15 }, (_, index) => ({
      id: `${index + 1}`,
      namaAhliKubur: '',
      binBinti: '',
      namaOrangTua: ''
    }))
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { mutate: createFamily, loading: saving } = useAPIMutation();

  const rtOptions = Array.from({ length: 6 }, (_, i) => `RT ${(i + 1).toString().padStart(2, '0')}`);
  const binBintiOptions = ['Bin', 'Binti'];

  const addRow = () => {
    const newRow: AhliKubur = {
      id: `${formData.ahliKubur.length + 1}`,
      namaAhliKubur: '',
      binBinti: '',
      namaOrangTua: ''
    };
    setFormData(prev => ({
      ...prev,
      ahliKubur: [...prev.ahliKubur, newRow]
    }));
  };

  const removeRow = (id: string) => {
    if (formData.ahliKubur.length > 1) {
      setFormData(prev => ({
        ...prev,
        ahliKubur: prev.ahliKubur.filter(item => item.id !== id)
      }));
    }
  };

  const updateAhliKubur = (id: string, field: keyof AhliKubur, value: string) => {
    setFormData(prev => ({
      ...prev,
      ahliKubur: prev.ahliKubur.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.rt) newErrors.rt = 'RT harus dipilih';
    if (!formData.namaKeluarga.trim()) newErrors.namaKeluarga = 'Nama keluarga harus diisi';

    const hasValidEntry = formData.ahliKubur.some(item =>
      item.namaAhliKubur.trim() || item.binBinti || item.namaOrangTua.trim()
    );

    if (!hasValidEntry) newErrors.ahliKubur = 'Minimal satu data ahli kubur harus diisi';

    formData.ahliKubur.forEach((item, index) => {
      const filled = item.namaAhliKubur.trim() || item.binBinti || item.namaOrangTua.trim();
      if (filled) {
        if (!item.namaAhliKubur.trim())
          newErrors[`ahliKubur_${index}_nama`] = 'Nama ahli kubur harus diisi';
        if (!item.binBinti)
          newErrors[`ahliKubur_${index}_binBinti`] = 'Bin/Binti harus dipilih';
        if (!item.namaOrangTua.trim())
          newErrors[`ahliKubur_${index}_orangTua`] = 'Nama orang tua harus diisi';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      rt: '',
      namaKeluarga: '',
      ahliKubur: Array.from({ length: 15 }, (_, index) => ({
        id: `${index + 1}`,
        namaAhliKubur: '',
        binBinti: '',
        namaOrangTua: ''
      }))
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const validEntries = formData.ahliKubur.filter(item =>
      item.namaAhliKubur.trim() && item.binBinti && item.namaOrangTua.trim()
    );

    const submissionData = {
      rt: formData.rt,
      namaKeluarga: formData.namaKeluarga.trim(),
      ahliKubur: validEntries.map(({ id, ...rest }) => rest)
    };

    try {
      await createFamily(
        () => familyAPI.create(submissionData),
        {
          onSuccess: () => {
            MySwal.fire({
              icon: 'success',
              title: 'Berhasil!',
              text: `Data keluarga ${formData.namaKeluarga} berhasil disimpan dengan ${validEntries.length} ahli kubur.`,
              confirmButtonColor: '#2563eb'
            }).then(() => {
              resetForm();
            });
          },
          onError: () => {
            MySwal.fire({
              icon: 'error',
              title: 'Gagal menyimpan!',
              text: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.',
              confirmButtonColor: '#dc2626'
            });
          }
        }
      );
    } catch (error) {}
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Input Data Ahli Kubur</h1>
            <p className="text-gray-600">Masukkan data ahli kubur untuk acara Khaul Massal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                RT <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.rt}
                onChange={(e) => setFormData(prev => ({ ...prev, rt: e.target.value }))}
                disabled={saving}
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.rt ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih RT</option>
                {rtOptions.map(rt => <option key={rt} value={rt}>{rt}</option>)}
              </select>
              {errors.rt && <p className="text-red-500 text-sm mt-1">{errors.rt}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Keluarga <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.namaKeluarga}
                onChange={(e) => setFormData(prev => ({ ...prev, namaKeluarga: e.target.value }))}
                disabled={saving}
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.namaKeluarga ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.namaKeluarga && <p className="text-red-500 text-sm mt-1">{errors.namaKeluarga}</p>}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Data Ahli Kubur</h3>
              <button
                type="button"
                onClick={addRow}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={16} />
                <span className="ml-2">Tambah Baris</span>
              </button>
            </div>

            {errors.ahliKubur && <p className="text-red-500 mb-2">{errors.ahliKubur}</p>}

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-sm">No</th>
                    <th className="px-4 py-3 text-sm">Nama Ahli Kubur</th>
                    <th className="px-4 py-3 text-sm">Bin/Binti</th>
                    <th className="px-4 py-3 text-sm">Nama Orang Tua</th>
                    <th className="px-4 py-3 text-sm">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.ahliKubur.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.namaAhliKubur}
                          onChange={(e) => updateAhliKubur(item.id, 'namaAhliKubur', e.target.value)}
                          disabled={saving}
                          className={`w-full px-3 py-2 border rounded ${
                            errors[`ahliKubur_${index}_nama`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={item.binBinti}
                          onChange={(e) => updateAhliKubur(item.id, 'binBinti', e.target.value)}
                          disabled={saving}
                          className={`w-full px-3 py-2 border rounded ${
                            errors[`ahliKubur_${index}_binBinti`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Pilih</option>
                          {binBintiOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.namaOrangTua}
                          onChange={(e) => updateAhliKubur(item.id, 'namaOrangTua', e.target.value)}
                          disabled={saving}
                          className={`w-full px-3 py-2 border rounded ${
                            errors[`ahliKubur_${index}_orangTua`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formData.ahliKubur.length > 1 && (
                          <button type="button" onClick={() => removeRow(item.id)} className="text-red-600 hover:text-red-800">
                            <Minus size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save size={18} />
              <span className="ml-2 font-medium">{saving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormInput;
