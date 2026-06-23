import React, { useState } from 'react';
import { Grn, User, Material } from '../types';
import { 
  Search, 
  Layers, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpDown, 
  CornerDownRight, 
  Tag, 
  X,
  HelpCircle
} from 'lucide-react';

interface AssignTabProps {
  grns: Grn[];
  materials: Material[];
  onSaveGrn: (updatedGrn: Grn) => Promise<void>;
  currentUser: User;
  theme?: 'light' | 'dark';
}

export default function AssignTab({
  grns,
  materials,
  onSaveGrn,
  currentUser,
  theme = 'light'
}: AssignTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGrnId, setEditingGrnId] = useState<string | null>(null);
  const [palletInput, setPalletInput] = useState('');
  const [drumInput, setDrumInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Tab inner filter: 'all', 'pending', 'assigned'
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'assigned'>('all');

  const canEdit = currentUser.role === 'Admin' || currentUser.role === 'GRN Operator';

  // Search and Filter GRNs
  const filteredGrns = grns.filter(g => {
    const matName = g.materialName.toLowerCase();
    const grnNo = g.grnNo.toLowerCase();
    const batch = g.batchNo.toLowerCase();
    const supplier = g.supplierName.toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = 
      matName.includes(search) || 
      grnNo.includes(search) || 
      batch.includes(search) || 
      supplier.includes(search);

    if (!matchesSearch) return false;

    const isAssigned = !!(g.palletNo || g.drumNo);
    if (filterType === 'pending') return !isAssigned;
    if (filterType === 'assigned') return isAssigned;
    return true;
  });

  // Open modal/editor for a GRN
  const handleStartEdit = (grn: Grn) => {
    setEditingGrnId(grn.id);
    setPalletInput(grn.palletNo || '');
    setDrumInput(grn.drumNo || '');
    setErrorMsg(null);
  };

  // Close editing block
  const handleCancelEdit = () => {
    setEditingGrnId(null);
    setPalletInput('');
    setDrumInput('');
    setErrorMsg(null);
  };

  // Save the updated Pellet & Drum numbers
  const handleSaveAssignments = async (grn: Grn) => {
    if (!canEdit) {
      setErrorMsg('Access Denied: Your assigned role cannot assign or edit Pellet/Drum numbers.');
      return;
    }

    try {
      const updated: Grn = {
        ...grn,
        palletNo: palletInput.trim() || undefined,
        drumNo: drumInput.trim() || undefined
      };

      await onSaveGrn(updated);
      setSuccessMsg(`Pellets & Drums updated successfully for ${grn.materialName}.`);
      setEditingGrnId(null);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (e: any) {
      setErrorMsg('Error updating assignments: ' + e.message);
    }
  };

  // Delete/Clear the assignments
  const handleClearAssignments = async (grn: Grn) => {
    if (!canEdit) {
      setErrorMsg('Access Denied: Your assigned role cannot remove Pellet/Drum numbers.');
      return;
    }

    if (!window.confirm(`Are you sure you want to clear/delete the Pellet and Drum numbers assigned to ${grn.materialName}?`)) {
      return;
    }

    try {
      const updated: Grn = {
        ...grn,
        palletNo: undefined,
        drumNo: undefined
      };

      await onSaveGrn(updated);
      setSuccessMsg(`Assignments cleared successfully for ${grn.materialName}.`);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (e: any) {
      setErrorMsg('Error clearing assignments: ' + e.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto px-4 py-2">
      
      {/* Header and Summary Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/85 pb-4">
        <div>
          <h2 className="text-xl font-black text-blue-600 dark:text-sky-450 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-650" />
            <span>Pellet & Drum Assignment Unit</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans mt-1">
            Assign, edit, or remove spatial warehouse Pellet indexes and individual physical unit Drum sequences for inward entries.
          </p>
        </div>

        {/* Dynamic mini counts panel */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center shadow-xs">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-widest leading-none">Pending</div>
            <div className="text-lg font-black text-amber-800 font-mono mt-1">
              {grns.filter(g => !(g.palletNo || g.drumNo)).length}
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center shadow-xs">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest leading-none">Assigned</div>
            <div className="text-lg font-black text-emerald-800 font-mono mt-1">
              {grns.filter(g => !!(g.palletNo || g.drumNo)).length}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts division */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-scale-up">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3.5 text-xs text-rose-800 font-bold flex items-center gap-2 animate-scale-up">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Controls: Search, Filters Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
        
        {/* Search Input Bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search material, partner supplier, batch, or GRN reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-slate-850 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold"
          />
        </div>

        {/* Filter Selection Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto self-stretch md:self-auto shrink-0 font-sans">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            All Items ({grns.length})
          </button>
          <button
            onClick={() => setFilterType('pending')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            Pending ({grns.filter(g => !(g.palletNo || g.drumNo)).length})
          </button>
          <button
            onClick={() => setFilterType('assigned')}
            className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'assigned'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Assigned ({grns.filter(g => !!(g.palletNo || g.drumNo)).length})
          </button>
        </div>
      </div>

      {/* Materials List Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">
                <th className="p-4">Inward Detail</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Number of Drums</th>
                <th className="p-4">Batch Number</th>
                <th className="p-4 text-center">Assigned Pellet No</th>
                <th className="p-4 text-center">Assigned Drum No</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-sans font-bold">
                    No inward materials found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredGrns.map((grn) => {
                  const isEditing = editingGrnId === grn.id;
                  const isAssigned = !!(grn.palletNo || grn.drumNo);

                  return (
                    <tr 
                      key={grn.id} 
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                        !isAssigned ? 'bg-amber-50/5' : ''
                      }`}
                    >
                      {/* 1. Voucher/Vessel Identifiers */}
                      <td className="p-4">
                        <div className="font-bold text-slate-800">
                          {grn.grnDate}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight truncate max-w-[150px]" title={grn.supplierName}>
                          {grn.supplierName}
                        </div>
                      </td>

                      {/* 2. Product Name */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{grn.materialName}</div>
                        {grn.category && (
                          <div className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5 font-sans">
                            {grn.category}
                          </div>
                        )}
                      </td>

                      {/* 3. Number of Drums */}
                      <td className="p-4">
                        <div className="font-bold text-slate-700">
                          {grn.packagingCount !== undefined ? `${grn.packagingCount} Drum(s)` : 'N/A'}
                        </div>
                        <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                          Total: {grn.qty} KG
                        </div>
                      </td>

                      {/* 4. Batch Code */}
                      <td className="p-4">
                        <span className="bg-slate-150 px-2 py-0.5 text-[10px] font-bold font-mono tracking-wide rounded text-slate-700 border uppercase">
                          {grn.batchNo}
                        </span>
                      </td>

                      {/* 5. Assigned Pellet Number */}
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="e.g. PL-104"
                            value={palletInput}
                            onChange={(e) => setPalletInput(e.target.value.toUpperCase())}
                            className="bg-stone-50 border border-slate-300 rounded-lg p-1.5 text-xs text-center font-bold text-slate-800 w-24 focus:outline-none focus:border-blue-500 uppercase font-mono shadow-inner"
                          />
                        ) : grn.palletNo ? (
                          <span className="font-mono bg-emerald-100/90 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-extrabold border border-emerald-200">
                            {grn.palletNo}
                          </span>
                        ) : (
                          <span className="text-amber-500 font-bold italic text-[11px] flex items-center justify-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                            <span>Unassigned</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Assigned Drum Number */}
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="e.g. DM-08"
                            value={drumInput}
                            onChange={(e) => setDrumInput(e.target.value.toUpperCase())}
                            className="bg-stone-50 border border-slate-300 rounded-lg p-1.5 text-xs text-center font-bold text-slate-800 w-24 focus:outline-none focus:border-blue-500 uppercase font-mono shadow-inner"
                          />
                        ) : grn.drumNo ? (
                          <span className="font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-sky-450 px-2.5 py-1 rounded-lg text-xs font-extrabold border border-blue-100 dark:border-blue-900/40">
                            {grn.drumNo}
                          </span>
                        ) : (
                          <span className="text-amber-500 font-bold italic text-[11px] flex items-center justify-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                            <span>Unassigned</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Action Button Division */}
                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveAssignments(grn)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10.5px] transition shadow-xs cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1.5 rounded-lg text-[10.5px] transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(grn)}
                              title="Assign or Edit Pellet/Drum Number"
                              className="p-1 px-2.5 flex items-center gap-1 border border-[#cbd5e1] hover:border-blue-500 rounded-lg hover:text-blue-600 transition bg-white text-slate-600 font-bold text-[10.5px] cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{isAssigned ? 'Edit' : 'Assign'}</span>
                            </button>

                            {isAssigned && (
                              <button
                                onClick={() => handleClearAssignments(grn)}
                                title="Clear Assigned Numbers"
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
