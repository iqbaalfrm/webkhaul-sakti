import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Search, ChevronLeft, ChevronRight, Users, Edit, Download, FileText } from 'lucide-react';
import { familyAPI } from '../services/api';
import { useAPI, useAPIMutation } from '../hooks/useAPI';
import FamilyModal from '../components/FamilyModal';

interface AhliKubur {
  _id: string;
  namaAhliKubur: string;
  binBinti: string;
  namaOrangTua: string;
}

interface Family {
  _id: string;
  rt: string;
  namaKeluarga: string;
  ahliKubur: AhliKubur[];
  createdAt: string;
  updatedAt: string;
}

const RTDetailPage: React.FC = () => {
  const { rtNumber } = useParams<{ rtNumber: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [sortField, setSortField] = useState<'namaKeluarga' | 'ahliKuburCount' | 'createdAt'>('namaKeluarga');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const familiesPerPage = 10;

  const rt = `RT ${rtNumber?.padStart(2, '0')}`;

  const { data: familiesData, loading, error, refetch } = useAPI(
    () => familyAPI.getAll({ rt, limit: 100 }),
    [rt]
  );

  const { mutate: updateFamily } = useAPIMutation();
  const { mutate: deleteFamily } = useAPIMutation();

  const families = familiesData?.families || [];

  // Filter and sort families
  const processedFamilies = React.useMemo(() => {
    let filtered = families;
    
    // Apply search filter
    if (searchTerm) {
      filtered = families.filter((family: Family) =>
        family.namaKeluarga.toLowerCase().includes(searchTerm.toLowerCase()) ||
        family.ahliKubur.some(ahli => 
          ahli.namaAhliKubur.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ahli.namaOrangTua.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered.sort((a: Family, b: Family) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'namaKeluarga':
          aValue = a.namaKeluarga.toLowerCase();
          bValue = b.namaKeluarga.toLowerCase();
          break;
        case 'ahliKuburCount':
          aValue = a.ahliKubur.length;
          bValue = b.ahliKubur.length;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [families, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedFamilies.length / familiesPerPage);
  const startIndex = (currentPage - 1) * familiesPerPage;
  const paginatedFamilies = processedFamilies.slice(startIndex, startIndex + familiesPerPage);

  const totalAhliKubur = families.reduce((sum: number, family: Family) => sum + family.ahliKubur.length, 0);

  const handleSort = (field: 'namaKeluarga' | 'ahliKuburCount' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvData = families.map((family: Family, index: number) => ({
      No: index + 1,
      'Nama Keluarga': family.namaKeluarga,
      'Jumlah Ahli Kubur': family.ahliKubur.length,
      'Tanggal Daftar': new Date(family.createdAt).toLocaleDateString('id-ID'),
      'Ahli Kubur': family.ahliKubur.map(ahli => 
        `${ahli.namaAhliKubur} ${ahli.binBinti} ${ahli.namaOrangTua}`
      ).join('; ')
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `data-${rt.toLowerCase().replace(' ', '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFamilyDetail = (family: Family) => {
    setSelectedFamily(family);
    setIsFamilyModalOpen(true);
  };

  const handleUpdateFamily = async (familyId: string, updatedData: any) => {
    try {
      await updateFamily(
        () => familyAPI.update(familyId, updatedData),
        {
          onSuccess: () => {
            refetch();
          }
        }
      );
    } catch (error) {
      console.error('Error updating family:', error);
    }
  };

  const handleDeleteFamily = async (familyId: string) => {
    try {
      await deleteFamily(
        () => familyAPI.delete(familyId),
        {
          onSuccess: () => {
            refetch();
          }
        }
      );
    } catch (error) {
      console.error('Error deleting family:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="text-red-600">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Terjadi Kesalahan</h3>
              <p className="text-red-700">{error}</p>
              <Link
                to="/dashboard"
                className="mt-3 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Kembali ke Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen View */}
      <div className="max-w-7xl mx-auto print:hidden">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                <span>Kembali</span>
              </Link>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Data {rt}</h1>
                <p className="text-gray-600">
                  {families.length} keluarga • {totalAhliKubur} ahli kubur
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                <Printer size={18} />
                <span className="font-medium">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* DataTables-style Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Tampilkan:</label>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={familiesPerPage}
                disabled
              >
                <option value={10}>10</option>
              </select>
              <span className="text-sm text-gray-600">entri</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Cari:</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari keluarga atau ahli kubur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* DataTables-style Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                    No
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('namaKeluarga')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nama Keluarga</span>
                      <span className="text-gray-400">{getSortIcon('namaKeluarga')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-32"
                    onClick={() => handleSort('ahliKuburCount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Jumlah Ahli Kubur</span>
                      <span className="text-gray-400">{getSortIcon('ahliKuburCount')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-40"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tanggal Daftar</span>
                      <span className="text-gray-400">{getSortIcon('createdAt')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedFamilies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-400 mb-2">
                        <Users size={48} className="mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-600 mb-1">
                        {searchTerm ? 'Tidak ada hasil' : 'Belum ada data'}
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm 
                          ? 'Tidak ada data yang sesuai dengan pencarian Anda'
                          : `Belum ada keluarga yang terdaftar untuk ${rt}`
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedFamilies.map((family: Family, index: number) => (
                    <tr key={family._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {family.namaKeluarga}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {family.ahliKubur.length} orang
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(family.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleFamilyDetail(family)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit size={14} />
                          <span>Kelola</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* DataTables-style Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan {paginatedFamilies.length > 0 ? startIndex + 1 : 0} sampai {Math.min(startIndex + familiesPerPage, processedFamilies.length)} dari {processedFamilies.length} entri
                {searchTerm && processedFamilies.length !== families.length && (
                  <span className="text-gray-500"> (difilter dari {families.length} total entri)</span>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print View */}
      <div className="hidden print:block">
        <style>{`
          @media print {
            @page {
              size: F4;
              margin: 1cm;
            }
            
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.4;
              color: black;
            }
            
            .print-page {
              page-break-after: always;
              height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            .print-page:last-child {
              page-break-after: auto;
            }
            
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid black;
              padding-bottom: 10px;
            }
            
            .print-family {
              margin-bottom: 30px;
              border: 1px solid black;
              flex: 1;
            }
            
            .print-family-header {
              background-color: #f5f5f5;
              padding: 8px;
              border-bottom: 1px solid black;
              font-weight: bold;
            }
            
            .print-table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .print-table th,
            .print-table td {
              border: 1px solid black;
              padding: 4px;
              text-align: left;
              font-size: 13pt;
            }
            
            .print-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            
          }
        `}</style>

        {/* Group families into pages (2 families per page) */}
        {Array.from({ length: Math.ceil(families.length / 2) }, (_, pageIndex) => {
          const startIdx = pageIndex * 2;
          const pageFamilies = families.slice(startIdx, startIdx + 2);
          
          return (
            <div key={pageIndex} className="print-page">
              {pageFamilies.map((family: Family, familyIdx: number) => (
                <div key={family._id} className="print-family">
                  <div className="print-family-header">
                    {startIdx + familyIdx + 1}. KELUARGA: {family.namaKeluarga.toUpperCase()}
                  </div>
                  
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th style={{ width: '8%' }}>No</th>
                        <th style={{ width: '35%' }}>Nama Ahli Kubur</th>
                        <th style={{ width: '12%' }}>Bin/Binti</th>
                        <th style={{ width: '35%' }}>Nama Orang Tua</th>
                      </tr>
                    </thead>
                    <tbody>
                      {family.ahliKubur.map((ahli, index) => (
                        <tr key={ahli._id}>
                          <td style={{ textAlign: 'center' }}>{index + 1}</td>
                          <td>{ahli.namaAhliKubur}</td>
                          <td style={{ textAlign: 'center' }}>{ahli.binBinti}</td>
                          <td>{ahli.namaOrangTua}</td>
                        </tr>
                      ))}
                      {/* Fill empty rows up to 15 entries per family */}
                      {Array.from({ length: Math.max(0, 15 - family.ahliKubur.length) }, (_, i) => (
                        <tr key={`empty-${i}`}>
                          <td style={{ textAlign: 'center' }}>{family.ahliKubur.length + i + 1}</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            </div>
          );
        })}
      </div>

      {/* Family Modal */}
      {selectedFamily && (
        <FamilyModal
          isOpen={isFamilyModalOpen}
          onClose={() => {
            setIsFamilyModalOpen(false);
            setSelectedFamily(null);
          }}
          familyData={selectedFamily}
          onUpdateFamily={handleUpdateFamily}
          onDeleteFamily={handleDeleteFamily}
        />
      )}
    </>
  );
};

export default RTDetailPage;