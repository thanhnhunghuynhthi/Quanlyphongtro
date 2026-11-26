import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuditLog } from '../types';
import {
  Download, FileSpreadsheet, ShieldCheck, Clock, AlertTriangle,
  RefreshCw, Search, CheckCircle2, DollarSign, Layers
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [debts, setDebts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDebt, setSearchDebt] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [debtsRes, logsRes] = await Promise.all([
        api.get('/reports/debts'),
        api.get('/audit-logs')
      ]);
      setDebts(debtsRes.data);
      setAuditLogs(logsRes.data);
    } catch (err) {
      console.error('Lỗi tải báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Tải trực tiếp file CSV từ backend
    window.open('/api/reports/export-csv', '_blank');
  };

  const filteredDebts = debts.filter(d =>
    d.roomNumber?.toLowerCase().includes(searchDebt.toLowerCase()) ||
    d.tenantName?.toLowerCase().includes(searchDebt.toLowerCase()) ||
    d.invoiceCode?.toLowerCase().includes(searchDebt.toLowerCase())
  );

  const totalOutstanding = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">BÁO CÁO & KIỂM TOÁN</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Đối Soát Công Nợ & Nhật Ký Hệ Thống
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi chi tiết công nợ từng phòng, xuất file Excel CSV chuẩn tiếng Việt và truy vết nhật ký thay đổi
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <FileSpreadsheet size={16} /> Xuất Báo Cáo Excel (CSV)
        </button>
      </div>

      {/* Debt Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
            TỔNG DƯ NỢ CẦN THU TOÀN KHU
          </span>
          <h3 className="text-3xl font-black text-white mt-1">
            {totalOutstanding.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-400">VNĐ</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tổng cộng <strong className="text-white">{debts.length}</strong> hóa đơn còn dư nợ chưa thanh toán đủ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchDebt}
            onChange={(e) => setSearchDebt(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Tìm theo phòng, tên khách..."
          />
        </div>
      </div>

      {/* Bảng công nợ chi tiết */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <h3 className="text-base font-extrabold text-slate-900">
          Danh Sách Các Phòng Còn Dư Nợ Tiền Phòng & Dịch Vụ
        </h3>

        {filteredDebts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            {searchDebt ? 'Không tìm thấy hóa đơn công nợ phù hợp từ khóa.' : 'Tuyệt vời! Hiện tại không có phòng nào còn nợ tiền.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                <tr>
                  <th className="py-3 px-4">Hóa Đơn</th>
                  <th className="py-3 px-4">Phòng & Khu Trọ</th>
                  <th className="py-3 px-4">Người Thuê</th>
                  <th className="py-3 px-4">Hạn Thanh Toán</th>
                  <th className="py-3 px-4 text-right">Tổng Hóa Đơn</th>
                  <th className="py-3 px-4 text-right">Đã Trả</th>
                  <th className="py-3 px-4 text-right">Còn Nợ</th>
                  <th className="py-3 px-4 text-center">Tình Trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDebts.map((d) => (
                  <tr key={d.invoiceId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{d.invoiceCode}</td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">Phòng {d.roomNumber}</strong>
                      <span className="text-[10px] text-slate-400">{d.property}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 font-bold block">{d.tenantName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{d.tenantPhone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {new Date(d.dueDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      {d.totalAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {d.paidAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-red-600">
                      {d.remainingAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {d.isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                          Quá hạn
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Trong hạn
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nhật ký kiểm toán hệ thống (Audit Logs) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-teal-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Ghi nhận 50 thao tác gần nhất</span>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.2 rounded border border-teal-200/60">
                    {log.action}
                  </span>
                  <span className="text-slate-500">[{log.entity} #{log.entityId}]</span>
                </div>
                <p className="text-slate-700 font-medium">{log.details}</p>
              </div>

              <div className="text-right text-[11px] text-slate-400 shrink-0">
                <span className="font-semibold text-slate-600 block">{log.user?.fullName || 'Hệ thống'}</span>
                <span>{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
