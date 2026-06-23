import React, { useState, useEffect } from 'react';
import { Grn, Material, User, Outward } from '../types';
import { 
  FileUp, 
  Search, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Boxes, 
  ArrowUpRight, 
  Clock, 
  UserSquare, 
  Calendar,
  AlertCircle,
  Edit,
  Plus,
  ArrowLeft,
  X,
  FileText,
  Workflow,
  ClipboardList
} from 'lucide-react';

interface OutwardTabProps {
  materials: Material[];
  grns: Grn[];
  outwards: Outward[];
  onSaveOutward: (outward: Outward) => void;
  onDeleteOutward: (id: string) => void;
  currentUser: User;
  defaultOutwardType?: 'Trial' | 'Sample' | 'Commercial Use';
}

export default function OutwardTab({ 
  materials, 
  grns, 
  outwards, 
  onSaveOutward, 
  onDeleteOutward, 
  currentUser,
  defaultOutwardType
}: OutwardTabProps) {
  const isViewer = currentUser.role === 'Viewer';
  const isQcOnly = currentUser.role === 'QC Operator';
  const cannotIssue = isViewer || isQcOnly;

  // Navigation State (Odoo style: 'list' or 'form')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [selectedOutwardId, setSelectedOutwardId] = useState<string | null>(null);
  const [activeSheetTab, setActiveSheetTab] = useState<'operations' | 'additional_info' | 'notes'>('operations');

  // Form states
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectedBatchNo, setSelectedBatchNo] = useState('');
  const [qtyToIssue, setQtyToIssue] = useState<number | ''>('');
  const [department, setDepartment] = useState('Production Use');
  const [outwardType, setOutwardType] = useState<'Trial' | 'Sample' | 'Commercial Use'>(() => {
    return defaultOutwardType || 'Commercial Use';
  });
  const [outwardDate, setOutwardDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  
  // Jobwork-specific form states
  const [jobworkVendorName, setJobworkVendorName] = useState('');
  const [jobworkDocNo, setJobworkDocNo] = useState('');
  const [jobworkPackingType, setJobworkPackingType] = useState('Box');
  const [jobworkPackingQty, setJobworkPackingQty] = useState<number | ''>('');
  
  // Filtering & search
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Status/Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingOutwardId, setEditingOutwardId] = useState<string | null>(null);

  // MULTI-MATERIAL DISPATCH ITEMS LIST
  const [outwardItems, setOutwardItems] = useState<{
    id: string;
    materialId: string;
    materialName: string;
    batchNo: string;
    qty: number;
    remarks?: string;
  }[]>([]);

  // Sequence Outward Number
  const [outwardNo, setOutwardNo] = useState('');

  // Date Formatter Helper
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

  useEffect(() => {
    if (defaultOutwardType) {
      setOutwardType(defaultOutwardType);
    }
  }, [defaultOutwardType]);

  // Listen for 'Insert' key to open a new inward entry voucher
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
        if (!cannotIssue) {
          e.preventDefault();
          handleCreateNew();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cannotIssue, outwards, outwardType, viewMode]);

  useEffect(() => {
    if (viewMode === 'form' && !selectedOutwardId && !editingOutwardId) {
      let prefix = 'OUT-COM-26-';
      let startValStr = '601';

      if (outwardType === 'Trial') {
        prefix = localStorage.getItem('cfg_outward_trial_prefix') || 'OUT-TRL-26-';
        startValStr = localStorage.getItem('cfg_outward_trial_start') || '401';
      } else if (outwardType === 'Sample') {
        prefix = localStorage.getItem('cfg_outward_sample_prefix') || 'OUT-SMP-26-';
        startValStr = localStorage.getItem('cfg_outward_sample_start') || '501';
      } else {
        prefix = localStorage.getItem('cfg_outward_comm_prefix') || localStorage.getItem('cfg_issue_prefix') || 'OUT-COM-26-';
        startValStr = localStorage.getItem('cfg_outward_comm_start') || localStorage.getItem('cfg_issue_start') || '601';
      }

      const count = outwards.filter(o => (o.outwardType || 'Commercial Use') === outwardType).length;
      const nextIdx = count + Number(startValStr);
      setOutwardNo(`${prefix}${String(nextIdx)}`);
    }
  }, [outwards, outwardType, viewMode, selectedOutwardId, editingOutwardId]);

  // Approved batches
  const approvedGrns = grns.filter(g => g.qcStatus === 'Approved');

  // Compute stock levels
  const getBatchStockDetails = (mId: string) => {
    const materialGrns = approvedGrns.filter(g => g.materialId === mId);
    
    return materialGrns.map(g => {
      const issuedQty = outwards
        .filter(o => o.materialId === mId && o.batchNo === g.batchNo)
        .reduce((sum, curr) => sum + curr.qty, 0);

      const availableQty = Math.max(0, g.qty - issuedQty);
      const isExpired = g.expDate ? new Date(g.expDate).getTime() < new Date().getTime() : false;
      const daysLeft = g.expDate 
        ? Math.ceil((new Date(g.expDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
        : 999;

      return {
        grn: g,
        availableQty,
        isExpired,
        daysLeft
      };
    }).filter(b => b.availableQty > 0); 
  };

  // State triggered batch options
  const activeBatchesInStock = selectedMaterialId ? getBatchStockDetails(selectedMaterialId) : [];

  // Sort batches by Expiry ascending (FEFO)
  const sortedBatchesByExpiry = [...activeBatchesInStock].sort((a, b) => {
    if (!a.grn.expDate) return 1;
    if (!b.grn.expDate) return -1;
    return new Date(a.grn.expDate).getTime() - new Date(b.grn.expDate).getTime();
  });

  const selectedBatchDetails = selectedBatchNo 
    ? sortedBatchesByExpiry.find(b => b.grn.batchNo === selectedBatchNo) 
    : null;

  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterialId(materialId);
    setSelectedBatchNo('');
    setQtyToIssue('');
  };

  const handleBatchChange = (batchNo: string) => {
    setSelectedBatchNo(batchNo);
    setQtyToIssue('');
  };

  // Add individual materials on click to the sub-table outward list
  const handleAddItemToList = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedMaterialId) {
      setErrorMsg('Please select a material group first.');
      return;
    }
    if (!selectedBatchNo) {
      setErrorMsg('Please select an active approved batch to issue.');
      return;
    }
    if (!qtyToIssue || Number(qtyToIssue) <= 0) {
      setErrorMsg('Please enter a valid, positive quantity to issue.');
      return;
    }

    const matchedBatch = sortedBatchesByExpiry.find(b => b.grn.batchNo === selectedBatchNo);
    if (!matchedBatch) {
      setErrorMsg('Selected batch stock detail not found.');
      return;
    }

    if (Number(qtyToIssue) > matchedBatch.availableQty) {
      setErrorMsg(`Insufficient stock! Standard limit for batch ${selectedBatchNo} is ${matchedBatch.availableQty} units.`);
      return;
    }

    const alreadyAddedQty = outwardItems
      .filter(item => item.materialId === selectedMaterialId && item.batchNo === selectedBatchNo)
      .reduce((s, curr) => s + curr.qty, 0);

    if (Number(qtyToIssue) + alreadyAddedQty > matchedBatch.availableQty) {
      setErrorMsg(`Cannot add! Combined requested quantity (${Number(qtyToIssue) + alreadyAddedQty}) exceeds available batch stock (${matchedBatch.availableQty} units).`);
      return;
    }

    const materialRef = materials.find(m => m.id === selectedMaterialId);
    if (!materialRef) return;

    const newItem = {
      id: 'item_disp_' + Date.now() + Math.random().toString(36).slice(2, 5),
      materialId: selectedMaterialId,
      materialName: materialRef.materialName,
      batchNo: selectedBatchNo,
      qty: Number(qtyToIssue),
      remarks: remarks.trim() || undefined
    };

    setOutwardItems(prev => [...prev, newItem]);
    
    // Clear item inputs but preserve header configuration
    setSelectedMaterialId('');
    setSelectedBatchNo('');
    setQtyToIssue('');
    setRemarks('');
  };

  const handleRemoveItemFromList = (itemId: string) => {
    setOutwardItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (cannotIssue) {
      setErrorMsg('Unauthorized: Your role does not have authorization to issue stock.');
      return;
    }

    if (!outwardNo.trim() || !outwardDate) {
      setErrorMsg('Please specify both Outward Voucher Number and Date.');
      return;
    }

    if (department === 'Jobwork / Gamma') {
      if (!jobworkVendorName.trim()) {
        setErrorMsg('Please specify the Jobwork Vendor Name.');
        return;
      }
      if (!jobworkDocNo.trim()) {
        setErrorMsg('Please specify the Jobwork Dispatch Document / Challan Number.');
        return;
      }
      if (!jobworkPackingQty || Number(jobworkPackingQty) <= 0) {
        setErrorMsg('Please enter a valid packing quantity.');
        return;
      }
    }

    if (editingOutwardId || selectedOutwardId) {
      const activeId = editingOutwardId || selectedOutwardId;
      const existingOutward = outwards.find(o => o.id === activeId);
      const materialRef = materials.find(m => m.id === selectedMaterialId);
      if (!materialRef || !selectedBatchNo || !qtyToIssue || Number(qtyToIssue) <= 0) {
        setErrorMsg('Please enter active material, batch, and qty details.');
        return;
      }

      const updatedOutward: Outward = {
        id: activeId!,
        outwardNo,
        outwardDate,
        materialId: selectedMaterialId,
        materialName: materialRef.materialName,
        batchNo: selectedBatchNo,
        qty: Number(qtyToIssue),
        department,
        issuedBy: existingOutward ? existingOutward.issuedBy : currentUser.name,
        remarks: remarks.trim(),
        createdOn: existingOutward ? existingOutward.createdOn : new Date().toISOString(),
        outwardType,
        ...(department === 'Jobwork / Gamma' ? {
          jobworkVendorName: jobworkVendorName.trim(),
          jobworkDocNo: jobworkDocNo.trim(),
          jobworkPackingType,
          jobworkPackingQty: Number(jobworkPackingQty)
        } : {})
      };

      onSaveOutward(updatedOutward);
      setEditingOutwardId(null);
      setSelectedOutwardId(null);
      setSuccessMsg(`Outward voucher ${outwardNo} updated successfully.`);
      setViewMode('list');
    } else {
      if (outwardItems.length === 0) {
        // Fallback: direct save
        if (!selectedMaterialId || !selectedBatchNo || !qtyToIssue || Number(qtyToIssue) <= 0) {
          setErrorMsg('No items in the Outward List! Either add items using "+ Add to Outward List" or enter details directly to save.');
          return;
        }

        const materialRef = materials.find(m => m.id === selectedMaterialId);
        if (!materialRef) {
          setErrorMsg('Selected material was not found.');
          return;
        }

        const newOutward: Outward = {
          id: 'out_' + Date.now(),
          outwardNo,
          outwardDate,
          materialId: selectedMaterialId,
          materialName: materialRef.materialName,
          batchNo: selectedBatchNo,
          qty: Number(qtyToIssue),
          department,
          issuedBy: currentUser.name,
          remarks: remarks.trim(),
          createdOn: new Date().toISOString(),
          outwardType,
          ...(department === 'Jobwork / Gamma' ? {
            jobworkVendorName: jobworkVendorName.trim(),
            jobworkDocNo: jobworkDocNo.trim(),
            jobworkPackingType,
            jobworkPackingQty: Number(jobworkPackingQty)
          } : {})
        };

        onSaveOutward(newOutward);
        setSuccessMsg(`Stock issued successfully under voucher ${outwardNo}.`);
      } else {
        // Multi save
        outwardItems.forEach((item, index) => {
          const newOutward: Outward = {
            id: 'out_' + (Date.now() + index),
            outwardNo,
            outwardDate,
            materialId: item.materialId,
            materialName: item.materialName,
            batchNo: item.batchNo,
            qty: item.qty,
            department,
            issuedBy: currentUser.name,
            remarks: item.remarks || remarks.trim() || '',
            createdOn: new Date().toISOString(),
            outwardType,
            ...(department === 'Jobwork / Gamma' ? {
              jobworkVendorName: jobworkVendorName.trim(),
              jobworkDocNo: jobworkDocNo.trim(),
              jobworkPackingType,
              jobworkPackingQty: Number(jobworkPackingQty)
            } : {})
          };
          onSaveOutward(newOutward);
        });

        setSuccessMsg(`Stock issued successfully for ${outwardItems.length} materials under voucher ${outwardNo}.`);
        setOutwardItems([]);
      }
      setViewMode('list');
    }

    // Reset Form fields
    setSelectedMaterialId('');
    setSelectedBatchNo('');
    setQtyToIssue('');
    setRemarks('');
    setJobworkVendorName('');
    setJobworkDocNo('');
    setJobworkPackingType('Box');
    setJobworkPackingQty('');
  };

  const handleOpenForm = (outwardId: string) => {
    const target = outwards.find(o => o.id === outwardId);
    if (!target) return;

    setSelectedOutwardId(target.id);
    setEditingOutwardId(null);
    setOutwardNo(target.outwardNo);
    setSelectedMaterialId(target.materialId);
    setSelectedBatchNo(target.batchNo);
    setQtyToIssue(target.qty);
    setDepartment(target.department);
    setOutwardDate(target.outwardDate);
    setRemarks(target.remarks || '');
    setOutwardType(target.outwardType || 'Commercial Use');
    
    setJobworkVendorName(target.jobworkVendorName || '');
    setJobworkDocNo(target.jobworkDocNo || '');
    setJobworkPackingType(target.jobworkPackingType || 'Box');
    setJobworkPackingQty(target.jobworkPackingQty || '');

    setViewMode('form');
    setActiveSheetTab('operations');
  };

  const handleCreateNew = () => {
    setSelectedOutwardId(null);
    setEditingOutwardId(null);
    setOutwardNo('');
    setSelectedMaterialId('');
    setSelectedBatchNo('');
    setQtyToIssue('');
    setRemarks('');
    setJobworkVendorName('');
    setJobworkDocNo('');
    setJobworkPackingType('Box');
    setJobworkPackingQty('');
    setOutwardItems([]);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    setViewMode('form');
    setActiveSheetTab('operations');
  };

  const handleDiscard = () => {
    setSelectedOutwardId(null);
    setEditingOutwardId(null);
    setViewMode('list');
  };

  // Filter outwards history presentation
  const filteredOutwards = outwards.filter(o => {
    const matchesSearch = 
      o.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.outwardNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'All' || o.department === deptFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 animate-fade-in text-stone-800">
      
      {/* ────────────────── LIST VIEW ────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-sans text-slate-800">Outward Register</h2>
              <p className="text-xs text-slate-500 mt-1">
                Issue approved material batches for production lines or record outbound issue for Jobwork with packaging tracking.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-xs px-3 py-2 bg-slate-100 border border-slate-205 rounded-xl font-medium text-slate-600">
                Total Issued: <strong>{outwards.reduce((acc, curr) => acc + curr.qty, 0).toLocaleString()}</strong> Units
              </div>
              {!cannotIssue && (
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Issue</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtering shelf */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-stone-200/55 shadow-xs">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Material name, batch, memo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-slate-850 bg-slate-50/50 border border-stone-200 text-xs p-2.5 pl-9 outline-none rounded-xl focus:border-stone-400 focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>

            <div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full text-slate-800 bg-slate-50/50 border border-stone-200 text-xs p-2.5 outline-none rounded-xl focus:border-stone-400 focus:bg-white"
              >
                <option value="All">All Departments</option>
                <option value="Production Use">Production Use</option>
                <option value="F&D Department">F&D Department</option>
                <option value="QC Department">QC Department</option>
                <option value="Material Loss">Material Loss</option>
                <option value="Jobwork / Gamma">Jobwork / Gamma</option>
              </select>
            </div>

            <div className="flex items-center justify-end text-xs font-medium text-slate-400 font-mono">
              Registries: {filteredOutwards.length} Records
            </div>
          </div>

          {/* Data table */}
          {filteredOutwards.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-stone-200/55 text-center space-y-2 text-slate-400 shadow-xs">
              <Boxes className="w-10 h-10 mx-auto opacity-35 text-blue-600" />
              <p className="text-xs font-bold text-slate-800">No Outward Logs Found</p>
              <p className="text-[11px] text-slate-500">No material has been supplied out or issued under your selected filters.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200/55 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-stone-200/40 text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">Outward Date</th>
                      <th className="p-4">Assigned Product</th>
                      <th className="p-4 text-center">Batch Issued</th>
                      <th className="p-4 text-right">Quantity</th>
                      <th className="p-4 text-center">Mfg Date</th>
                      <th className="p-4 text-center">Exp Date</th>
                      <th className="p-4">Department / Destination</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-[11.5px] text-slate-800">
                    {filteredOutwards.map(o => {
                      const matchedItemStockInfo = grns.find(g => g.materialId === o.materialId && g.batchNo === o.batchNo);
                      return (
                        <tr 
                          key={o.id} 
                          className="hover:bg-slate-50/55 transition-colors cursor-pointer"
                          onClick={() => handleOpenForm(o.id)}
                        >
                          <td className="p-4 pl-6 font-semibold text-slate-705">
                            {formatDateToDDMMYYYY(o.outwardDate)}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold block text-slate-900">{o.materialName}</span>
                            <span className="text-[10px] text-slate-450 block font-mono mt-0.5">{o.materialId}</span>
                          </td>
                          <td className="p-4 text-center font-mono">
                            <span className="bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-sky-400 dark:border-blue-900/40 text-[10.5px] font-bold px-2 py-0.5 rounded">
                              {o.batchNo}
                            </span>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-950 font-mono text-xs">
                            {o.qty.toLocaleString()}
                          </td>
                          <td className="p-4 text-center font-mono text-slate-450 whitespace-nowrap">
                            {matchedItemStockInfo?.mfgDate ? formatDateToDDMMYYYY(matchedItemStockInfo.mfgDate) : 'N/A'}
                          </td>
                          <td className="p-4 text-center font-mono text-slate-455 whitespace-nowrap">
                            {matchedItemStockInfo?.expDate ? formatDateToDDMMYYYY(matchedItemStockInfo.expDate) : 'N/A'}
                          </td>
                          <td className="p-4 font-sans">
                            <span className="font-semibold">{o.department}</span>
                            {o.department === 'Jobwork / Gamma' && o.jobworkVendorName && (
                              <span className="block text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded mt-1 truncate max-w-xs" title={o.jobworkVendorName}>
                                Vendor: {o.jobworkVendorName}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {!cannotIssue && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingOutwardId(o.id);
                                    setOutwardNo(o.outwardNo);
                                    setSelectedMaterialId(o.materialId);
                                    setSelectedBatchNo(o.batchNo);
                                    setQtyToIssue(o.qty);
                                    setDepartment(o.department);
                                    setOutwardDate(o.outwardDate);
                                    setRemarks(o.remarks || '');
                                    setJobworkVendorName(o.jobworkVendorName || '');
                                    setJobworkDocNo(o.jobworkDocNo || '');
                                    setJobworkPackingType(o.jobworkPackingType || 'Box');
                                    setJobworkPackingQty(o.jobworkPackingQty || '');
                                    setViewMode('form');
                                  }}
                                  className="bg-slate-50 hover:bg-amber-50 border border-slate-200 text-amber-600 p-2 rounded-xl transition"
                                  title="Edit Outward Record"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {currentUser.role === 'Admin' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const confirmDel = window.confirm(`Restore stock and delete outward log memory ${o.outwardNo}?`);
                                    if (confirmDel) {
                                      onDeleteOutward(o.id);
                                    }
                                  }}
                                  className="bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-450 hover:text-red-650 p-2 rounded-xl transition"
                                  title="Delete Outward Voucher"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-450 italic font-mono block">Viewer View</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ────────────────── FORM REGISTER VIEW ────────────────── */}
      {viewMode === 'form' && (
        <div className="space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/50 pb-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDiscard}
                className="p-2 border border-stone-250 bg-white hover:bg-stone-50 rounded-xl transition shadow-xs cursor-pointer"
                title="Discard & Go Back"
              >
                <ArrowLeft className="w-4 h-4 text-slate-650" />
              </button>
              <div>
                <h3 className="text-lg font-bold font-sans text-slate-900 tracking-tight">
                  {selectedOutwardId ? `Viewing Record: ${outwardNo}` : editingOutwardId ? `Edit Voucher: ${outwardNo}` : 'Record New Material Issue'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Full FEFO compliance control system for manufacturing and jobwork dispatch logs.
                </p>
              </div>
            </div>

            {/* Odoo style chevron steps status */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-xs max-w-fit self-end font-sans">
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg tracking-wider ${
                !selectedOutwardId ? 'bg-purple-100 text-[#6B3E4B]' : 'text-slate-400'
              }`}>
                Draft / Input
              </span>
              <span className="text-slate-300">➔</span>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg tracking-wider ${
                selectedOutwardId ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' : 'text-slate-400'
              }`}>
                Recorded &amp; Issued
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
            
            {errorMsg && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs font-semibold flex items-center gap-3 animate-shake">
                <AlertCircle className="w-4.5 h-4.5 text-red-650 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-250 text-xs font-bold flex items-center gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-650 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Main Sheet Card */}
            <div className="bg-white rounded-3xl border border-stone-250 p-6 md:p-8 shadow-xs space-y-6">
              
              {/* Reference Header */}
              <div className="border-b border-stone-100 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest block">
                    Outward Issue Registry ID
                  </span>
                  <span className="text-4xl font-black font-sans text-slate-800 tracking-tight uppercase font-mono block">
                    {outwardNo || 'NEW OUTWARD VOUCHER'}
                  </span>
                </div>

                {selectedOutwardId && (
                  <div className="text-[10.5px] px-3 py-1.5 bg-blue-50 border border-blue-105 rounded-xl text-blue-600 font-bold dark:bg-blue-950/20 dark:text-sky-400 dark:border-blue-900/40">
                    Recorded Operator: {outwards.find(o => o.id === selectedOutwardId)?.issuedBy || currentUser.name}
                  </div>
                )}
              </div>

              {/* Form Input fields grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side */}
                <div className="space-y-4">
                  {/* Date selection */}
                  <div>
                    <label className="block text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                      Issue Date *
                    </label>
                    <input
                      type="date"
                      required
                      disabled={!!selectedOutwardId}
                      value={outwardDate}
                      onChange={(e) => setOutwardDate(e.target.value)}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl outline-none focus:border-[#714B67] disabled:bg-transparent disabled:border-transparent"
                    />
                  </div>

                  {/* Material Group Selection */}
                  <div>
                    <label className="block text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                      Select Material Group *
                    </label>
                    <select
                      required
                      disabled={!!selectedOutwardId}
                      value={selectedMaterialId}
                      onChange={(e) => handleMaterialChange(e.target.value)}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl outline-none focus:border-[#714B67] disabled:bg-transparent disabled:border-transparent font-medium"
                    >
                      <option value="">-- Choose Material Master --</option>
                      {materials.map(m => {
                        const stockList = getBatchStockDetails(m.id);
                        const totalInvStock = stockList.reduce((s, curr) => s + curr.availableQty, 0);
                        return (
                          <option key={m.id} value={m.id}>
                            {m.materialName} ({m.materialCode}) [Approved Stock: {totalInvStock} {m.uom}]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Batch No (FEFO prioritized) Selection */}
                  {selectedMaterialId && (
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                          Select Batch (FEFO Prioritized) *
                        </label>
                        <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          Nearest Expiry Listed Top
                        </span>
                      </div>
                      
                      {sortedBatchesByExpiry.length === 0 ? (
                        <div className="text-[11px] text-red-650 bg-red-50/50 p-3 rounded-xl border border-red-100 flex items-center gap-1.5 leading-relaxed">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-650" />
                          <span>No Approved Stock available inside warehouse for this material group.</span>
                        </div>
                      ) : (
                        <select
                          required
                          disabled={!!selectedOutwardId}
                          value={selectedBatchNo}
                          onChange={(e) => handleBatchChange(e.target.value)}
                          className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl outline-none focus:border-[#714B67] disabled:bg-transparent disabled:border-transparent"
                        >
                          <option value="">-- Choose Active Batch --</option>
                          {sortedBatchesByExpiry.map((b, idx) => {
                            const isFefo = idx === 0;
                            const statusNotice = b.isExpired 
                              ? 'EXPIRED' 
                              : `${b.daysLeft} d left`;
                            const activeMatInfo = materials.find(m => m.id === selectedMaterialId);
                            const matUomText = activeMatInfo ? activeMatInfo.uom : '';

                            return (
                              <option key={b.grn.id} value={b.grn.batchNo}>
                                {b.grn.batchNo} (Stock: {b.availableQty} {matUomText}) [{statusNotice}] {isFefo ? '[FEFO BEST PICK]' : ''}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  )}

                  {/* FEFO Pick Details badge */}
                  {selectedBatchDetails && (
                    <div className="p-3.5 bg-slate-5/50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Analytical Batch Intel</span>
                        {sortedBatchesByExpiry[0]?.grn.batchNo === selectedBatchNo && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" /> FEFO BEST COMPLIANT
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Stock Value:</span>
                          <strong className="text-slate-900 font-bold text-xs">
                            {selectedBatchDetails.availableQty} {materials.find(m => m.id === selectedMaterialId)?.uom || ''}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Expiration:</span>
                          <strong className={selectedBatchDetails.isExpired ? 'text-rose-650' : 'text-slate-900'}>
                            {selectedBatchDetails.grn.expDate ? formatDateToDDMMYYYY(selectedBatchDetails.grn.expDate) : 'N/A'} ({selectedBatchDetails.isExpired ? 'EXPIRED' : `${selectedBatchDetails.daysLeft} d remainder`})
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side */}
                <div className="space-y-4">
                  {/* Outward Quantity */}
                  <div>
                    <label className="block text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                      Quantity to Outward *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 10"
                      disabled={!!selectedOutwardId}
                      value={qtyToIssue}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setQtyToIssue(val);
                      }}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl outline-none focus:border-[#714B67] disabled:bg-transparent disabled:border-transparent font-bold"
                    />
                  </div>

                  {/* Production Destination Selection */}
                  <div>
                    <label className="block text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                      Production Dept / Destination *
                    </label>
                    <select
                      disabled={!!selectedOutwardId}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl outline-none focus:border-blue-500 disabled:bg-transparent disabled:border-transparent font-semibold"
                    >
                      <option value="Production Use">Production Use</option>
                      <option value="F&D Department">F&D Department</option>
                      <option value="QC Department">QC Department</option>
                      <option value="Material Loss">Material Loss</option>
                      <option value="Jobwork / Gamma">Jobwork / Gamma</option>
                    </select>
                  </div>

                  {/* Secondary Details for Jobwork dispatch */}
                  {department === 'Jobwork / Gamma' && (
                    <div className="p-4 bg-blue-50/50 border border-blue-200/60 rounded-2xl space-y-3 text-xs animate-slide-down">
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block border-b border-blue-200/40 pb-1 flex items-center gap-1">
                        <Workflow className="w-3.5 h-3.5 text-blue-605" />
                        <span>Gamma / Jobwork Processing Details</span>
                      </span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9.5px] font-bold text-blue-800 uppercase tracking-wider mb-1">
                            Jobwork Partner Vendor *
                          </label>
                          <input
                            type="text"
                            required
                            disabled={!!selectedOutwardId}
                            placeholder="e.g. Gamma Radiation Ltd"
                            value={jobworkVendorName}
                            onChange={(e) => setJobworkVendorName(e.target.value)}
                            className="w-full text-slate-805 bg-white border border-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-blue-500 font-medium disabled:bg-transparent disabled:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-[9.5px] font-bold text-blue-800 uppercase tracking-wider mb-1">
                            Document / Challan No *
                          </label>
                          <input
                            type="text"
                            required
                            disabled={!!selectedOutwardId}
                            placeholder="e.g. CHN-456-26"
                            value={jobworkDocNo}
                            onChange={(e) => setJobworkDocNo(e.target.value)}
                            className="w-full text-slate-805 bg-white border border-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-blue-500 font-mono disabled:bg-transparent disabled:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9.5px] font-bold text-blue-800 uppercase tracking-wider mb-1">
                            Packing Type *
                          </label>
                          <select
                            disabled={!!selectedOutwardId}
                            value={jobworkPackingType}
                            onChange={(e) => setJobworkPackingType(e.target.value)}
                            className="w-full text-slate-805 bg-white border border-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-blue-500 disabled:bg-transparent disabled:border-transparent font-semibold"
                          >
                            <option value="Box">Box</option>
                            <option value="Bag">Bag</option>
                            <option value="Drum">Drum</option>
                            <option value="Container">Container</option>
                            <option value="Packet">Packet</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9.5px] font-bold text-blue-800 uppercase tracking-wider mb-1">
                            Packaging Unit Count *
                          </label>
                          <input
                            type="number"
                            required
                            disabled={!!selectedOutwardId}
                            placeholder="e.g. 5"
                            value={jobworkPackingQty}
                            onChange={(e) => setJobworkPackingQty(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-slate-805 bg-white border border-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-blue-500 font-mono disabled:bg-transparent disabled:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Dynamic spreadsheet sub-tabs */}
              <div className="pt-4 border-t border-stone-100">
                
                {/* Selector Menu */}
                <div className="flex border-b border-stone-200 mb-4 text-xs font-sans">
                  <button
                    type="button"
                    onClick={() => setActiveSheetTab('operations')}
                    className={`pb-2.5 px-4 font-bold border-b-2 tracking-wide flex items-center gap-1.5 transition ${
                      activeSheetTab === 'operations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-blue-550'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Outward Operations</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSheetTab('notes')}
                    className={`pb-2.5 px-4 font-bold border-b-2 tracking-wide flex items-center gap-1.5 transition ${
                      activeSheetTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-blue-550'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Purpose Remarks &amp; Instructions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSheetTab('additional_info')}
                    className={`pb-2.5 px-4 font-bold border-b-2 tracking-wide flex items-center gap-1.5 transition ${
                      activeSheetTab === 'additional_info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-blue-550'
                    }`}
                  >
                    <UserSquare className="w-4 h-4" />
                    <span>Auditing Information</span>
                  </button>
                </div>

                {/* operations panel */}
                {activeSheetTab === 'operations' && (
                  <div className="space-y-4 animate-fade-in text-xs">
                    
                    {/* Add Inline Row component button */}
                    {!selectedOutwardId && !editingOutwardId && (
                      <div className="bg-slate-50 border border-slate-205 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
                        <p className="text-slate-500 font-medium">
                          Build dynamic multi-material batch dispatches inside a single transaction. Click to add item.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddItemToList}
                          className="px-4 py-2 bg-blue-105 hover:bg-blue-200 border border-blue-200 text-blue-700 font-bold rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-700" />
                          <span>+ Add to Dispatch List</span>
                        </button>
                      </div>
                    )}

                    {/* Active list table */}
                    {!selectedOutwardId && outwardItems.length > 0 ? (
                      <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-3xs max-w-full">
                        <table className="min-w-full divide-y divide-slate-100 text-[11px] text-slate-700">
                          <thead className="bg-slate-50 text-stone-500 font-bold uppercase tracking-wider text-[9.5px]">
                            <tr>
                              <th className="px-4 py-3 text-left">Product Master Group</th>
                              <th className="px-4 py-3 text-center">Batch Number</th>
                              <th className="px-4 py-3 text-right">Requested Qty</th>
                              <th className="px-4 py-3 text-center">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans">
                            {outwardItems.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                <td className="px-4 py-3 font-bold text-slate-900">{item.materialName}</td>
                                <td className="px-4 py-3 text-center font-mono">
                                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                                    {item.batchNo}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-black text-slate-950 font-mono text-xs">
                                  {item.qty}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItemFromList(item.id)}
                                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-stone-200">
                        <p className="text-slate-500 text-center leading-relaxed font-medium">
                          {selectedOutwardId ? (
                            <span>This voucher issued a total of <b>{qtyToIssue}</b> units of batch <b>{selectedBatchNo}</b> under material group <b>{materials.find(m => m.id === selectedMaterialId)?.materialName}</b>.</span>
                          ) : (
                            <span>No dynamic sub-items added. Saving will record the direct active screen selection ({qtyToIssue || '0'} units).</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional info section */}
                {activeSheetTab === 'additional_info' && (
                  <div className="space-y-3 animate-fade-in text-xs max-w-lg">
                    <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-705">
                      <div>
                        <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Voucher Classification</span>
                        <select
                          disabled={!!selectedOutwardId}
                          value={outwardType}
                          onChange={(e) => setOutwardType(e.target.value as any)}
                          className="w-full text-slate-800 bg-slate-50 border border-slate-205 text-xs p-2.5 rounded-xl outline-none focus:border-blue-500 disabled:bg-transparent disabled:border-transparent font-semibold"
                        >
                          <option value="Commercial Use">Commercial Use</option>
                          <option value="Sample">Sample</option>
                          <option value="Trial">Trial</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Authorised Personnel</span>
                        <input
                          type="text"
                          disabled
                          value={selectedOutwardId ? (outwards.find(o => o.id === selectedOutwardId)?.issuedBy || '-') : currentUser.name}
                          className="w-full text-slate-500 bg-transparent border-transparent text-xs p-2.5 rounded-xl font-bold font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Remarks tab */}
                {activeSheetTab === 'notes' && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="block text-[10.5px] font-extrabold text-blue-600 uppercase tracking-wider mb-1">
                      Internal Special Remarks
                    </label>
                    <textarea
                      placeholder="Specify line issues, product instructions, validation checks, or driver details..."
                      disabled={!!selectedOutwardId}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 text-xs p-3.5 rounded-2xl outline-none focus:border-blue-500 disabled:bg-transparent disabled:border-transparent h-24 resize-none font-medium"
                    />
                  </div>
                )}

              </div>

            </div>

            {/* Form footer operations bar */}
            {!selectedOutwardId && (
              <div className="flex gap-3 justify-end items-center max-w-5xl mx-auto pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Discard / Cancel
                </button>
                <button
                  type="submit"
                  disabled={cannotIssue}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4 shrink-0 text-sky-200" />
                  <span>
                    {editingOutwardId 
                      ? 'Save Profile Changes' 
                      : (outwardItems.length > 0 
                          ? `Deploy Outward List (${outwardItems.length} Items)` 
                          : 'Confirm & Disburse Stock'
                        )
                    }
                  </span>
                </button>
              </div>
            )}

            {selectedOutwardId && (
              <div className="flex gap-3 justify-between items-center max-w-5xl mx-auto pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-[#FAF9F5] border border-stone-250 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                >
                  Back to List
                </button>

                <div className="flex gap-2">
                  {!cannotIssue && (
                    <button
                      type="button"
                      onClick={() => {
                        const rec = outwards.find(o => o.id === selectedOutwardId);
                        if (rec) {
                          setEditingOutwardId(rec.id);
                          setSelectedOutwardId(null);
                        }
                      }}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition duration-150 cursor-pointer"
                    >
                      Edit Document
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition duration-150 cursor-pointer"
                  >
                    + New Register Issue
                  </button>
                </div>
              </div>
            )}

          </form>

        </div>
      )}

    </div>
  );
}
