import React, { useState, useEffect } from 'react';
import { dbService } from './services/db';
import { User, Material, Grn, Outward } from './types';

// Tab screens
import LoginScreen from './components/LoginScreen';
import HomeLauncher from './components/HomeLauncher';
import DashboardTab from './components/DashboardTab';
import GrnTab from './components/GrnTab';
import QcTab from './components/QcTab';
import InventoryTab from './components/InventoryTab';
import OutwardTab from './components/OutwardTab';
import UsersTab from './components/UsersTab';
import ProfileTab from './components/ProfileTab';
import SettingsTab from './components/SettingsTab';
import AssignTab from './components/AssignTab';

import { 
  Database, 
  Layers, 
  FileSpreadsheet, 
  Hourglass, 
  Boxes, 
  Users, 
  LogOut, 
  User as UserIcon, 
  Cloud, 
  CloudOff,
  Activity,
  LayoutGrid,
  Building2,
  Sliders,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  Sun,
  Moon,
  PlusCircle,
  Settings
} from 'lucide-react';

export default function App() {
  // Global synchronization state
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [grns, setGrns] = useState<Grn[]>([]);
  const [outwards, setOutwards] = useState<Outward[]>([]);
  
  // Theme state selector
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  });

  useEffect(() => {
    document.body.className = theme;
    document.documentElement.className = theme;
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const [isAltPressed, setIsAltPressed] = useState(false);

  // Global Keyboard Shortcuts for Tab Navigation (Power Users)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(true);
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveTab('home');
        return;
      }

      if (e.altKey) {
        setIsAltPressed(true);
        let targetTab: string | null = null;
        switch (e.key) {
          case '1':
            targetTab = 'grn'; // Inward
            break;
          case '2':
            targetTab = 'outward'; // Outward
            break;
          case '3':
            targetTab = 'inventory'; // Inventory
            break;
          case '4':
            targetTab = 'assign'; // Assign Pellets/Drums
            break;
          case '5':
            targetTab = 'settings'; // Settings
            break;
        }

        if (targetTab) {
          e.preventDefault();
          setActiveTab(targetTab);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(false);
      }
    };

    const handleBlur = () => {
      setIsAltPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarExpanded, setMobileSidebarExpanded] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  // Auth Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation - default to home tiles dashboard
  const [activeTab, setActiveTab] = useState<string>('home');

  // Multi-sequence category types
  const [defaultInwardSource, setDefaultInwardSource] = useState<'Supplier' | 'Production Return' | 'Jobwork Return'>('Supplier');
  const [defaultOutwardType, setDefaultOutwardType] = useState<'Trial' | 'Sample' | 'Commercial Use'>('Commercial Use');

  const refreshProfileState = async () => {
    try {
      const p = await dbService.fetchCompanyProfile();
      setCompanyProfile(p);
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger load
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [fetchedUsers, fetchedMaterials, fetchedGrns, fetchedOutwards, fetchedProfile] = await Promise.all([
          dbService.fetchUsers(),
          dbService.fetchMaterials(),
          dbService.fetchGrnRecords(),
          dbService.fetchOutwardRecords(),
          dbService.fetchCompanyProfile()
        ]);
        
        setUsers(fetchedUsers);
        setMaterials(fetchedMaterials);
        setGrns(fetchedGrns);
        setOutwards(fetchedOutwards);
        setCompanyProfile(fetchedProfile);
      } catch (err) {
        console.error('Failure fetching records:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // Default to the main Landing Tiles grid screen
    setActiveTab('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleImportBackup = async (data: {
    materials: Material[];
    grns: Grn[];
    outwards: Outward[];
    users: User[];
  }) => {
    try {
      // Stream write all records to DB
      for (const m of data.materials || []) {
        await dbService.saveMaterial(m);
      }
      for (const g of data.grns || []) {
        await dbService.saveGrn(g);
      }
      for (const o of data.outwards || []) {
        await dbService.saveOutwardRecord(o);
      }
      for (const u of data.users || []) {
        await dbService.saveUser(u);
      }

      // Sync active state variables
      setMaterials(data.materials || []);
      setGrns(data.grns || []);
      setOutwards(data.outwards || []);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Dynamic DB import error:', err);
      throw err;
    }
  };

  // State modifiers
  const handleSaveUser = async (user: User) => {
    await dbService.saveUser(user);
    setUsers(prev => [...prev, user]);
  };

  const handleSaveMaterial = async (material: Material) => {
    await dbService.saveMaterial(material);
    setMaterials(prev => {
      const exists = prev.some(m => m.id === material.id);
      if (exists) {
        return prev.map(m => m.id === material.id ? material : m);
      } else {
        return [...prev, material];
      }
    });
  };

  const handleDeleteMaterial = async (id: string) => {
    await dbService.deleteMaterial(id);
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveGrn = async (grn: Grn) => {
    await dbService.saveGrn(grn);
    setGrns(prev => {
      const exists = prev.some(g => g.id === grn.id);
      if (exists) {
        return prev.map(g => g.id === grn.id ? grn : g);
      }
      return [grn, ...prev];
    });
  };

  const handleSaveOutward = async (outward: Outward) => {
    await dbService.saveOutwardRecord(outward);
    setOutwards(prev => {
      const exists = prev.some(o => o.id === outward.id);
      if (exists) {
        return prev.map(o => o.id === outward.id ? outward : o);
      }
      return [outward, ...prev];
    });
  };

  const handleDeleteOutward = async (id: string) => {
    await dbService.deleteOutwardRecord(id);
    setOutwards(prev => prev.filter(o => o.id !== id));
  };

  const handleDeleteGrn = async (id: string) => {
    await dbService.deleteGrn(id);
    setGrns(prev => prev.filter(g => g.id !== id));
  };

  const handleApproveQc = async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    await dbService.updateGrnStatus(id, 'Approved', todayStr);
    setGrns(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, qcStatus: 'Approved', qcReleaseDate: todayStr };
      }
      return g;
    }));
  };

  const handleRejectQc = async (id: string) => {
    await dbService.updateGrnStatus(id, 'Rejected', '');
    setGrns(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, qcStatus: 'Rejected', qcReleaseDate: undefined };
      }
      return g;
    }));
  };

  const isDBActive = dbService.isFirebaseActive();

  // Loading state visualizer
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <Activity className="absolute text-blue-600 w-5 h-5 animate-pulse" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">
          Syncing Warehouse Database...
        </p>
      </div>
    );
  }

  // Not Logged In screen container
  if (!currentUser) {
    return <LoginScreen users={users} onLoginSuccess={handleLoginSuccess} />;
  }

  // Render correct tab view
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeLauncher 
            currentUser={currentUser} 
            materials={materials} 
            grns={grns} 
            outwards={outwards} 
            onSelectTab={(tab) => setActiveTab(tab)} 
            onSelectInwardType={(source) => {
              setDefaultInwardSource(source);
              setActiveTab('grn');
            }}
            onSelectOutwardType={(type) => {
              setDefaultOutwardType(type);
              setActiveTab('outward');
            }}
            theme={theme}
          />
        );
      case 'assign':
        return (
          <AssignTab 
            grns={grns} 
            materials={materials}
            onSaveGrn={handleSaveGrn}
            currentUser={currentUser}
            theme={theme}
          />
        );
      case 'grn':
        return (
          <GrnTab 
            materials={materials} 
            grns={grns} 
            onSaveGrn={handleSaveGrn} 
            onDeleteGrn={handleDeleteGrn}
            currentUser={currentUser} 
            onSaveMaterial={handleSaveMaterial}
            defaultSourceType={defaultInwardSource}
          />
        );
      case 'qc':
        return (
          <QcTab 
            grns={grns} 
            onApproveQc={handleApproveQc} 
            onRejectQc={handleRejectQc} 
            currentUser={currentUser} 
          />
        );
      case 'inventory':
        return (
          <InventoryTab 
            grns={grns} 
            materials={materials} 
            outwards={outwards}
            currentUser={currentUser} 
            onSaveGrn={handleSaveGrn}
            theme={theme}
          />
        );
      case 'outward':
        return (
          <OutwardTab
            materials={materials}
            grns={grns}
            outwards={outwards}
            onSaveOutward={handleSaveOutward}
            onDeleteOutward={handleDeleteOutward}
            currentUser={currentUser}
            defaultOutwardType={defaultOutwardType}
          />
        );
      case 'users':
        return (
          <UsersTab 
            users={users} 
            onSaveUser={handleSaveUser} 
            currentUser={currentUser} 
            grns={grns}
            outwards={outwards}
          />
        );
      case 'settings':
        return (
          <SettingsTab 
            currentUser={currentUser} 
            grns={grns} 
            onResetDatabase={() => {
              setGrns([]);
              setMaterials([]);
              setOutwards([]);
            }}
            materials={materials}
            outwards={outwards}
            users={users}
            onImportBackup={handleImportBackup}
            onSaveMaterial={handleSaveMaterial}
            theme={theme}
          />
        );
      default:
        return <div className="p-4 text-center">Screen not resolved.</div>;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-[#00685f]/20 selection:text-white transition-colors duration-300 ${
      theme === 'light' ? 'bg-[#faf8ff] text-[#1e293b]' : 'bg-[#0b1326] text-[#dae2fd]'
    }`}>
      
      {/* 2. Main Container holding Upper header, Subnav, Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Upper Universal Header with Glass backdrop-blur */}
        <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
          theme === 'light' 
            ? 'bg-white border-slate-200 shadow-xs text-black' 
            : 'bg-[#0b1326]/90 border-white/10 shadow-lg text-white'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 gap-4">
              
              {/* Left Side: Brand & Buttons */}
              <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2">
                {/* Brand Logo & Name */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`p-1.5 rounded-lg border transition-colors ${
                    theme === 'light' 
                      ? 'bg-blue-50 border-blue-100 text-blue-600' 
                      : 'bg-[#8ed5ff]/10 border border-[#8ed5ff]/20 text-[#8ed5ff]'
                  }`}>
                    <Database className="w-4.5 h-4.5" />
                  </div>
                  <span className={`font-extrabold text-sm sm:text-base tracking-tight font-sans transition-colors ${
                    theme === 'light' ? 'text-black' : 'text-white'
                  }`}>
                    Inventory Pro
                  </span>
                </div>

                {/* Vertical Divider */}
                <div className="h-5 w-[1px] bg-slate-300 dark:bg-white/10 shrink-0 hidden sm:block" />

                {/* Navigation Tab buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  
                  {/* 1. Inward GRN Button (Alt+1) */}
                  {localStorage.getItem('cfg_inward_enabled') !== 'false' && (
                    <button
                      onClick={() => setActiveTab('grn')}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'grn'
                          ? (theme === 'light' 
                              ? 'bg-blue-600 text-white shadow-xs' 
                              : 'bg-[#8ed5ff]/25 border border-[#8ed5ff]/35 text-white')
                          : (theme === 'light'
                              ? 'text-black hover:bg-blue-50/50 hover:text-blue-600'
                              : 'text-[#bdc8d1] hover:bg-white/5 hover:text-white')
                      }`}
                    >
                      <FileSpreadsheet className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'grn' ? 'text-white' : (theme === 'light' ? 'text-blue-600' : '')}`} />
                      <span className="hidden sm:inline">Inward</span>
                      {isAltPressed && (
                        <span className="absolute top-0.5 right-0.5 bg-amber-500/90 text-white text-[8px] font-bold font-mono w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white/20 shadow-md animate-scale-up z-50">
                          1
                        </span>
                      )}
                    </button>
                  )}

                  {/* 2. Outward Button (Alt+2) */}
                  {localStorage.getItem('cfg_outward_enabled') !== 'false' && (
                    <button
                      onClick={() => setActiveTab('outward')}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'outward'
                          ? (theme === 'light' 
                              ? 'bg-blue-600 text-white shadow-xs' 
                              : 'bg-[#8ed5ff]/25 border border-[#8ed5ff]/35 text-white')
                          : (theme === 'light'
                              ? 'text-black hover:bg-blue-50/50 hover:text-blue-600'
                              : 'text-[#bdc8d1] hover:bg-white/5 hover:text-white')
                      }`}
                    >
                      <Layers className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'outward' ? 'text-white' : (theme === 'light' ? 'text-blue-600' : '')}`} />
                      <span className="hidden sm:inline">Outward</span>
                      {isAltPressed && (
                        <span className="absolute top-0.5 right-0.5 bg-amber-500/90 text-white text-[8px] font-bold font-mono w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white/20 shadow-md animate-scale-up z-50">
                          2
                        </span>
                      )}
                    </button>
                  )}

                  {/* 3. Inventory Master Button (Alt+3) */}
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'inventory'
                        ? (theme === 'light' 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : 'bg-[#8ed5ff]/25 border border-[#8ed5ff]/35 text-white')
                        : (theme === 'light'
                            ? 'text-black hover:bg-blue-50/50 hover:text-blue-600'
                            : 'text-[#bdc8d1] hover:bg-white/5 hover:text-white')
                    }`}
                  >
                    <Boxes className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'inventory' ? 'text-white' : (theme === 'light' ? 'text-blue-600' : '')}`} />
                    <span className="hidden sm:inline">Inventory</span>
                    {isAltPressed && (
                      <span className="absolute top-0.5 right-0.5 bg-amber-500/90 text-white text-[8px] font-bold font-mono w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white/20 shadow-md animate-scale-up z-50">
                        3
                      </span>
                    )}
                  </button>

                  {/* 4. Assign Pellets/Drums Button (Alt+4) */}
                  <button
                    onClick={() => setActiveTab('assign')}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'assign'
                        ? (theme === 'light' 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : 'bg-[#8ed5ff]/25 border border-[#8ed5ff]/35 text-white')
                        : (theme === 'light'
                            ? 'text-black hover:bg-blue-50/50 hover:text-blue-600'
                            : 'text-[#bdc8d1] hover:bg-white/5 hover:text-white')
                    }`}
                  >
                    <Sliders className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'assign' ? 'text-white' : (theme === 'light' ? 'text-blue-600' : '')}`} />
                    <span className="hidden sm:inline">Assign</span>
                    {isAltPressed && (
                      <span className="absolute top-0.5 right-0.5 bg-amber-500/90 text-white text-[8px] font-bold font-mono w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white/20 shadow-md animate-scale-up z-50">
                        4
                      </span>
                    )}
                  </button>

                  {/* 5. QC Inspection (Only if enabled!) */}
                  {localStorage.getItem('cfg_qc_inspection') === 'true' && (
                    <button
                      onClick={() => setActiveTab('qc')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                        activeTab === 'qc'
                          ? (theme === 'light' 
                              ? 'bg-blue-600 text-white shadow-xs' 
                              : 'bg-[#8ed5ff]/25 border border-[#8ed5ff]/35 text-white')
                          : (theme === 'light'
                              ? 'text-black hover:bg-blue-50/50 hover:text-blue-600'
                              : 'text-[#bdc8d1] hover:bg-white/5 hover:text-white')
                      }`}
                    >
                      <Hourglass className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'qc' ? 'text-white' : (theme === 'light' ? 'text-blue-600' : '')}`} />
                      <span className="hidden sm:inline font-bold">QC Desk</span>
                      {grns.filter(g => g.qcStatus === 'Pending').length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                    </button>
                  )}

                </div>
              </div>

              {/* Right Side: Settings Icon, Company Name, Logo/Avatar */}
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                
                {/* 1. Settings Icon */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`relative p-2 rounded-xl border transition duration-200 cursor-pointer ${
                    activeTab === 'settings'
                      ? (theme === 'light' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#8ed5ff] border-[#8ed5ff] text-[#0b1326]')
                      : (theme === 'light'
                          ? 'bg-slate-50 hover:bg-blue-50/40 border-slate-200 text-blue-600 hover:text-blue-700'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-[#8ed5ff]')
                  }`}
                  title="System Operation Settings"
                >
                  <Settings className={`w-4 h-4 hover:rotate-45 transition-transform duration-300 ${activeTab === 'settings' ? 'text-white' : (theme === 'light' ? 'text-blue-600' : '')}`} />
                  {isAltPressed && (
                    <span className="absolute top-0 right-0 bg-amber-500/90 text-white text-[8px] font-bold font-mono w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white/20 shadow-md animate-scale-up z-50">
                      5
                    </span>
                  )}
                </button>

                {/* 2. Theme Toggle (Night Mode) */}
                <button
                  onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                  className={`p-2 rounded-xl border transition duration-200 cursor-pointer flex items-center justify-center h-9 w-9 ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-205 text-slate-700 hover:bg-slate-100'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-400'
                  }`}
                  title={theme === 'light' ? "Switch to Night Mode" : "Switch to Day Mode"}
                >
                  {theme === 'light' ? (
                    <Moon className="w-4 h-4 text-slate-600" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-450" />
                  )}
                </button>

                {/* 3. Company Name */}
                <div className="text-right font-sans shrink-0">
                  <div className="text-xs font-extrabold tracking-tight uppercase truncate max-w-[140px]" title={companyProfile?.companyName}>
                    {companyProfile?.companyName && companyProfile.companyName.trim() !== '' ? companyProfile.companyName : 'U Liva Nutrition'}
                  </div>
                  <div className="text-[9px] font-bold text-slate-450 dark:text-[#8ed5ff] tracking-widest mt-0.5 uppercase">
                    {currentUser.role}
                  </div>
                </div>

                {/* 4. Corporate Logo (extreme right edge) */}
                <div 
                  className={`w-9 h-9 rounded-full overflow-hidden border select-none shrink-0 ${
                    theme === 'light' ? 'border-[#e2e8f0]' : 'border-white/10'
                  }`}
                >
                  <img 
                    className="w-full h-full object-cover" 
                    src={companyProfile?.logoUrl && companyProfile.logoUrl.trim() !== '' ? companyProfile.logoUrl : "https://lh3.googleusercontent.com/aida-public/AB6AXuAG2me3gHBy6yuJ7im6uavIAKsVHvRqXczkjlQttfvzWv-CIAiTs6xuohIN6CQT1MF09fjwBVhpQ9YcMmB7SB_0XpOvAxzhF5DrnBDr8NbtFXZ18V9ZYO55QMYDf1Pyj_N4gBRtL-ti72-KWtmf4GKvmYaSIkH3U3wDs3gEmsH_wPp14mHC4RzHchZK7xCB5MGczjpkHAB_6x5ShUg2daJFJONIgr9AcetQ2GABO3CRsYgaPy3aBCHyRPdcAky9Ubdvh73odUcK_wJH"} 
                    alt="Logo"
                    referrerPolicy="no-referrer"
                  />
                </div>

              </div>

            </div>
          </div>
        </header>

        {/* Navigation Subbar (Dynamic Breadcrumb Navigation) */}
        {activeTab !== 'home' && (
          <nav className={`py-3 px-4 sticky top-16 z-30 shadow-sm backdrop-blur-md border-b transition-colors ${
            theme === 'light' 
              ? 'bg-white/95 border-[#e2e8f0]' 
              : 'bg-[#131b2e]/90 border-white/10 shadow-2xl'
          }`}>
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              
              <button
                onClick={() => setActiveTab('home')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition duration-150 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-205 text-blue-605 hover:bg-blue-50/40 hover:border-blue-200'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-sky-400 hover:text-sky-300'
                }`}
                title="Go back to Home screen (or press ESC key)"
              >
                <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                <span>Back to Home</span>
              </button>

              {/* Context breadcrumb info */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold font-mono tracking-widest hidden xs:block ${
                  theme === 'light' ? 'text-[#475569]' : 'text-[#87929a]'
                }`}>
                  Workspace Node:
                </span>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight border uppercase font-mono transition-colors ${
                  theme === 'light' 
                    ? 'bg-[#2563eb]/5 text-[#2563eb] border-[#2563eb]/20' 
                    : 'bg-[#8ed5ff]/10 text-[#8ed5ff] border border-[#8ed5ff]/20'
                }`}>
                  {activeTab === 'dashboard' && '📈 Dashboard'}
                  {activeTab === 'grn' && '📥 Inward Register'}
                  {activeTab === 'qc' && `🧪 QC Inspection Desk (${grns.filter(g => g.qcStatus === 'Pending').length} Pending)`}
                  {activeTab === 'inventory' && '📊 Inventory Master'}
                  {activeTab === 'outward' && '📤 Outward Register'}
                  {activeTab === 'users' && '👥 User Credentials Accounts'}
                  {activeTab === 'settings' && '⚙️ System Settings'}
                </span>
              </div>

            </div>
          </nav>
        )}

        {/* Main Workspace Frame */}
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>

        {/* Footer message */}
        <footer className={`py-8 text-center text-[10px] space-y-2 border-t max-w-6xl mx-auto w-full transition-colors ${
          theme === 'light' ? 'border-[#e2e8f0] text-[#475569]' : 'border-white/5 text-[#87929a]'
        }`}>
          <p className="text-xs font-medium font-sans">
            Active Workspace Session: <span className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{currentUser.name}</span> • Role: <span className="font-bold text-[#ffb9d8]">{currentUser.role}</span>
          </p>
          <p className="font-mono text-[9px] opacity-80">
            Inventory Manager &copy; 2026. Made live via GitHub Integration. Made By Smt_Gajjar. Compatible on all multi-devices.
          </p>
        </footer>
      </div>

    </div>
  );
}
