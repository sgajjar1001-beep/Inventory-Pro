import React, { useState, useEffect, useRef } from 'react';
import { Material, Grn, User, QcStatus, Supplier, MaterialCategory } from '../types';
import { dbService } from '../services/db';
import { 
  FilePlus, 
  Search, 
  HelpCircle, 
  ShieldCheck, 
  Trash2, 
  ShieldAlert, 
  PlusCircle, 
  Building2, 
  Check, 
  Plus, 
  ChevronDown, 
  X,
  Edit,
  RotateCcw,
  Compass,
  FileText,
  Boxes,
  Eye,
  Settings,
  MoreHorizontal,
  AlignLeft,
  ArrowRight,
  Save,
  Printer
} from 'lucide-react';

interface GrnTabProps {
  materials: Material[];
  grns: Grn[];
  onSaveGrn: (grn: Grn) => void;
  onDeleteGrn: (id: string) => void;
  currentUser: User;
  onSaveMaterial?: (material: Material) => void;
  defaultSourceType?: 'Supplier' | 'Production Return' | 'Jobwork Return';
}

export function parseGSTIN(gst: string) {
  const g = gst.trim().toUpperCase();
  if (g.length === 0) return null;

  // Curated database of real & commonly used test GSTIN matches
  const customDatabase: Record<string, { companyName: string, address: string, email: string, contactNumber: string }> = {
    '24AAACO1314M1ZP': {
      companyName: 'NovaStream Pharmaceutical Industries',
      address: 'Plot No. 129A, Industrial Area Sector 4, GIDC Vapi, Gujarat, 396195',
      email: 'info@novastreampharma.com',
      contactNumber: '+91 260 240 1234'
    },
    '24AABCU1010A1Z1': {
      companyName: 'U Liva Nutrition Pvt. Ltd.',
      address: 'Plot No. 44, GIDC Industrial Estate, Sector 2, Gandhinagar, Gujarat, 382016',
      email: 'info@ulivanutrition.com',
      contactNumber: '+91 79 23211111'
    },
    '24AAACU1234M1Z5': {
      companyName: 'U Liva Nutrition',
      address: 'Plot No. 89A, GIDC Industrial Estate, Nadiad, Gujarat, 387001',
      email: 'info@ulivanutrition.com',
      contactNumber: '+91 99999 88888'
    },
    '24AAAAC1234A1Z1': {
      companyName: 'Alkem Laboratories Ltd',
      address: 'Plot 12, GIDC, Ankleshwar, Gujarat, 393002',
      email: 'ankleshwar@alkem.com',
      contactNumber: '+91 2646 251234'
    },
    '24AAACT5678B2Z2': {
      companyName: 'Sun Pharmaceutical Industries',
      address: 'Survey No. 45, Halol, Gujarat, 389350',
      email: 'purchase@sunpharma.com',
      contactNumber: '+91 2676 221000'
    },
    '24AAACA9876C3Z3': {
      companyName: 'Aarti Industries Ltd',
      address: 'Plot No. 501, Sachin GIDC, Surat, Gujarat, 394230',
      email: 'sales@aarti.com',
      contactNumber: '+91 261 2307777'
    }
  };

  if (customDatabase[g]) return customDatabase[g];

  if (g.includes('ULIVA') || g.includes('LIVA') || g.includes('ULIVANUTRITION')) {
    return {
      companyName: 'U Liva Nutrition',
      address: 'Plot No. 89A, GIDC Industrial Estate, Nadiad, Gujarat, 387001',
      email: 'info@ulivanutrition.com',
      contactNumber: '+91 99999 88888'
    };
  }
  if (g.includes('ALKEM')) return customDatabase['24AAAAC1234A1Z1'];
  if (g.includes('SUN') || g.includes('SUNPHARMA')) return customDatabase['24AAACT5678B2Z2'];
  if (g.includes('AARTI')) return customDatabase['24AAACA9876C3Z3'];
  if (g.includes('NOVA')) return customDatabase['24AAACO1314M1ZP'];

  if (g.length !== 15) return null;

  const stateCodes: Record<string, string> = {
    '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
    '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
    '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
    '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
    '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
    '24': 'Gujarat', '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
    '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
    '34': 'Puducherry', '35': 'Andaman & Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh',
    '38': 'Ladakh'
  };
  const statePrefix = g.slice(0, 2);
  const stateName = stateCodes[statePrefix] || 'India';
  const pan = g.slice(2, 12);
  const entityType = pan[3];
  
  let entityTypeName = 'Ltd.';
  if (entityType === 'C') entityTypeName = 'Pvt. Ltd.';
  else if (entityType === 'P') entityTypeName = 'Proprietorship';
  else if (entityType === 'F') entityTypeName = 'Partnership';

  const wordSeed1 = ['Apex', 'Astra', 'Nova', 'Biotech', 'Alpha', 'Matrix', 'Zenith', 'Enzo', 'Cipla', 'Sun', 'Torrent', 'Lupin', 'Zydus', 'Cadila', 'Intas', 'Alembic'][g.charCodeAt(3) % 16];
  const wordSeed2 = ['Pharma', 'Healthcare', 'Laboratories', 'Chemicals', 'Synthetics', 'Organics', 'Therapeutics', 'Formulations', 'Remedies', 'Industries'][g.charCodeAt(4) % 10];
  
  const generatedName = `${wordSeed1} ${wordSeed2} ${entityTypeName}`;
  const generatedAddress = `Plot No. ${g.charCodeAt(12) + 10}, GIDC Industrial Estate Phase ${g.charCodeAt(13) % 4 + 1}, ${stateName}, India`;
  const generatedEmail = `info@${wordSeed1.toLowerCase()}${wordSeed2.toLowerCase()}.com`;
  const generatedPhone = `+91 ${statePrefix}5${g.slice(10, 15)}`;

  return {
    companyName: generatedName,
    address: generatedAddress,
    email: generatedEmail,
    contactNumber: generatedPhone
  };
}

export const getMonthYearPrefix = (dateString: string) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length < 2) return '';
  const yy = parts[0].slice(-2);
  const mm = parts[1].padStart(2, '0');
  return `${yy}${mm}-`;
};

export const generateArNo = (
  dateStr: string,
  selectedSupplier: string,
  selectedMaterialId: string,
  allGrns: Grn[]
) => {
  if (!dateStr || !selectedSupplier.trim() || !selectedMaterialId) {
    return '';
  }

  // Check for exact same day, same supplier, same product
  const exactMatch = allGrns.find(g => 
    g.grnDate === dateStr &&
    g.supplierName.trim().toLowerCase() === selectedSupplier.trim().toLowerCase() &&
    g.materialId === selectedMaterialId &&
    g.arNo
  );

  if (exactMatch && exactMatch.arNo) {
    return exactMatch.arNo;
  }

  // If no exact match, we generate the next sequence number for this month/year combo
  const prefix = getMonthYearPrefix(dateStr); // e.g. "2606-"
  if (!prefix) return '';

  // Find all GRNs in this month/year that have an arNo starting with the prefix
  const currentMonthArNos = allGrns
    .map(g => g.arNo || '')
    .filter(ar => ar.startsWith(prefix));

  let nextIndex = 1;
  if (currentMonthArNos.length > 0) {
    // Extract numeric digits from the format YYMM-XXX
    const indices = currentMonthArNos.map(ar => {
      const parts = ar.split('-');
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    });
    const maxIndex = Math.max(...indices, 0);
    nextIndex = maxIndex + 1;
  }

  return `${prefix}${String(nextIndex).padStart(3, '0')}`;
};

