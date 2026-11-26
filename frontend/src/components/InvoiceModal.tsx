import { vietcombankAccount } from '../siteDetails';
import React from 'react';
import { Invoice } from '../types';
import { Printer, X, Home, QrCode } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Toolbar */}
        <div className="p-4 bg-slate-100 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <Home className="text-orange-600" size={18} />
            <span className="font-bold text-slate-800 text-sm">Phiếu Báo Tiền Phòng & Dịch Vụ</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Printer size={16} /> In Hóa Đơn
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-xl">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable invoice */}
        <div id="room-invoice-print" className="p-6 overflow-y-auto space-y-5 text-xs font-sans">
          {/* Header */}
          <div className="text-center border-b pb-4 space-y-1">
            <h2 className="text-lg font-black text-slate-900 uppercase">NHÀ TRỌ AN BÌNH - PHIẾU THU TIỀN PHÒNG</h2>
            <p className="text-slate-500">Kỳ thanh toán: <span className="font-bold text-orange-600 text-sm">Tháng {invoice.monthYear}</span></p>
            <p className="text-slate-500 text-[11px]">Mã hóa đơn: <span className="font-mono font-bold text-slate-700">{invoice.invoiceCode}</span></p>
          </div>

          {/* Room and Tenant info */}
          <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-100 grid grid-cols-2 gap-3">
            <div>
              <p className="text-slate-500">Phòng thuê:</p>
              <p className="font-bold text-slate-900 text-base">{invoice.room.roomNumber} (Tầng {invoice.room.floor})</p>
            </div>
            <div>
              <p className="text-slate-500">Khách thuê đại diện:</p>
              <p className="font-bold text-slate-900 text-sm">{invoice.contract?.tenant?.fullName || 'Khách thuê'}</p>
              <p className="text-slate-600 text-[11px] font-mono">{invoice.contract?.tenant?.phone}</p>
            </div>
          </div>

          {/* Fee details breakdown */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-2 uppercase tracking-wide">Chi Tiết Các Khoản Phí:</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Khoản mục</th>
                    <th className="py-2.5 px-3">Đơn giá / Định mức</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">1. Tiền thuê phòng</td>
                    <td className="py-2.5 px-3 text-slate-500">1 tháng</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatVND(invoice.roomFee)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">2. Tiền điện sinh hoạt</td>
                    <td className="py-2.5 px-3 text-slate-500">{formatVND(invoice.contract?.electricityRate || 3500)} / kWh</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatVND(invoice.electricityFee)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">3. Tiền nước sinh hoạt</td>
                    <td className="py-2.5 px-3 text-slate-500">{formatVND(invoice.contract?.waterRate || 20000)} / m³</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatVND(invoice.waterFee)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">4. Phí thu gom rác & Vệ sinh</td>
                    <td className="py-2.5 px-3 text-slate-500">Cố định</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatVND(invoice.garbageFee)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">5. Phí mạng Internet / Wifi</td>
                    <td className="py-2.5 px-3 text-slate-500">Cố định</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatVND(invoice.internetFee)}</td>
                  </tr>
                  {invoice.otherFees > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">6. Phí dịch vụ phát sinh khác</td>
                      <td className="py-2.5 px-3 text-slate-500">Gửi xe / Khác</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatVND(invoice.otherFees)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total & Payment Status */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 border-b pb-2">
              <span>TỔNG TIỀN PHẢI THANH TOÁN:</span>
              <span className="text-lg text-orange-600">{formatVND(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Trạng thái thanh toán:</span>
              {invoice.status === 'PAID' ? (
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Đã thanh toán ({invoice.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'})
                </span>
              ) : (
                <span className="font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                  Chưa thanh toán (Hạn chót ngày 05)
                </span>
              )}
            </div>
            {invoice.note && (
              <p className="text-[11px] text-slate-500 italic pt-1">Ghi chú: {invoice.note}</p>
            )}
          </div>

          {/* QR payment notice */}
          <div className="pt-2 border-t flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-bold text-slate-800">Thông tin chuyển khoản nhanh:</p>
              <p className="text-slate-600">Ngân hàng: <span className="font-bold">Vietcombank</span></p>
              <p className="text-slate-600">Số tài khoản: <span className="font-mono font-bold text-slate-900">{vietcombankAccount}</span></p>
              <p className="text-slate-500 text-[10px]">Nội dung CK: <span className="font-mono text-orange-600 font-bold">{invoice.room.roomNumber} T{invoice.monthYear.replace('/', '')}</span></p>
            </div>
            <div className="p-2 border border-slate-200 rounded-xl bg-white flex flex-col items-center">
              <QrCode size={64} className="text-slate-800" />
              <span className="text-[9px] text-slate-400 mt-0.5 font-bold">VietQR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
