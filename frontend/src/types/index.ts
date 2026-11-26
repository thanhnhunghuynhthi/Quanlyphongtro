export type UserRole = 'OWNER' | 'TENANT';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  email?: string;
  avatar?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  tenantProfile?: TenantProfile;
}

export interface TenantProfile {
  id: number;
  userId?: number;
  user?: {
    id: number;
    username: string;
    isActive: boolean;
    mustChangePassword: boolean;
    avatar?: string;
    createdAt?: string;
  };
  fullName: string;
  phone: string;
  email?: string;
  identityNumber: string;
  identityIssueDate?: string;
  identityIssuePlace?: string;
  dateOfBirth?: string;
  gender?: string;
  hometown?: string;
  hasTemporaryResidence: boolean;
  currentRoomId?: number;
  currentRoom?: Room;
  contracts?: Contract[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Property {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  description?: string;
  managerName?: string;
  managerPhone?: string;
  floors?: Floor[];
  rooms?: Room[];
}

export interface Floor {
  id: number;
  propertyId: number;
  floorNumber: number;
  name: string;
}

export interface Amenity {
  id: number;
  name: string;
  icon?: string;
  description?: string;
}

export interface RoomAmenity {
  id: number;
  roomId: number;
  amenityId: number;
  amenity: Amenity;
}

export interface RoomImage {
  id: number;
  roomId: number;
  url: string;
  caption?: string;
  isCover: boolean;
  orderIndex: number;
}

export interface Room {
  id: number;
  roomNumber: string;
  propertyId: number;
  property?: Property;
  floorId: number;
  floor?: Floor;
  area: number;
  basePrice: number;
  depositAmount: number;
  maxRenters: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  isPublic: boolean;
  description?: string;
  isArchived?: boolean;
  images?: RoomImage[];
  roomAmenities?: RoomAmenity[];
  contracts?: Contract[];
  tenants?: TenantProfile[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ContractOccupant {
  id?: number;
  contractId?: number;
  fullName: string;
  phone?: string;
  identityNumber?: string;
  relationship?: string;
  hasTemporaryResidence?: boolean;
}

export interface Service {
  id: number;
  code: string;
  name: string;
  unit: string;
  defaultPrice: number;
  chargeType: 'METERED' | 'FIXED_PER_ROOM' | 'PER_PERSON';
}

export interface ContractService {
  id?: number;
  contractId?: number;
  serviceId: number;
  service?: Service;
  customPrice: number;
  quantity: number;
}

export interface Contract {
  id: number;
  contractCode: string;
  roomId: number;
  room: Room;
  tenantId: number;
  tenant: TenantProfile;
  startDate: string;
  endDate: string;
  actualEndDate?: string;
  rentalPrice: number;
  depositAmount: number;
  depositRefunded?: number;
  depositDeducted?: number;
  deductionReason?: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  terms?: string;
  note?: string;
  occupants?: ContractOccupant[];
  contractServices?: ContractService[];
  invoices?: Invoice[];
  createdAt?: string;
}

export interface MeterReading {
  id: number;
  roomId: number;
  room?: Room;
  period: string; // YYYY-MM
  oldElectricity: number;
  newElectricity: number;
  usedElectricity: number;
  oldWater: number;
  newWater: number;
  usedWater: number;
  readingDate?: string;
  recordedBy?: string;
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  itemName: string;
  itemType: 'ROOM' | 'ELECTRICITY' | 'WATER' | 'SERVICE' | 'SURCHARGE' | 'DISCOUNT';
  unitPrice: number;
  quantity: number;
  unit: string;
  amount: number;
  notes?: string;
}

export interface Payment {
  id: number;
  paymentCode: string;
  invoiceId: number;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER';
  paymentDate: string;
  receivedBy?: string;
  transactionReference?: string;
  notes?: string;
}

export interface PaymentSubmission {
  id: number;
  invoiceId: number;
  invoice?: Invoice;
  tenantId: number;
  amount: number;
  bankName?: string;
  transactionCode?: string;
  proofImageUrl?: string;
  note?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  invoiceCode: string;
  roomId: number;
  room: Room;
  contractId: number;
  contract: Contract;
  meterReadingId?: number;
  meterReading?: MeterReading;
  period: string;
  issueDate: string;
  dueDate: string;
  roomAmount: number;
  servicesAmount: number;
  surcharge: number;
  discount: number;
  adjustmentReason?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  isOverdue?: boolean;
  notes?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  submissions?: PaymentSubmission[];
  createdAt?: string;
}

export interface ViewingAppointment {
  id: number;
  appointmentCode: string;
  roomId: number;
  room: Room;
  fullName: string;
  phone: string;
  email?: string;
  preferredDate: string;
  message?: string;
  status: 'PENDING' | 'CONFIRMED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED';
  ownerNote?: string;
  suggestedDate?: string;
  createdAt: string;
}

export interface MaintenanceUpdate {
  id: number;
  requestId: number;
  updatedByUserId?: number;
  updatedByUser?: { fullName: string; role: string };
  status: string;
  message: string;
  createdAt: string;
}

export interface MaintenanceRequest {
  id: number;
  requestCode: string;
  roomId: number;
  room: Room;
  tenantId?: number;
  createdByUserId?: number;
  createdByUser?: { fullName: string; phone?: string };
  title: string;
  category: 'ELECTRICAL' | 'PLUMBING' | 'APPLIANCE' | 'FURNITURE' | 'OTHER';
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  description: string;
  imageUrl?: string;
  status: 'PENDING' | 'RECEIVED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  estimatedCost: number;
  resolvedAt?: string;
  updates?: MaintenanceUpdate[];
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  type: 'GENERAL' | 'PAYMENT_REMINDER' | 'MAINTENANCE' | 'RULES' | 'EMERGENCY';
  targetType: 'ALL' | 'PROPERTY' | 'ROOM' | 'INDIVIDUAL';
  targetPropertyId?: number;
  targetRoomId?: number;
  isRead?: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  user?: { fullName: string; username: string; role: string };
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardStats {
  roomStats: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    occupancyRate: number;
  };
  financialStats: {
    currentPeriod: string;
    monthCollected: number;
    monthBilled: number;
    totalOutstandingDebt: number;
    unpaidInvoicesCount: number;
  };
  expiringContracts: Contract[];
  upcomingAppointments: ViewingAppointment[];
  pendingMaintenance: MaintenanceRequest[];
  monthlyChartData: Array<{
    period: string;
    label: string;
    thucThu: number;
    tienPhong: number;
    dienNuocDichVu: number;
    tongHoaDon: number;
  }>;
}
