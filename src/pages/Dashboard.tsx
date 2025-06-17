import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, BarChart3, Users, MapPin, DollarSign, RefreshCw, ChevronRight, Eye } from 'lucide-react';
import { iuranAPI, statistikAPI } from '../services/api';
import { useAPI } from '../hooks/useAPI';
import FinancialModal from '../components/FinancialModal';

interface Statistics {
  totalFamilies: number;
  totalAhliKubur: number;
  totalIuran: number;
  rtDistribution: Array<{
    rt: string;
    families: number;
    ahliKubur: number;
  }>;
  financialStats: Array<{
    rt: string;
    totalNominal: number;
    count: number;
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);

  const rtOptions = Array.from({ length: 6 }, (_, i) => `RT ${(i + 1).toString().padStart(2, '0')}`);

  // API hooks
  const { data: statistics, loading: statsLoading, error: statsError, refetch: refetchStats } = useAPI(
    () => statistikAPI.getAll(),
    []
  );

  const { data: iuranData, refetch: refetchIuran } = useAPI(
    () => iuranAPI.getAll({ limit: 100 }),
    []
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExportPDF = () => {
    alert('Fitur export PDF akan segera tersedia!');
  };

  const handleIuranUpdate = () => {
    refetchIuran();
    refetchStats();
  };

  const handleRTClick = (rt: string) => {
    const rtNumber = rt.split(' ')[1]; // Extract "01" from "RT 01"
    navigate(`/dashboard/rt/${rtNumber}`);
  };

  if (statsError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="text-red-600">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Terjadi Kesalahan</h3>
              <p className="text-red-700">
                {statsError}. Pastikan server backend berjalan di port 5000.
              </p>
              <button
                onClick={() => {
                  refetchStats();
                }}
                className="mt-3 flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw size={16} />
                <span>Coba Lagi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Informasi</h1>
              <p className="text-gray-600">Khaul Massal Desa Klikiran dan Santunan Anak Yatim 2025</p>
            </div>
          </div>
          <button
            onClick={() => {
              refetchStats();
              refetchIuran();
            }}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Families */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jumlah Keluarga</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : statistics?.totalFamilies || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">yang mendaftarkan</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Total Ahli Kubur */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jumlah Ahli Kubur</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : statistics?.totalAhliKubur || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">yang tercatat</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* RT Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Distribusi per RT</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : statistics?.rtDistribution?.filter(rt => rt.ahliKubur > 0).length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">RT aktif dari 6 RT</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Total Contribution - Clickable */}
        <div 
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-yellow-200"
          onClick={() => setIsFinancialModalOpen(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Estimasi Iuran</p>
              <p className="text-lg font-bold text-gray-900">
                {statsLoading ? '...' : formatCurrency(statistics?.totalIuran || 0)}
              </p>
              <p className="text-xs text-yellow-600 mt-1 font-medium">Klik untuk kelola →</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* RT Distribution Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-800">Distribusi Data per RT</h2>
          </div>
          <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg">
            💡 Klik RT untuk melihat detail dan print data
          </div>
        </div>

        {/* RT Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-6 h-32"></div>
            ))
          ) : (
            rtOptions.map(rt => {
              const rtStats = statistics?.rtDistribution?.find(stat => stat.rt === rt);
              const rtFinancial = statistics?.financialStats?.find(stat => stat.rt === rt);
              
              return (
                <div 
                  key={rt}
                  className="p-6 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200"
                  onClick={() => handleRTClick(rt)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rt}</h3>
                        <ChevronRight className="text-blue-600" size={16} />
                      </div>
                      <p className="text-sm text-gray-600">
                        {rtStats?.families || 0} keluarga • {rtStats?.ahliKubur || 0} ahli kubur
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Eye className="text-blue-600" size={18} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Export Section */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Rekap Iuran Per RT</h2>
          <button
            onClick={() => setIsFinancialModalOpen(true)}
            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center space-x-1"
          >
            <span>Kelola Data</span>
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-20"></div>
            ))
          ) : (
            rtOptions.map(rt => {
              const rtStats = statistics?.rtDistribution?.find(stat => stat.rt === rt);
              const rtFinancial = statistics?.financialStats?.find(stat => stat.rt === rt);
              
              return (
                <div key={rt} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{rt}</p>
                      <p className="text-sm text-gray-600">
                        {rtStats?.families || 0} keluarga
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {rtFinancial?.totalNominal ? formatCurrency(rtFinancial.totalNominal) : '-'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rtFinancial?.count || 0} pembayaran
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Keseluruhan:</span>
            <span className="font-bold text-xl text-yellow-600">
              {statsLoading ? '...' : formatCurrency(statistics?.totalIuran || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Modal */}
      <FinancialModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
        iuranRecords={iuranData?.iuranRecords || []}
        onUpdateRecords={handleIuranUpdate}
      />
    </div>
  );
};

export default Dashboard;