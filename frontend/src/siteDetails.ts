export const supportPhone = '0393104054';
export const vietcombankAccount = '1039015647';
export const siteCopyright = '© 2026 Hệ Thống Quản Lý Phòng Trọ - Nhà Trọ Số.';

export function getPropertyPhone(managerPhone?: string) {
  const phone = managerPhone?.replace(/[\s.()-]/g, '');
  return phone && /^\+?\d{8,15}$/.test(phone) && phone !== '0908123456' ? phone : supportPhone;
}