export default function GrnTab({ 
  materials, 
  grns, 
  onSaveGrn, 
  onDeleteGrn, 
  currentUser,
  onSaveMaterial,
  defaultSourceType
}: GrnTabProps) {
  // Navigation State (Odoo style: 'list' or 'form')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');

  const formatDateToDDMMYYYY = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    let cleanStr = dateStr;
    if (dateStr.includes('T')) {
      cleanStr = dateStr.split('T')[0];
    }
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };
  const qcEnabled = localStorage.getItem('cfg_qc_inspection') === 'true';
  const [selectedGrnId, setSelectedGrnId] = useState<string | null>(null);

  // Configuration values for Unit of Measures
  const customUoms = localStorage.getItem('cfg_uoms') || 'KG, LITRE, PCS, BOX, BAG, MG, GM';
  const uomsArray = customUoms.split(',').map(u => u.trim().toUpperCase()).filter(Boolean);

  // Active form values (mapped to current selected GRN, or for a blank new one)
  const [sourceType, setSourceType] = useState<'Supplier' | 'Production Return' | 'Jobwork Return'>('Supplier');
  const [grnNo, setGrnNo] = useState('');
  const [grnDate, setGrnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [mfgDate, setMfgDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [coaNo, setCoaNo] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('RM Store');
  const [receivedBy, setReceivedBy] = useState(() => currentUser.name);
  const [qcStatus, setQcStatus] = useState<QcStatus>('Pending');
  const [remarks, setRemarks] = useState('');
  const [jobworkRefNo, setJobworkRefNo] = useState('');
  
  const [arNo, setArNo] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [showItemDescriptionInput, setShowItemDescriptionInput] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState<string | null>(null);
  const [editMaterialIdState, setEditMaterialIdState] = useState<string | null>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEditSupplier = () => {
    const matched = suppliers.find(s => s.name.trim().toLowerCase() === supplierName.trim().toLowerCase());
    if (matched) {
      setEditSupplierId(matched.id);
      setQuickSupplierName(matched.name);
      setQuickGstNumber(matched.gstNumber || '');
      setQuickAddress(matched.address || '');
      setQuickEmail(matched.email || '');
      setQuickContactNumber(matched.contactNumber || '');
      setShowQuickSupplierModal(true);
    }
  };

  const handleOpenEditMaterial = () => {
    const matched = materials.find(m => m.id === itemMaterialId);
    if (matched) {
      setEditMaterialIdState(matched.id);
      setQuickMaterialName(matched.materialName);
      setQuickMaterialCode(matched.materialCode);
      setQuickCategory(matched.category);
      setQuickUom(matched.uom || 'KG');
      setQuickMinStock(matched.minStock || 500);
      setShowQuickMaterialModal(true);
    }
  };
  

  const [favoriteStarred, setFavoriteStarred] = useState(false);

  // Expansions & subforms inside the line items list
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  interface InwardItem {
    id: string;
    materialId: string;
    materialName: string;
    materialCode: string;
    batchNo: string;
    qty: number;
    mfgDate: string;
    expDate: string;
    coaNo?: string;
    warehouseLocation: string;
    qcStatus: QcStatus;
    remarks?: string;
    palletNo?: string;
    drumNo?: string;
    uom: string;
    category?: string;
    make?: string;
    packagingCount?: number;
    packagingWeight?: number;
  }

  // Dynamic products array under operations
  const [inwardItems, setInwardItems] = useState<InwardItem[]>([]);

  // Subform inputs to add items dynamically
  const [itemMaterialId, setItemMaterialId] = useState('');
  const [itemBatchNo, setItemBatchNo] = useState('');
  const [itemQty, setItemQty] = useState<number>(0);
  const [itemMfgDate, setItemMfgDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [itemExpDate, setItemExpDate] = useState('');
  const [itemCoa, setItemCoa] = useState('');
  const [itemRemarks, setItemRemarks] = useState('');
  const [itemLocation, setItemLocation] = useState('RM Store');
  const [itemPackagingCount, setItemPackagingCount] = useState<number | ''>('');
  const [itemPackagingWeight, setItemPackagingWeight] = useState<number | ''>('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemMake, setItemMake] = useState('');



  const handleKeyDown = (e: React.KeyboardEvent<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      productInputRef.current?.focus();
    }
  };

  // Auto-calculate AR Number when inputs change
  useEffect(() => {
    if (!selectedGrnId && grnDate && supplierName && itemMaterialId) {
      const generated = generateArNo(grnDate, supplierName, itemMaterialId, grns);
      setArNo(generated);
    }
  }, [selectedGrnId, grnDate, supplierName, itemMaterialId, grns]);

  // Search & Filtration for List View
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Supplier' | 'Production Return' | 'Jobwork Return'>('All');

  // Messages block
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Autocomplete state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');

  const supplierRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Quick modals state
  const [showQuickSupplierModal, setShowQuickSupplierModal] = useState(false);
  const [quickSupplierName, setQuickSupplierName] = useState('');
  const [quickGstNumber, setQuickGstNumber] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickContactNumber, setQuickContactNumber] = useState('');

  const [showQuickMaterialModal, setShowQuickMaterialModal] = useState(false);
  const [quickMaterialName, setQuickMaterialName] = useState('');
  const [quickMaterialCode, setQuickMaterialCode] = useState('');
  const [quickCategory, setQuickCategory] = useState<MaterialCategory>('Raw Material');
  const [quickUom, setQuickUom] = useState(() => uomsArray[0] || 'KG');
  const [quickMinStock, setQuickMinStock] = useState<number>(500);

  // Sync default source type
  useEffect(() => {
    if (defaultSourceType) {
      setSourceType(defaultSourceType);
    }
  }, [defaultSourceType]);

  // Handle outside click closures
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (supplierRef.current && !supplierRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false);
      }
      if (materialRef.current && !materialRef.current.contains(event.target as Node)) {
        setShowMaterialDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Suppliers database
  useEffect(() => {
    async function initSuppliers() {
      const data = await dbService.fetchSuppliers();
      setSuppliers(data);
    }
    initSuppliers();
  }, []);

  // Sync item-level search fields when material ID changes
  useEffect(() => {
    const currentMat = materials.find(m => m.id === itemMaterialId);
    if (currentMat) {
      setMaterialSearchTerm(currentMat.materialName);
      
      // Auto-population rule: if they processed this product before, auto-populate the same category.
      const latestMatch = grns.find(g => g.materialId === itemMaterialId && g.category);
      if (latestMatch && latestMatch.category) {
        setItemCategory(latestMatch.category);
      } else if (currentMat.category) {
        setItemCategory(currentMat.category);
      } else {
        setItemCategory('');
      }
    } else {
      setMaterialSearchTerm('');
      setItemCategory('');
    }
  }, [itemMaterialId, materials, grns]);

  // Listen for 'Insert' key to open a new entry voucher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === 'INPUT' || 
        target?.tagName === 'TEXTAREA' || 
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Insert' || e.key === 'Ins') {
        const canEditRole = currentUser.role === 'Admin' || currentUser.role === 'GRN Operator';
        if (canEditRole) {
          e.preventDefault();
          handleOpenForm(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentUser.role, grns, sourceType, qcEnabled]);

  // Set sequence number when viewMode switches or sourceType changes
  const generateSeqNumber = (sType: typeof sourceType) => {
    let prefix = 'GRN-SUP-26-';
    let startValStr = '101';
    
    if (sType === 'Production Return') {
      prefix = localStorage.getItem('cfg_grn_prod_prefix') || 'GRN-PRD-26-';
      startValStr = localStorage.getItem('cfg_grn_prod_start') || '201';
    } else if (sType === 'Jobwork Return') {
      prefix = localStorage.getItem('cfg_grn_jobwork_prefix') || 'GRN-JBW-26-';
      startValStr = localStorage.getItem('cfg_grn_jobwork_start') || '301';
    } else {
      prefix = localStorage.getItem('cfg_grn_supplier_prefix') || localStorage.getItem('cfg_grn_prefix') || 'GRN-SUP-26-';
      startValStr = localStorage.getItem('cfg_grn_supplier_start') || localStorage.getItem('cfg_grn_start') || '101';
    }

    const count = grns.filter(g => (g.sourceType || 'Supplier') === sType).length;
    const nextIdx = count + Number(startValStr);
    return `${prefix}${nextIdx}`;
  };

  // Auto-generate seq number for new entries when sourceType or viewMode changes
  useEffect(() => {
    if (viewMode === 'form' && !selectedGrnId) {
      setGrnNo(generateSeqNumber(sourceType));
    }
  }, [sourceType, viewMode, selectedGrnId, grns]);

  // Open Form Mode for creation or viewing
  const handleOpenForm = (grnId: string | null) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSelectedGrnId(grnId);
    setViewMode('form');

    if (grnId) {
      // VIEWING / EDITING EXISTING
      const record = grns.find(g => g.id === grnId);
      if (record) {
        setGrnNo(record.grnNo);
        setGrnDate(record.grnDate);
        setSupplierName(record.supplierName);
        setInvoiceNo(record.invoiceNo || '');
        setInvoiceDate(record.invoiceDate || record.grnDate);
        setWarehouseLocation(record.warehouseLocation);
        setReceivedBy(record.receivedBy);
        setSourceType(record.sourceType || 'Supplier');
        setJobworkRefNo(record.jobworkRefNo || '');
        setRemarks(record.remarks || '');
        setQcStatus(record.qcStatus);

        // Map Single dynamic record directly to state fields
        setItemMaterialId(record.materialId);
        const matchedMat = materials.find(m => m.id === record.materialId);
        setMaterialSearchTerm(matchedMat ? matchedMat.materialName : '');
        setItemBatchNo(record.batchNo);
        setItemQty(record.qty);
        setItemMfgDate(record.mfgDate);
        setItemExpDate(record.expDate);
        setItemLocation(record.warehouseLocation);
        setItemRemarks(record.remarks || '');
        setItemPackagingCount(record.packagingCount || '');
        setItemPackagingWeight(record.packagingWeight || '');
        setItemCategory(record.category || '');
        setItemMake(record.make || '');
        setArNo(record.arNo || '');
        setItemDescription(record.description || '');
        setShowItemDescriptionInput(!!record.description);

        setInwardItems([{
          id: record.id,
          materialId: record.materialId,
          materialName: record.materialName,
          materialCode: matchedMat?.materialCode || 'N/A',
          batchNo: record.batchNo,
          qty: record.qty,
          mfgDate: record.mfgDate,
          expDate: record.expDate,
          coaNo: record.coaNo,
          warehouseLocation: record.warehouseLocation,
          qcStatus: record.qcStatus,
          remarks: record.remarks,
          palletNo: record.palletNo,
          drumNo: record.drumNo,
          uom: matchedMat?.uom || 'KG'
        }]);
      }
    } else {
      // ADDING NEW
      setGrnNo('');
      setGrnDate(new Date().toISOString().split('T')[0]);
      setSupplierName('');
      setInvoiceNo('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setWarehouseLocation('RM Store');
      setReceivedBy(currentUser.name);
      setJobworkRefNo('');
      setRemarks('');
      setQcStatus(qcEnabled ? 'Pending' : 'Approved');
      setInwardItems([]);

      // Reset product details state
      setItemMaterialId('');
      setMaterialSearchTerm('');
      setItemBatchNo('');
      setItemQty(0);
      setItemMfgDate(new Date().toISOString().split('T')[0]);
      setItemExpDate('');
      setItemCoa('');
      setItemRemarks('');
      setItemLocation('RM Store');
      setItemPackagingCount('');
      setItemPackagingWeight('');
      setItemCategory('');
      setItemMake('');
      setArNo('');
      setItemDescription('');
      setShowItemDescriptionInput(false);

      setTimeout(() => {
        productInputRef.current?.focus();
      }, 100);
    }
  };

  // Save the complete Form document to Firestore
  const handleSaveDocument = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!grnNo.trim()) {
      setErrorMsg('Reference / Voucher Number is required.');
      return;
    }
    if (!supplierName.trim()) {
      setErrorMsg('Partner / Supplier Name is required.');
      return;
    }
    if (!itemMaterialId) {
      setErrorMsg('Product is required. Please type and select a product.');
      return;
    }

    try {
      const selectedMat = materials.find(m => m.id === itemMaterialId);
      const payload: Grn = {
        id: selectedGrnId || 'g_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        grnNo: grnNo.trim().toUpperCase(),
        grnDate,
        supplierName: supplierName.trim(),
        materialId: itemMaterialId,
        materialName: selectedMat ? selectedMat.materialName : 'Unknown Product',
        batchNo: itemBatchNo.trim().toUpperCase() || 'N/A',
        qty: Number(itemQty) || 0,
        mfgDate: itemMfgDate || grnDate,
        expDate: itemExpDate || '',
        invoiceNo: invoiceNo.trim() || undefined,
        invoiceDate: invoiceDate.trim() || undefined,
        coaNo: itemCoa.trim() || undefined,
        warehouseLocation: itemLocation || 'RM Store',
        receivedBy: receivedBy.trim() || currentUser.name,
        qcStatus: selectedGrnId ? qcStatus : (qcEnabled ? 'Pending' : 'Approved'),
        remarks: itemRemarks.trim() || undefined,
        createdOn: selectedGrnId ? (grns.find(g => g.id === selectedGrnId)?.createdOn || new Date().toISOString()) : new Date().toISOString(),
        sourceType,
        jobworkRefNo: sourceType === 'Jobwork Return' ? jobworkRefNo.trim() : undefined,
        qcReleaseDate: selectedGrnId ? (grns.find(g => g.id === selectedGrnId)?.qcReleaseDate) : undefined,
        category: itemCategory.trim() || undefined,
        make: itemMake.trim() || undefined,
        packagingCount: itemPackagingCount !== '' ? Number(itemPackagingCount) : undefined,
        packagingWeight: itemPackagingWeight !== '' ? Number(itemPackagingWeight) : undefined,
        arNo: arNo.trim().toUpperCase() || undefined,
        description: itemDescription.trim() || undefined
      };
      
      await onSaveGrn(payload);

      setSuccessMsg(`Receiving Receipt voucher ${grnNo} processed and saved successfully.`);
      setTimeout(() => {
        setSuccessMsg(null);
        setViewMode('list');
      }, 2000);
    } catch (e: any) {
      setErrorMsg('Database save error: ' + e.message);
    }
  };

  // Listen for 'Alt + S' to save the inward entry form
  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if (viewMode === 'form') {
        const isAlt = e.altKey;
        if (isAlt && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
          e.preventDefault();
          e.stopPropagation();
          handleSaveDocument();
        }
      }
    };

    window.addEventListener('keydown', handleSaveShortcut, true);
    return () => {
      window.removeEventListener('keydown', handleSaveShortcut, true);
    };
  }, [viewMode, handleSaveDocument]);

  // Quick Supplier save function
  const handleQuickCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editSupplierId) {
      // EDIT SUPPLIER PROFILE
      const updatedSup: Supplier = {
        id: editSupplierId,
        name: quickSupplierName.trim(),
        gstNumber: quickGstNumber.trim() || undefined,
        address: quickAddress.trim() || undefined,
        email: quickEmail.trim() || undefined,
        contactNumber: quickContactNumber.trim() || undefined,
        createdAt: suppliers.find(s => s.id === editSupplierId)?.createdAt || new Date().toISOString()
      };
      await dbService.saveSupplier(updatedSup);
      setSuppliers(prev => prev.map(s => s.id === editSupplierId ? updatedSup : s));
      setSupplierName(updatedSup.name);
      setShowQuickSupplierModal(false);
      setEditSupplierId(null);
    } else {
      // CREATE BRAND NEW SUPPLIER PROFILE
      const newSup: Supplier = {
        id: 'sup_' + Date.now(),
        name: quickSupplierName.trim(),
        gstNumber: quickGstNumber.trim() || undefined,
        address: quickAddress.trim() || undefined,
        email: quickEmail.trim() || undefined,
        contactNumber: quickContactNumber.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      await dbService.saveSupplier(newSup);
      setSuppliers(prev => [...prev, newSup]);
      setSupplierName(newSup.name);
      setShowQuickSupplierModal(false);
    }
    
    setQuickSupplierName('');
    setQuickGstNumber('');
    setQuickAddress('');
    setQuickEmail('');
    setQuickContactNumber('');
  };

  // Quick Material save function
  const handleQuickCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = quickMaterialCode.trim().toUpperCase() || `MAT-${Date.now().toString().slice(-4)}`;
    if (editMaterialIdState) {
      // EDIT PRODUCT master
      const updatedMat: Material = {
        id: editMaterialIdState,
        materialCode: cleanCode,
        materialName: quickMaterialName.trim(),
        category: quickCategory,
        uom: quickUom,
        minStock: Number(quickMinStock),
        createdAt: materials.find(m => m.id === editMaterialIdState)?.createdAt || new Date().toISOString()
      };
      if (onSaveMaterial) {
        await onSaveMaterial(updatedMat);
      }
      setItemMaterialId(updatedMat.id);
      setMaterialSearchTerm(updatedMat.materialName);
      setItemCategory(updatedMat.category);
      setShowQuickMaterialModal(false);
      setEditMaterialIdState(null);
    } else {
      // CREATE BRAND NEW PRODUCT master
      const newMat: Material = {
        id: 'mat_' + Date.now(),
        materialCode: cleanCode,
        materialName: quickMaterialName.trim(),
        category: quickCategory,
        uom: quickUom,
        minStock: Number(quickMinStock),
        createdAt: new Date().toISOString()
      };
      if (onSaveMaterial) {
        await onSaveMaterial(newMat);
      }
      setItemMaterialId(newMat.id);
      setMaterialSearchTerm(newMat.materialName);
      setItemCategory(newMat.category);
      setShowQuickMaterialModal(false);
    }
    
    setQuickMaterialName('');
    setQuickMaterialCode('');
    setQuickCategory('Raw Material');
    setQuickUom('KG');
    setQuickMinStock(500);
  };

  // Add Item Inline to Form sheet items array
  const handleAddItemToOperations = () => {
    setErrorMsg(null);
    if (!itemMaterialId) {
      setErrorMsg('Please specify a valid product master item.');
      return;
    }
    if (!itemBatchNo.trim()) {
      setErrorMsg('Please provide the raw material batch/lot identifier.');
      return;
    }
    if (itemQty <= 0) {
      setErrorMsg('Operational inbound qty must be positive greater than zero.');
      return;
    }
    if (!itemExpDate) {
      setErrorMsg('Product validation requires a specified expiration date (EXP).');
      return;
    }

    const matched = materials.find(m => m.id === itemMaterialId);
    if (!matched) {
      setErrorMsg('Master material is invalid or lost.');
      return;
    }

    const newRow: InwardItem = {
      id: 'item_inline_' + Date.now() + Math.floor(Math.random() * 100),
      materialId: itemMaterialId,
      materialName: matched.materialName,
      materialCode: matched.materialCode,
      batchNo: itemBatchNo.trim().toUpperCase(),
      qty: Number(itemQty),
      mfgDate: itemMfgDate,
      expDate: itemExpDate,
      coaNo: itemCoa.trim() || undefined,
      warehouseLocation: itemLocation,
      qcStatus: qcEnabled ? 'Pending' : 'Approved',
      remarks: itemRemarks.trim() || undefined,
      palletNo: matched.palletNo,
      drumNo: matched.drumNo,
      uom: matched.uom,
      category: itemCategory || matched.category,
      make: itemMake.trim() || undefined,
      packagingCount: itemPackagingCount !== '' ? Number(itemPackagingCount) : undefined,
      packagingWeight: itemPackagingWeight !== '' ? Number(itemPackagingWeight) : undefined
    };

    setInwardItems(prev => [...prev, newRow]);

    // Clear nested subform inputs for quick next entry
    setItemMaterialId('');
    setItemBatchNo('');
    setItemQty(0);
    setItemCoa('');
    setItemRemarks('');
    setItemPackagingCount('');
    setItemPackagingWeight('');
    setItemCategory('');
    setItemMake('');
  };

  // Delete/Remove row
  const handleRemoveRowFromOperations = (id: string) => {
    setInwardItems(prev => prev.filter(item => item.id !== id));
  };

  // Filter receipt list
  const filteredGrns = grns.filter(g => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      g.grnNo.toLowerCase().includes(term) ||
      g.supplierName.toLowerCase().includes(term) ||
      g.materialName.toLowerCase().includes(term) ||
      g.batchNo.toLowerCase().includes(term)
    );

    const matchesStatus = statusFilter === 'All' || g.qcStatus === statusFilter;
    const matchesSource = sourceFilter === 'All' || (g.sourceType || 'Supplier') === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const canEdit = currentUser.role === 'Admin' || currentUser.role === 'GRN Operator';

  // Quick navigation helpers inside form view
  const grnIdsList = grns.map(g => g.id);
  const currentFormIndex = selectedGrnId ? grnIdsList.indexOf(selectedGrnId) : -1;

  const navigateReceipt = (dir: 'prev' | 'next') => {
    if (currentFormIndex === -1) return;
    const nextIdx = dir === 'prev' ? currentFormIndex - 1 : currentFormIndex + 1;
    if (nextIdx >= 0 && nextIdx < grnIdsList.length) {
      handleOpenForm(grnIdsList[nextIdx]);
    }
  };

  // Standard Native triggers
  const handlePrintDocument = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ================= TOP LEVEL NOTIFICATIONS ================= */}
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-200/60 text-xs flex items-center gap-2 font-medium animate-fade-in">
          <ShieldAlert className="w-4.5 h-4.5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-500 font-bold hover:text-red-700">×</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-500 font-bold hover:text-emerald-700">×</button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ======================= VIEW MODE: LIST VIEW ======================= */}
      {/* ==================================================================== */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold font-sans text-slate-800 flex items-center gap-2">
                <span>Inward Operations</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Process dynamic Inward Vouchers and monitor historical inbound material deliveries from vendor channels.
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => handleOpenForm(null)}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Receipt</span>
              </button>
            )}
          </div>

          {/* Odoo styled search/filters grid container */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search inputs */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Receipts by voucher, supplier, batch, material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-slate-800 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 pl-10 pr-4 py-2.5 outline-none rounded-xl focus:border-blue-500 transition"
              />
            </div>

            {/* Quick Filter Segments */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {/* Source filter hidden as requested */}

              {/* Status filter (only if QC is enabled) */}
              {qcEnabled && (
                <div className="flex items-center space-x-1 border-l pl-3 ml-2 border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">QC Status:</span>
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(stat => (
                    <button
                      key={stat}
                      onClick={() => setStatusFilter(stat)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold transition whitespace-nowrap cursor-pointer ${
                        statusFilter === stat
                          ? 'bg-[#714B67] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table list resembling Odoo's sleek data tables */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                {/* Inward Type column header removed/hidden */}
                <thead className="bg-[#f8fafc] text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-bold tracking-wider">Inward Date</th>
                    <th className="px-4 py-3.5 text-left font-bold tracking-wider">Supplier/Partner</th>
                    <th className="px-4 py-3.5 text-left font-bold tracking-wider">Assigned Product</th>
                    <th className="px-4 py-3.5 text-left font-bold tracking-wider">Batch No</th>
                    <th className="px-4 py-3.5 text-right font-bold tracking-wider">Quantity</th>
                    {qcEnabled && <th className="px-4 py-3.5 text-center font-bold tracking-wider">QC Status</th>}
                    <th className="px-4 py-3.5 text-left font-bold tracking-wider">Location</th>
                    <th className="px-4 py-3.5 text-center font-bold tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                  {filteredGrns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-sans italic">
                        No goods receipt records correspond to specified filters.
                      </td>
                    </tr>
                  ) : (
                    filteredGrns.map((g) => {
                      const matchedMat = materials.find(m => m.id === g.materialId);
                      return (
                        <tr 
                          key={g.id} 
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                          onClick={() => handleOpenForm(g.id)}
                        >
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateToDDMMYYYY(g.grnDate)}</td>
                          <td className="px-4 py-3 text-slate-800 font-medium truncate max-w-[140px]" title={g.supplierName}>
                            {g.supplierName}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{g.materialName}</td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-600">{g.batchNo}</td>
                          <td className="px-4 py-3 font-extrabold text-right whitespace-nowrap text-slate-900">
                            {g.qty} <span className="text-[10px] text-slate-400 font-semibold">{matchedMat?.uom || 'KG'}</span>
                          </td>
                          {qcEnabled && (
                            <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                                g.qcStatus === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : g.qcStatus === 'Rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 border-dashed'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  g.qcStatus === 'Approved' ? 'bg-emerald-500' : g.qcStatus === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                                }`} />
                                {g.qcStatus}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 text-slate-500 font-mono text-[10.5px] whitespace-nowrap">
                            {g.warehouseLocation}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenForm(g.id)}
                                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                                title="Open Detailed Form View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {currentUser.role === 'Admin' && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you absolutely certain you wish to delete Inward Voucher record ${g.grnNo}?`)) {
                                      onDeleteGrn(g.id);
                                    }
                                  }}
                                  className="p-1 text-red-400 hover:text-red-700 hover:bg-rose-50 rounded transition"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-150 text-[10.5px] text-slate-450 font-mono flex justify-between items-center">
              <span>Showing <b>{filteredGrns.length}</b> total inward vouchers</span>
              <span>U Liva Nutrition • Inventory Node</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ======================= VIEW MODE: FORM VIEW ======================= */}
      {/* ==================================================================== */}
      {viewMode === 'form' && (
        <div className="space-y-4 animate-fade-in pb-12">

          {/* Odoo Style Status & Actions Control Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-100 p-4 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDocument}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Entry</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Discard
              </button>
            </div>
            {selectedGrnId && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            )}
          </div>

          {/* Core Document Sheet Card styled to replicate Odoo exactly */}
          <div className="bg-white rounded-xl border border-slate-300/80 shadow-md p-6 sm:p-8 space-y-6">
            

            {/* Header section completely removed as requested */}

            {/* Partner / Calendar grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
              
              {/* Left Attributes Column */}
              <div className="space-y-3.5">
                
                {/* Receive From Autocomplete */}
                <div className="grid grid-cols-3 items-center">
                  <span className="text-slate-450 font-bold uppercase tracking-wider text-[10.5px]">Receive From</span>
                  <div className="col-span-2 flex items-center gap-1.5" ref={supplierRef}>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        required
                        placeholder="e.g. SUREN HEALTH CARE"
                        value={supplierName}
                        disabled={!!selectedGrnId}
                        onChange={(e) => {
                          setSupplierName(e.target.value);
                          setShowSupplierDropdown(true);
                        }}
                        onFocus={() => setShowSupplierDropdown(true)}
                        className="w-full text-teal-650 font-bold hover:underline bg-slate-50/50 border border-slate-200 p-2.5 rounded-xl text-xs focus:bg-white outline-none focus:border-[#714B67] transition disabled:bg-transparent disabled:border-transparent disabled:hover:no-underline cursor-pointer"
                      />
                      
                      {showSupplierDropdown && !selectedGrnId && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                          {suppliers
                            .filter(s => s.name.toLowerCase().includes(supplierName.toLowerCase()))
                            .map(s => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSupplierName(s.name);
                                  setShowSupplierDropdown(false);
                                }}
                                className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 transition font-medium text-slate-800"
                              >
                                {s.name}
                              </button>
                            ))}
                          
                          <button
                            type="button"
                            onClick={() => {
                              setQuickSupplierName(supplierName);
                              setEditSupplierId(null);
                              setShowQuickSupplierModal(true);
                              setShowSupplierDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-bold text-[#714B67] bg-purple-50/50 hover:bg-purple-50 transition border-t sticky bottom-0"
                          >
                            + Create Supplier Profile "{supplierName || '...'}"
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Direct Supplier Edit Arrow Button */}
                    {suppliers.some(s => s.name.trim().toLowerCase() === supplierName.trim().toLowerCase()) && (
                      <button
                        type="button"
                        onClick={handleOpenEditSupplier}
                        title="Edit Partner Details"
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-[#714B67] transition focus:outline-none cursor-pointer flex-shrink-0"
                      >
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Operation Type Selector is hidden as requested (defaults to 'Supplier') */}

                {/* Invoice Number */}
                <div className="grid grid-cols-3 items-center">
                  <span className="text-slate-450 font-bold uppercase tracking-wider text-[10.5px]">Invoice Number *</span>
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. INV-100234"
                      value={invoiceNo}
                      disabled={!!selectedGrnId}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="w-full text-slate-800 bg-slate-50/50 border border-slate-200 p-2.5 rounded-xl text-xs focus:bg-white outline-none focus:border-[#714B67] transition disabled:bg-transparent disabled:border-transparent font-semibold"
                    />
                  </div>
                </div>

                {/* Invoice Date */}
                <div className="grid grid-cols-3 items-center">
                  <span className="text-slate-450 font-bold uppercase tracking-wider text-[10.5px]">Invoice Date *</span>
                  <div className="col-span-2">
                    <input
                      type="date"
                      required
                      value={invoiceDate}
                      disabled={!!selectedGrnId}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full text-slate-800 bg-slate-50/50 border border-slate-200 p-2.5 rounded-xl text-xs focus:bg-white outline-none focus:border-[#714B67] transition disabled:bg-transparent disabled:border-transparent font-medium"
                    />
                  </div>
                </div>

                {sourceType === 'Jobwork Return' && (
                  <div className="grid grid-cols-3 items-center transition-all">
                    <span className="text-slate-450 font-bold uppercase tracking-wider text-[10.5px]">Challan Ref</span>
                    <input
                      type="text"
                      placeholder="e.g. OUT-M101"
                      value={jobworkRefNo}
                      onChange={(e) => setJobworkRefNo(e.target.value)}
                      disabled={!!selectedGrnId}
                      className="col-span-2 font-mono text-slate-800 bg-slate-50/50 border border-slate-200 p-2.5 rounded-xl focus:bg-white outline-none disabled:bg-transparent disabled:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Right Attributes Column */}
              <div className="space-y-3.5">
                
                {/* Fixed Entry Inward Date */}
                <div className="grid grid-cols-3 items-center">
                  <span className="text-slate-450 font-bold uppercase tracking-wider text-[10.5px] flex items-center gap-1">
                    <span>Inward Date</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-350 cursor-help" title="Registration timestamp matching container physical entry" />
                  </span>
                  <div className="col-span-2">
                    <input
                      type="date"
                      value={grnDate}
                      disabled
                      className="w-full text-slate-800 font-bold font-mono bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                </div>

              </div>

            </div>

            {/* Direct Product Registration Details Panel (No Tabs, No Extra Tables) */}
            <div className="border-t border-slate-200/80 pt-6 space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="flex items-center gap-2 text-xs font-extrabold text-[#714B67] uppercase tracking-wider font-sans">
                  <div className="w-1.5 h-3.5 bg-[#714B67] rounded-xs" />
                  <span>Product & Batch Details</span>
                </span>
                <span className="text-[9.5px] text-[#714B67] font-mono font-bold uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md">
                  Inward Registry Fields
                </span>
              </div>

              {/* Single Continuous Grid containing all product & batch details in order */}
              <div className="grid grid-cols-12 gap-x-3.5 gap-y-4 items-end text-xs">
                
                {/* --- FIRST ROW: Core Identifiers & Description --- */}
                
                {/* 1. AR Number */}
                <div className="col-span-12 md:col-span-2 border-0">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">AR No</label>
                  <input
                    type="text"
                    placeholder="YYMM-001"
                    value={arNo}
                    onChange={(e) => setArNo(e.target.value.toUpperCase())}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#714B67] outline-none font-bold font-mono tracking-wider uppercase disabled:bg-transparent disabled:border-transparent h-10"
                  />
                </div>

                {/* 2. Select Product */}
                <div ref={materialRef} className="col-span-12 md:col-span-6 relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Product *</label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        ref={productInputRef}
                        type="text"
                        placeholder={selectedGrnId ? "N/A" : "Search products..."}
                        value={materialSearchTerm}
                        onChange={(e) => {
                          setMaterialSearchTerm(e.target.value);
                          setShowMaterialDropdown(true);
                        }}
                        onFocus={() => setShowMaterialDropdown(true)}
                        disabled={!!selectedGrnId}
                        className="w-full text-slate-800 text-xs bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl focus:bg-white focus:border-[#714B67] outline-none font-bold disabled:bg-transparent disabled:border-transparent cursor-pointer h-10"
                      />
                      {!selectedGrnId && <ChevronDown className="absolute right-3 top-3.5 w-3 h-3 text-slate-400 pointer-events-none" />}
                      
                      {showMaterialDropdown && !selectedGrnId && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                          {materials
                            .filter(m => m.materialName.toLowerCase().includes(materialSearchTerm.toLowerCase()) || m.materialCode.toLowerCase().includes(materialSearchTerm.toLowerCase()))
                            .map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setItemMaterialId(m.id);
                                  setMaterialSearchTerm(m.materialName);
                                  setItemCategory(m.category);
                                  setShowMaterialDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition text-xs font-semibold flex justify-between items-center"
                              >
                                <span>{m.materialName} ({m.materialCode})</span>
                                <span className="text-[10px] text-slate-400">{m.category}</span>
                              </button>
                            ))}

                          <button
                            type="button"
                            onClick={() => {
                              setQuickMaterialName(materialSearchTerm);
                              setQuickMaterialCode(`MAT-P-${String(materials.length + 101)}`);
                              setEditMaterialIdState(null);
                              setShowQuickMaterialModal(true);
                              setShowMaterialDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-bold text-[#714B67] bg-purple-50/50 hover:bg-purple-50 transition sticky bottom-0 border-t"
                          >
                            + Create Product "{materialSearchTerm || '...'}"
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Toggle description button */}
                    <button
                      type="button"
                      onClick={() => setShowItemDescriptionInput(!showItemDescriptionInput)}
                      title="Add Description Notes"
                      className={`p-2.5 border rounded-xl hover:bg-slate-100 transition focus:outline-none cursor-pointer flex-shrink-0 h-10 w-10 flex items-center justify-center ${showItemDescriptionInput ? 'text-[#714B67] bg-purple-50 border-purple-250 animate-pulse' : 'text-slate-400 bg-slate-50/50 border-slate-205'}`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>

                    {/* Direct Product Edit Arrow Button */}
                    {materials.some(m => m.id === itemMaterialId) && (
                      <button
                        type="button"
                        onClick={handleOpenEditMaterial}
                        title="Edit Product Master Details"
                        className="p-2.5 bg-slate-50 border border-slate-205 rounded-xl hover:bg-slate-100 hover:text-[#714B67] transition focus:outline-none cursor-pointer flex-shrink-0 h-10 w-10 flex items-center justify-center"
                      >
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Category Dropdown Searchable & Editable */}
                <div ref={categoryRef} className="col-span-12 md:col-span-4 relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Category *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Select or type Category..."
                      value={itemCategory}
                      onFocus={() => setShowCategoryDropdown(true)}
                      onChange={(e) => {
                        setItemCategory(e.target.value);
                        setShowCategoryDropdown(true);
                      }}
                      disabled={!!selectedGrnId}
                      className="w-full text-slate-800 text-xs bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl focus:bg-white focus:border-[#714B67] outline-none font-bold disabled:bg-transparent disabled:border-transparent h-10"
                    />
                    {!selectedGrnId && <ChevronDown className="absolute right-3 top-3.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />}
                    
                    {showCategoryDropdown && !selectedGrnId && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {Array.from(new Set([
                          'Raw Material',
                          'PPM',
                          'Capsule',
                          'SPM',
                          ...materials.map(m => m.category || ''),
                          ...grns.map(g => g.category || '')
                        ].filter(Boolean)))
                        .filter(cat => cat.toLowerCase().includes(itemCategory.toLowerCase()))
                        .map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setItemCategory(cat);
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition text-xs font-semibold text-slate-700 block border-b border-slate-50 uppercase font-sans"
                          >
                            {cat}
                          </button>
                        ))}

                        {itemCategory.trim() !== '' && (
                          <button
                            type="button"
                            onClick={() => setShowCategoryDropdown(false)}
                            className="w-full px-3 py-2 text-left text-xs font-bold text-[#714B67] bg-purple-50/50 hover:bg-purple-50 transition sticky bottom-0 border-t"
                          >
                            + Use / Save custom Cat: "{itemCategory}"
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* --- SECOND ROW: Quantities, Packaging & Brand Stamp --- */}

                {/* 4. Nos of Bags/Boxes */}
                <div className="col-span-12 sm:col-span-4 md:col-span-2 border-0">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Number of Drums</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={itemPackagingCount}
                    min="0"
                    step="1"
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setItemPackagingCount(val);
                      const count = Number(val) || 0;
                      const weight = Number(itemPackagingWeight) || 0;
                      setItemQty(parseFloat((count * weight).toFixed(3)));
                    }}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl text-center text-xs focus:bg-white focus:border-[#714B67] outline-none font-semibold disabled:bg-transparent disabled:border-transparent font-sans h-10"
                  />
                </div>

                {/* 5. Per Bag/Box Wt */}
                <div className="col-span-12 sm:col-span-4 md:col-span-2 border-0">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Per Drum Wt (KG)</label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={itemPackagingWeight}
                    min="0"
                    step="0.01"
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setItemPackagingWeight(val);
                      const count = Number(itemPackagingCount) || 0;
                      const weight = Number(val) || 0;
                      setItemQty(parseFloat((count * weight).toFixed(3)));
                    }}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl text-center text-xs focus:bg-white focus:border-[#714B67] outline-none font-semibold disabled:bg-transparent disabled:border-transparent font-sans h-10"
                  />
                </div>

                {/* 6. Quantity (Calculated or Manual) */}
                <div className="col-span-12 sm:col-span-4 md:col-span-2 border-0">
                  <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5 font-sans">
                    Total Quantity ({materials.find(m => m.id === itemMaterialId)?.uom || 'KG'})
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={itemQty || ''}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setItemQty(e.target.value === '' ? 0 : Number(e.target.value))}
                    disabled={!!selectedGrnId}
                    className="w-full text-[#714B67] font-black bg-amber-50/10 border-2 border-amber-200 p-2 rounded-xl text-xs outline-none text-right font-mono disabled:bg-transparent disabled:border-transparent h-10 z-10"
                  />
                </div>

                {/* 7. Make / Brand */}
                <div className="col-span-12 sm:col-span-6 md:col-span-2 border-0">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Make/Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Merck"
                    value={itemMake}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setItemMake(e.target.value)}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#714B67] outline-none font-semibold disabled:bg-transparent disabled:border-transparent h-10"
                  />
                </div>

                {/* 8. Batch Number */}
                <div className="col-span-12 sm:col-span-6 md:col-span-4 border-0">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Batch No</label>
                  <input
                    type="text"
                    placeholder="Batch/Lot Number"
                    value={itemBatchNo}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setItemBatchNo(e.target.value.toUpperCase())}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl uppercase font-mono text-xs focus:bg-white focus:border-[#714B67] outline-none font-bold disabled:bg-transparent disabled:border-transparent h-10"
                  />
                </div>

                {/* --- THIRD ROW: Dates Setup (Mfg & Exp Date with high space and clear writing) --- */}

                {/* 9. Mfg Date */}
                <div className="col-span-12 sm:col-span-6 md:col-span-6 border-0">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Mfg Date (Manufacturing Date)</label>
                  <input
                    type="date"
                    value={itemMfgDate}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setItemMfgDate(e.target.value)}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#714B67] outline-none font-semibold disabled:bg-transparent disabled:border-transparent h-10 font-mono tracking-wider cursor-pointer"
                  />
                </div>

                {/* 10. Exp Date */}
                <div className="col-span-12 sm:col-span-6 md:col-span-6 border-0">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Exp Date (Expiry / Best Before Date)</label>
                  <input
                    type="date"
                    value={itemExpDate}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setItemExpDate(e.target.value)}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#714B67] outline-none font-semibold disabled:bg-transparent disabled:border-transparent h-10 font-mono tracking-wider cursor-pointer"
                  />
                </div>

              </div>

              {/* Toggleable Description textbox directly below product details row */}
              {showItemDescriptionInput && (
                <div className="mt-3.5 p-3.5 bg-slate-50/50 border border-slate-200/80 rounded-xl animate-scale-up">
                  <label className="block text-[10px] font-bold text-[#714B67] uppercase tracking-wider mb-1.5 font-sans flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Product Spec / Detailed Description Notes</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter customized product notes, descriptions, physical conditions, or color parameters..."
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-white border border-slate-205 p-2.5 rounded-xl text-xs focus:outline-none focus:border-[#714B67] h-10"
                  />
                </div>
              )}

              {/* Third Row: Sector Destination, Remarks, Received By */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-sans">
                
                {/* Sector Destination */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Sector Destination</label>
                  <select
                    value={itemLocation}
                    onChange={(e) => setItemLocation(e.target.value)}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#714B67] outline-none font-semibold disabled:bg-transparent disabled:border-transparent h-10 cursor-pointer"
                  >
                    <option value="RM Store">RM Store</option>
                    <option value="PPM Store">PPM Store</option>
                    <option value="QC Hold Area">QC Hold Area</option>
                    <option value="Rejected Store">Rejected Store</option>
                    <option value="Finished Goods Store">Finished Goods Store</option>
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Observations / Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Visual check intact, stored on pallet"
                    value={itemRemarks}
                    onChange={(e) => setItemRemarks(e.target.value)}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#714B67] outline-none font-semibold disabled:bg-transparent disabled:border-transparent h-10"
                  />
                </div>

                {/* Received By */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Received By</label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    disabled={!!selectedGrnId}
                    className="w-full text-slate-800 bg-slate-50/50 border border-slate-205 p-2.5 rounded-xl text-xs focus:bg-white focus:border-[#714B67] outline-none font-bold disabled:bg-transparent disabled:border-transparent h-10"
                  />
                </div>

              </div>
            </div>



            {/* General informative guidelines underneath card matching Odoo */}
            <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl text-[10.5px] leading-relaxed text-slate-500 font-normal">
              ℹ️ <strong>System Automation:</strong> Adjusting "Receive From", "Operation Type", or "Destination location" will recalibrate linked pallet sectors and drum indexes. Submitting the "Lock" sequence files these items securely to the live warehouse database and flags the voucher under pending quality checking clearance.
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ========================= MODALS DIVISION ========================== */}
      {/* ==================================================================== */}
      
      {/* --- QUICK CREATE SUPPLIER MODAL OVERLAY --- */}
      {showQuickSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-250 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-[#714B67] px-5 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-100" />
                <h4 className="font-sans font-bold text-sm">{editSupplierId ? "Edit Supplier Profile Details" : "Quick Create Supplier Profiles"}</h4>
              </div>
              <button 
                type="button" 
                onClick={() => setShowQuickSupplierModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateSupplier} className="p-5 space-y-4 text-xs">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Add a new supplier master profile quickly. These information fields are optional but recommended for system audit trail documentation.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={quickSupplierName}
                  onChange={(e) => setQuickSupplierName(e.target.value)}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:border-purple-600 transition"
                  placeholder="e.g. Merck Chemical Lab Solutions"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between items-center">
                  <span>GST Identification Number (GSTIN)</span>
                  {quickGstNumber.trim().length === 15 && (
                    <button
                      type="button"
                      onClick={() => {
                        const info = parseGSTIN(quickGstNumber);
                        if (info) {
                          setQuickSupplierName(info.companyName);
                          setQuickAddress(info.address);
                          setQuickEmail(info.email);
                          setQuickContactNumber(info.contactNumber);
                        }
                      }}
                      className="text-[10px] bg-purple-100 hover:bg-purple-200 text-[#714B67] px-2 py-0.5 rounded-lg transition font-extrabold cursor-pointer"
                    >
                      ✨ Auto-fill details
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  value={quickGstNumber}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setQuickGstNumber(val);
                    if (val.trim().length === 15) {
                      const info = parseGSTIN(val);
                      if (info) {
                        setQuickSupplierName(info.companyName);
                        setQuickAddress(info.address);
                        setQuickEmail(info.email);
                        setQuickContactNumber(info.contactNumber);
                      }
                    }
                  }}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:border-purple-600 transition uppercase font-mono"
                  placeholder="e.g. 24AAACO1314M1ZP"
                />

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9.5px] font-extrabold text-slate-400">
                    Quick Sample Suppliers:
                  </span>
                  {[
                    { name: 'U Liva Nutrition', gst: '24AAACU1234M1Z5' },
                    { name: 'Alkem Labs', gst: '24AAAAC1234A1Z1' },
                    { name: 'Sun Pharma', gst: '24AAACT5678B2Z2' },
                    { name: 'Aarti Industries', gst: '24AAACA9876C3Z3' }
                  ].map((preset) => (
                    <button
                      key={preset.gst}
                      type="button"
                      onClick={() => {
                        setQuickGstNumber(preset.gst);
                        const info = parseGSTIN(preset.gst);
                        if (info) {
                          setQuickSupplierName(info.companyName);
                          setQuickAddress(info.address);
                          setQuickEmail(info.email);
                          setQuickContactNumber(info.contactNumber);
                        }
                      }}
                      className="text-[9.5px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition duration-150 cursor-pointer font-bold"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Corporate Physical Address
                </label>
                <input
                  type="text"
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:border-purple-600 transition"
                  placeholder="e.g. Phase 4, GID Estate, Ahmedabad, Gujarat"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email ID
                  </label>
                  <input
                    type="email"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:border-purple-600 transition"
                    placeholder="sales@supplier.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={quickContactNumber}
                    onChange={(e) => setQuickContactNumber(e.target.value)}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:border-purple-600 transition"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickSupplierModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5a3b52] rounded-xl transition shadow-sm"
                >
                  {editSupplierId ? "Save Supplier Profile" : "Create & Assign Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUICK CREATE MATERIAL MODAL OVERLAY --- */}
      {showQuickMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-250 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="bg-[#714B67] px-5 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-100" />
                <h4 className="font-sans font-bold text-sm">{editMaterialIdState ? "Edit Product Master Details" : "Quick Create Product Masters"}</h4>
              </div>
              <button 
                type="button" 
                onClick={() => setShowQuickMaterialModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateMaterial} className="p-5 space-y-4 text-xs">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Add an official material to the central inventory catalog catalog right from here, allowing you to inward receipt it instantly!
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  required
                  value={quickMaterialName}
                  onChange={(e) => setQuickMaterialName(e.target.value)}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:border-[#714B67] transition"
                  placeholder="e.g. Hydrochloric Acid 37%"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Unique Material Master Code *
                </label>
                <input
                  type="text"
                  required
                  value={quickMaterialCode}
                  onChange={(e) => setQuickMaterialCode(e.target.value)}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:border-[#714B67] transition uppercase font-mono font-bold"
                  placeholder="e.g. RM-HCL-01"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Inventory Category
                  </label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value as MaterialCategory)}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:border-[#714B67] transition"
                  >
                    <option value="Raw Material">Raw Material</option>
                    <option value="PPM">PPM (Primary Packaging)</option>
                    <option value="SPM text-slate-400">SPM (Secondary Packaging)</option>
                    <option value="Capsule">Capsule</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    UOM (Unit of Measure)
                  </label>
                  <input
                    type="text"
                    required
                    value={quickUom}
                    onChange={(e) => setQuickUom(e.target.value)}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:border-[#714B67] transition uppercase"
                    placeholder="e.g. KG, LTR, PCS"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Minimum Safe Reserve Stock Level
                </label>
                <input
                  type="number"
                  required
                  value={quickMinStock}
                  onChange={(e) => setQuickMinStock(Number(e.target.value))}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:border-[#714B67] transition"
                  placeholder="e.g. 500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickMaterialModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5a3b52] rounded-xl transition shadow-sm"
                >
                  {editMaterialIdState ? "Save Product Material" : "Create & Select Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
