import React, { useState } from 'react';
import { User, Grn, Material, Outward } from '../types';
import ProfileTab from './ProfileTab';
import { 
  Sliders, 
  Shield, 
  AlertCircle, 
  Database, 
  ToggleLeft, 
  ToggleRight, 
  Download, 
  Upload, 
  CheckCircle2, 
  Save, 
  FileSpreadsheet, 
  ArrowDownNarrowWide 
} from 'lucide-react';

interface SettingsTabProps {
  currentUser: User;
  grns: Grn[];
  onResetDatabase?: () => void;
  materials?: Material[];
  outwards?: Outward[];
  users?: User[];
  onImportBackup?: (data: {
    materials: Material[];
    grns: Grn[];
    outwards: Outward[];
    users: User[];
  }) => Promise<void>;
  onSaveMaterial?: (material: Material) => void;
  theme?: 'light' | 'dark';
}

export default function SettingsTab({ 
  currentUser, 
  grns, 
  onResetDatabase,
  materials = [],
  outwards = [],
  users = [],
  onImportBackup,
  onSaveMaterial,
  theme = 'dark'
}: SettingsTabProps) {
  const [allowOverIssue, setAllowOverIssue] = useState<boolean>(() => {
    return localStorage.getItem('cfg_allow_over_issue') === 'true';
  });

  const [strictExpiryGuard, setStrictExpiryGuard] = useState<boolean>(() => {
    return localStorage.getItem('cfg_strict_expiry_guard') !== 'false';
  });

  const [automaticPalletAllocation, setAutomaticPalletAllocation] = useState<boolean>(() => {
    return localStorage.getItem('cfg_auto_pallet') === 'true';
  });

  const [qcInspectionEnabled, setQcInspectionEnabled] = useState<boolean>(() => {
    return localStorage.getItem('cfg_qc_inspection') === 'true';
  });

  const [inwardEnabled, setInwardEnabled] = useState<boolean>(() => {
    return localStorage.getItem('cfg_inward_enabled') !== 'false';
  });

  const [outwardEnabled, setOutwardEnabled] = useState<boolean>(() => {
    return localStorage.getItem('cfg_outward_enabled') !== 'false';
  });

  const [cfgUoms, setCfgUoms] = useState(() => {
    return localStorage.getItem('cfg_uoms') || 'KG, LITRE, PCS, BOX, BAG, MG, GM';
  });

  const [cfgGrnSupplierPrefix, setCfgGrnSupplierPrefix] = useState(() => {
    return localStorage.getItem('cfg_grn_supplier_prefix') || localStorage.getItem('cfg_grn_prefix') || 'GRN-SUP-26-';
  });

  const [cfgGrnSupplierStart, setCfgGrnSupplierStart] = useState(() => {
    return localStorage.getItem('cfg_grn_supplier_start') || localStorage.getItem('cfg_grn_start') || '101';
  });

  const [cfgGrnProdPrefix, setCfgGrnProdPrefix] = useState(() => {
    return localStorage.getItem('cfg_grn_prod_prefix') || 'GRN-PRD-26-';
  });

  const [cfgGrnProdStart, setCfgGrnProdStart] = useState(() => {
    return localStorage.getItem('cfg_grn_prod_start') || '201';
  });

  const [cfgGrnJobworkPrefix, setCfgGrnJobworkPrefix] = useState(() => {
    return localStorage.getItem('cfg_grn_jobwork_prefix') || 'GRN-JBW-26-';
  });

  const [cfgGrnJobworkStart, setCfgGrnJobworkStart] = useState(() => {
    return localStorage.getItem('cfg_grn_jobwork_start') || '301';
  });

  const [cfgOutwardTrialPrefix, setCfgOutwardTrialPrefix] = useState(() => {
    return localStorage.getItem('cfg_outward_trial_prefix') || 'OUT-TRL-26-';
  });

  const [cfgOutwardTrialStart, setCfgOutwardTrialStart] = useState(() => {
    return localStorage.getItem('cfg_outward_trial_start') || '401';
  });

  const [cfgOutwardSamplePrefix, setCfgOutwardSamplePrefix] = useState(() => {
    return localStorage.getItem('cfg_outward_sample_prefix') || 'OUT-SMP-26-';
  });

  const [cfgOutwardSampleStart, setCfgOutwardSampleStart] = useState(() => {
    return localStorage.getItem('cfg_outward_sample_start') || '501';
  });

  const [cfgOutwardCommPrefix, setCfgOutwardCommPrefix] = useState(() => {
    return localStorage.getItem('cfg_outward_comm_prefix') || localStorage.getItem('cfg_issue_prefix') || 'OUT-COM-26-';
  });

  const [cfgOutwardCommStart, setCfgOutwardCommStart] = useState(() => {
    return localStorage.getItem('cfg_outward_comm_start') || localStorage.getItem('cfg_issue_start') || '601';
  });

  const [isConfigSaved, setIsConfigSaved] = useState(false);

  const saveConfigurations = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cfg_uoms', cfgUoms);
    localStorage.setItem('cfg_grn_supplier_prefix', cfgGrnSupplierPrefix);
    localStorage.setItem('cfg_grn_supplier_start', cfgGrnSupplierStart);
    localStorage.setItem('cfg_grn_prod_prefix', cfgGrnProdPrefix);
    localStorage.setItem('cfg_grn_prod_start', cfgGrnProdStart);
    localStorage.setItem('cfg_grn_jobwork_prefix', cfgGrnJobworkPrefix);
    localStorage.setItem('cfg_grn_jobwork_start', cfgGrnJobworkStart);
    
    localStorage.setItem('cfg_outward_trial_prefix', cfgOutwardTrialPrefix);
    localStorage.setItem('cfg_outward_trial_start', cfgOutwardTrialStart);
    localStorage.setItem('cfg_outward_sample_prefix', cfgOutwardSamplePrefix);
    localStorage.setItem('cfg_outward_sample_start', cfgOutwardSampleStart);
    localStorage.setItem('cfg_outward_comm_prefix', cfgOutwardCommPrefix);
    localStorage.setItem('cfg_outward_comm_start', cfgOutwardCommStart);

    // Keep old keys for safety and general fallbacks
    localStorage.setItem('cfg_grn_prefix', cfgGrnSupplierPrefix);
    localStorage.setItem('cfg_grn_start', cfgGrnSupplierStart);
    localStorage.setItem('cfg_issue_prefix', cfgOutwardCommPrefix);
    localStorage.setItem('cfg_issue_start', cfgOutwardCommStart);

    setIsConfigSaved(true);
    setTimeout(() => {
      setIsConfigSaved(false);
      window.location.reload(); // Refresh to apply changes globally
    }, 1200);
  };

  const [resetConfirm, setResetConfirm] = useState(false);

  const toggleOverIssue = () => {
    const val = !allowOverIssue;
    setAllowOverIssue(val);
    localStorage.setItem('cfg_allow_over_issue', String(val));
  };

  const toggleExpiryGuard = () => {
    const val = !strictExpiryGuard;
    setStrictExpiryGuard(val);
    localStorage.setItem('cfg_strict_expiry_guard', String(val));
  };

  const togglePalletAlloc = () => {
    const val = !automaticPalletAllocation;
    setAutomaticPalletAllocation(val);
    localStorage.setItem('cfg_auto_pallet', String(val));
  };

  const toggleQcInspection = () => {
    const val = !qcInspectionEnabled;
    setQcInspectionEnabled(val);
    localStorage.setItem('cfg_qc_inspection', String(val));
    // Instantly refresh so layout updates
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const toggleInwardEnabled = () => {
    const val = !inwardEnabled;
    setInwardEnabled(val);
    localStorage.setItem('cfg_inward_enabled', String(val));
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const toggleOutwardEnabled = () => {
    const val = !outwardEnabled;
    setOutwardEnabled(val);
    localStorage.setItem('cfg_outward_enabled', String(val));
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleResetData = () => {
    if (onResetDatabase) {
      localStorage.removeItem('inv_clean_grn');
      localStorage.removeItem('inv_clean_outwards');
      localStorage.removeItem('inv_clean_materials');
      onResetDatabase();
      setResetConfirm(false);
      window.location.reload();
    }
  };

  // Common classes depending on theme
  const cardClass = theme === 'light'
    ? 'bg-white border border-slate-200/85 shadow-xs p-5 rounded-2xl space-y-4'
    : 'bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4';

  const headingClass = `text-sm font-black uppercase tracking-wider pb-3 border-b flex items-center gap-2 ${
    theme === 'light' ? 'text-slate-800 border-slate-200' : 'text-white border-white/10'
  }`;

  const rowHoverClass = theme === 'light'
    ? 'flex items-start justify-between gap-4 p-3 hover:bg-slate-50 rounded-xl transition duration-150'
    : 'flex items-start justify-between gap-4 p-3 hover:bg-white/5 rounded-xl transition duration-150';

  const labelClass = `block text-[10px] uppercase font-bold mb-1.5 tracking-wider ${
    theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'
  }`;

  const inputClass = `w-full text-xs p-3 font-bold font-mono border rounded-xl outline-none transition focus:ring-1 ${
    theme === 'light'
      ? 'bg-white border-slate-250 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 shadow-xs'
      : 'bg-white/5 border-white/10 text-white placeholder-stone-500 focus:border-[#8ed5ff] focus:ring-[#8ed5ff]'
  }`;

  const subcardClass = `p-3.5 border rounded-xl space-y-2.5 ${
    theme === 'light' ? 'bg-slate-50/70 border-slate-200/80 shadow-xs' : 'bg-white/[0.02] border-white/5'
  }`;

  const subInputClass = `w-full p-2 border rounded-lg font-mono font-bold text-[11px] outline-none ${
    theme === 'light'
      ? 'bg-white border-slate-250 text-slate-800 focus:border-blue-500'
      : 'bg-white/5 border-white/10 text-white focus:border-[#8ed5ff]'
  }`;

  const buttonClass = `px-5 py-2.5 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
    theme === 'light'
      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg shadow-blue-200'
      : 'bg-[#8ed5ff] hover:bg-[#aee0ff] text-slate-900'
  }`;

  const subHeadingLabel = theme === 'light' ? 'text-[#1e40af]' : 'text-[#8ed5ff]';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header section */}
      <div>
        <h2 id="settings-title" className={`text-xl font-black font-sans flex items-center gap-2 ${
          theme === 'light' ? 'text-slate-900' : 'text-white'
        }`}>
          <Sliders className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-[#8ed5ff]'}`} />
          <span>System Operation Settings</span>
        </h2>
        <p className={`text-xs mt-1 font-sans ${theme === 'light' ? 'text-slate-600' : 'text-[#87929a]'}`}>
          Configure security rule parameters, automated allocation schemes, stock logic bypasses, and data backups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Guard rails and behavior limits */}
        <div className={cardClass}>
          <h3 className={headingClass}>
            <Shield className={`w-4 h-4 ${theme === 'light' ? 'text-blue-600' : 'text-[#8ed5ff]'}`} />
            <span>Inventory Guard Rails & Triggers</span>
          </h3>

          <div className="space-y-4">
            
            {/* Rule 1: Expiry safety */}
            <div className={rowHoverClass}>
              <div className="space-y-1">
                <span className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  Strict Raw Expiration Block
                </span>
                <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>
                  Prevent operators from issuing any raw materials to production that have less than 15 days of active runtime remaining.
                </p>
              </div>
              <button 
                type="button" 
                onClick={toggleExpiryGuard}
                className={`focus:outline-none shrink-0 ${theme === 'light' ? 'text-blue-650' : 'text-[#8ed5ff]'}`}
              >
                {strictExpiryGuard ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className={`w-9 h-9 ${theme === 'light' ? 'text-slate-350' : 'text-stone-550'}`} />
                )}
              </button>
            </div>

            {/* Rule 2: Over issue allow/deny */}
            <div className={rowHoverClass}>
              <div className="space-y-1">
                <span className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  Permit Negative Backorders
                </span>
                <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>
                  Allow physical material issues to exceed current safe system records (force negative stock). Recommended off.
                </p>
              </div>
              <button 
                type="button" 
                onClick={toggleOverIssue}
                className={`focus:outline-none shrink-0 ${theme === 'light' ? 'text-blue-655' : 'text-[#8ed5ff]'}`}
              >
                {allowOverIssue ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className={`w-9 h-9 ${theme === 'light' ? 'text-slate-355' : 'text-stone-555'}`} />
                )}
              </button>
            </div>

            {/* Rule 3: Auto Pallets */}
            <div className={rowHoverClass}>
              <div className="space-y-1">
                <span className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  Auto Pallet Space Booking
                </span>
                <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>
                  Suggest the nearest free warehouse pallet coordinate number automatically based on material classification during inward entry.
                </p>
              </div>
              <button 
                type="button" 
                onClick={togglePalletAlloc}
                className={`focus:outline-none shrink-0 ${theme === 'light' ? 'text-blue-655' : 'text-[#8ed5ff]'}`}
              >
                {automaticPalletAllocation ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className={`w-9 h-9 ${theme === 'light' ? 'text-slate-355' : 'text-stone-555'}`} />
                )}
              </button>
            </div>

            {/* Rule 4: QC Inspection desk (toggleable) */}
            <div className={rowHoverClass}>
              <div className="space-y-1">
                <span className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  Enable Material QC Inspection
                </span>
                <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>
                  Require a quality check and approval status update before any inward batches can be issued to production. (Default: Disabled/Auto-Approved).
                </p>
              </div>
              <button 
                type="button" 
                onClick={toggleQcInspection}
                className={`focus:outline-none shrink-0 ${theme === 'light' ? 'text-blue-655' : 'text-[#8ed5ff]'}`}
              >
                {qcInspectionEnabled ? (
                  <ToggleRight className="w-9 h-9 text-teal-600" />
                ) : (
                  <ToggleLeft className={`w-9 h-9 ${theme === 'light' ? 'text-slate-355' : 'text-stone-555'}`} />
                )}
              </button>
            </div>

            {/* Rule 5: Enable Inward (GRN) Module (toggleable) */}
            <div className={rowHoverClass}>
              <div className="space-y-1">
                <span className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  Enable Inward (GRN) Register
                </span>
                <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>
                  Show the Goods Receipt Note (GRN) Inward register module in navigation tabs and action center.
                </p>
              </div>
              <button 
                type="button" 
                onClick={toggleInwardEnabled}
                className={`focus:outline-none shrink-0 ${theme === 'light' ? 'text-blue-655' : 'text-[#8ed5ff]'}`}
              >
                {inwardEnabled ? (
                  <ToggleRight className="w-9 h-9 text-blue-600" />
                ) : (
                  <ToggleLeft className={`w-9 h-9 ${theme === 'light' ? 'text-slate-355' : 'text-stone-555'}`} />
                )}
              </button>
            </div>

            {/* Rule 6: Enable Outward Module (toggleable) */}
            <div className={rowHoverClass}>
              <div className="space-y-1">
                <span className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  Enable Outward Issue Register
                </span>
                <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>
                  Show the Outward Production Issue voucher register module in navigation tabs and action center.
                </p>
              </div>
              <button 
                type="button" 
                onClick={toggleOutwardEnabled}
                className={`focus:outline-none shrink-0 ${theme === 'light' ? 'text-blue-655' : 'text-[#8ed5ff]'}`}
              >
                {outwardEnabled ? (
                  <ToggleRight className="w-9 h-9 text-rose-500" />
                ) : (
                  <ToggleLeft className={`w-9 h-9 ${theme === 'light' ? 'text-slate-355' : 'text-stone-555'}`} />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Database administration resets & recovery */}
        <div className={`${cardClass} flex flex-col justify-between`}>
          <div className="space-y-3">
            <h3 className={headingClass}>
              <Database className="w-4 h-4 text-rose-500" />
              <span>Diagnostic Utilities & Node Resets</span>
            </h3>

            <p className={`text-xs leading-relaxed font-sans ${theme === 'light' ? 'text-slate-600' : 'text-[#dae2fd]'}`}>
              Perform complete database clearance, flush locally persistent logs, or restore default materials, pallets, and suppliers configurations.
            </p>

            <div className={`p-3 border rounded-xl text-[11px] leading-relaxed flex items-start gap-2 ${
              theme === 'light'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}>
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${theme === 'light' ? 'text-rose-600' : 'text-rose-450'}`} />
              <span>
                <b>WARNING:</b> Purging your data will permanently clear all GRN receipts, outward issues, drum assignments, and customized materials. This operation cannot be undone.
              </span>
            </div>
          </div>

          <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
            theme === 'light' ? 'border-slate-200' : 'border-white/5'
          }`}>
            <div className="text-left">
              <span className={`text-[10px] uppercase font-bold block ${theme === 'light' ? 'text-slate-450' : 'text-[#87929a]'}`}>Current Node state</span>
              <span className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                {grns.length} active registered batches
              </span>
            </div>

            {currentUser.role === 'Admin' ? (
              <div className="w-full sm:w-auto text-right">
                {resetConfirm ? (
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      id="reset-abort-btn"
                      onClick={() => setResetConfirm(false)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                        theme === 'light' ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-white/10 text-white hover:bg-white/15'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      id="reset-confirm-btn"
                      onClick={handleResetData}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider"
                    >
                      Yes, Reset Database!
                    </button>
                  </div>
                ) : (
                  <button
                    id="trigger-reset-flow"
                    onClick={() => setResetConfirm(true)}
                    className={`w-full sm:w-auto px-4 py-2 border rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      theme === 'light'
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-300'
                        : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Purge Sandbox Database</span>
                  </button>
                )}
              </div>
            ) : (
              <span className={`text-[10px] font-mono italic ${theme === 'light' ? 'text-slate-400' : 'text-stone-550'}`}>
                Requires Admin authority
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Dynamic Inventory & Document Number Sequence Configurations Card */}
      <div className={cardClass}>
        <h3 className={headingClass}>
          <Sliders className={`w-4 h-4 ${theme === 'light' ? 'text-blue-600' : 'text-[#8ed5ff]'}`} />
          <span>Warehouse Custom Categories, Units &amp; Sequential Prefixes</span>
        </h3>

        {isConfigSaved && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2 mb-4 animate-pulse">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Success: Configurations saved successfully! Re-syncing applet session...</span>
          </div>
        )}

        <form onSubmit={saveConfigurations} className="space-y-4 text-xs">
          
          {/* UOMs setting */}
          <div>
            <label className={labelClass}>
              Configured units of measure (Comma Separated)
            </label>
            <input
              type="text"
              value={cfgUoms}
              onChange={(e) => setCfgUoms(e.target.value)}
              placeholder="e.g. KG, LITRE, PCS, BOX, BAG, CAPSULE"
              className={inputClass}
            />
            <span className={`text-[10px] mt-1 block ${theme === 'light' ? 'text-slate-500' : 'text-stone-400'}`}>
              These units of measure will populate all Material Master select interfaces. Try adding the "CAPSULE" customized unit!
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className={buttonClass}
            >
              <Save className="w-3.5 h-3.5 animate-pulse" />
              <span>Save Sequence Configurations</span>
            </button>
          </div>

        </form>
      </div>

      {/* Database Backup & Disaster Recovery Center */}
      <div className={cardClass}>
        <h3 className={headingClass}>
          <Database className={`w-4 h-4 ${theme === 'light' ? 'text-blue-600' : 'text-[#8ed5ff]'}`} />
          <span>Warehouse Central Backup &amp; Disaster Recovery Suite</span>
        </h3>
        <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-[#87929a]'}`}>
          Regularly download consolidated state backups to insulate key warehouse records from browser caches clearing, offline connection dropouts, or equipment losses. Backups are instantly portable to other PC/phone terminals.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              try {
                const schemaPayload = {
                  materials,
                  grns,
                  outwards,
                  users,
                  metadata: {
                    nodeUuid: 'uliva-node-node-001',
                    operator: currentUser.name,
                    timestamp: new Date().toISOString()
                  }
                };
                const fileContent = JSON.stringify(schemaPayload, null, 2);
                const fileBlob = new Blob([fileContent], { type: 'application/json' });
                const blobUrl = URL.createObjectURL(fileBlob);
                const clickLink = document.createElement('a');
                clickLink.href = blobUrl;
                clickLink.download = `warehouse_master_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(clickLink);
                clickLink.click();
                document.body.removeChild(clickLink);
              } catch (ex) {
                alert('Export failed: ' + ex);
              }
            }}
            className={`p-5 rounded-2xl border text-left transition relative group overflow-hidden cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 shadow-sm'
                : 'bg-white/5 border-white/10 hover:border-[#8ed5ff]/40 hover:bg-white/[0.07]'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <Download className={`w-5 h-5 group-hover:translate-y-0.5 transition-transform ${theme === 'light' ? 'text-blue-650' : 'text-[#8ed5ff]'}`} />
              <span className={`text-[9.5px] border px-2 py-0.5 rounded font-mono font-black ${
                theme === 'light'
                  ? 'bg-blue-50 border-blue-250 text-blue-800'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>READY TO EXPORT</span>
            </div>
            <h4 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Save Complete Server Backup</h4>
            <p className={`text-[10px] mt-1 leading-normal ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>
              Compile materials list, active GRNs, quality status stamps, and outward transactions into a portable JSON backup file.
            </p>
          </button>

          <div className={`p-5 rounded-2xl border text-left transition relative group overflow-hidden flex flex-col justify-between ${
            theme === 'light'
              ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 shadow-sm'
              : 'bg-white/5 border-white/10 hover:border-[#8ed5ff]/40 hover:bg-white/[0.07]'
          }`}>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const uploadedFile = e.target.files?.[0];
                if (!uploadedFile) return;

                const fileReader = new FileReader();
                fileReader.onload = async (readEv) => {
                  const rawString = readEv.target?.result as string;
                  if (!rawString) return;

                  try {
                    const parsedStructure = JSON.parse(rawString);
                    if (!parsedStructure.materials || !parsedStructure.grns || !parsedStructure.outwards) {
                      alert('Corrupted JSON data structure mismatch. Import canceled.');
                      return;
                    }

                    if (!confirm('Warning: Restoring backup data will append and configure records in this warehouse instance. Proceed?')) {
                      return;
                    }

                    if (onImportBackup) {
                      await onImportBackup({
                        materials: parsedStructure.materials,
                        grns: parsedStructure.grns,
                        outwards: parsedStructure.outwards,
                        users: parsedStructure.users || []
                      });
                      alert('Server-side synchronized restoration complete! Refreshing active ledger...');
                      window.location.reload();
                    }
                  } catch (parseEx) {
                    alert('Parser crashed checking credentials. Confirm file is raw JSON formatting: ' + parseEx);
                  }
                };
                fileReader.readAsText(uploadedFile);
                e.target.value = '';
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="flex justify-between items-start mb-2">
              <Upload className={`w-5 h-5 group-hover:-translate-y-0.5 transition-transform ${theme === 'light' ? 'text-blue-650' : 'text-[#8ed5ff]'}`} />
              <span className={`text-[9.5px] border px-2 py-0.5 rounded font-mono font-black ${
                theme === 'light'
                  ? 'bg-blue-50 border-blue-250 text-blue-850'
                  : 'bg-[#bdc2ff]/10 text-[#bdc2ff] border border-[#bdc2ff]/20'
              }`}>RESTORE DATA</span>
            </div>
            <div>
              <h4 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Upload Server Backup</h4>
              <p className={`text-[10px] mt-1 leading-normal ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>
                Restore and sync any previously saved JSON backup file instantly onto this node instance.
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Embedded Company Identity Profile & Registration settings */}
      <div className="border-t pt-8 border-slate-200 dark:border-white/10">
        <ProfileTab 
          currentUser={currentUser} 
          onProfileUpdated={() => {
            // refresh page or let it update silently since it's saved in db
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }} 
          theme={theme} 
        />
      </div>

    </div>
  );
}
