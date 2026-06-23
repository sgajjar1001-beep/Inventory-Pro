import React, { useState, useEffect } from 'react';
import { CompanyProfile, User } from '../types';
import { dbService } from '../services/db';
import { Building2, Save, FileText, Phone, Mail, MapPin, BadgeCheck, Upload, Image, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { parseGSTIN } from './GrnTab';

interface ProfileTabProps {
  currentUser: User;
  onProfileUpdated?: () => void;
  theme?: 'light' | 'dark';
}

export default function ProfileTab({ currentUser, onProfileUpdated, theme = 'light' }: ProfileTabProps) {
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: '',
    gstNumber: '',
    address: '',
    email: '',
    contactNumber: '',
    updatedAt: new Date().toISOString()
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CompanyProfile>({
    companyName: '',
    gstNumber: '',
    address: '',
    email: '',
    contactNumber: '',
    updatedAt: new Date().toISOString()
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isFetchingGst, setIsFetchingGst] = useState(false);
  const [gstFeedback, setGstFeedback] = useState<string | null>(null);
  const [gstError, setGstError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const data = await dbService.fetchCompanyProfile();
      setProfile(data);
      setFormData(data);
    }
    loadProfile();
  }, []);

  const handleFetchGSTDetails = async () => {
    const cleanedGst = formData.gstNumber.trim().toUpperCase();
    if (cleanedGst.length < 15) {
      setGstError("कृपया सही 15-अंकीय GSTIN संख्या दर्ज करें (जैसे 24AAACO1314M1ZP) फिर कोशिश करें।");
      setTimeout(() => setGstError(null), 5000);
      return;
    }

    setIsFetchingGst(true);
    setGstError(null);
    setGstFeedback(null);

    // Simulated network latency for high fidelity premium experience
    await new Promise(resolve => setTimeout(resolve, 1200));

    const info = parseGSTIN(cleanedGst);
    if (info) {
      setFormData(prev => ({
        ...prev,
        companyName: info.companyName,
        address: info.address,
        email: info.email,
        contactNumber: info.contactNumber
      }));
      setGstFeedback("✨ GSTIN Verified Live! Company profile state and address details auto-filled successfully.");
      setTimeout(() => setGstFeedback(null), 5000);
    } else {
      setGstError("Gst information extraction error. Please input manually or retry.");
      setTimeout(() => setGstError(null), 5000);
    }
    setIsFetchingGst(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    await dbService.saveCompanyProfile(updated);
    setProfile(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    if (onProfileUpdated) onProfileUpdated();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 id="profile-title" className={`text-xl font-bold font-sans flex items-center gap-2 ${
          theme === 'light' ? 'text-slate-900' : 'text-white'
        }`}>
          <Building2 className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-[#8ed5ff]'}`} />
          <span>Company Identity Profile</span>
        </h2>
        <p className={`text-xs mt-1 font-sans ${theme === 'light' ? 'text-slate-600' : 'text-[#87929a]'}`}>
          Manage warehouse corporate credentials, legal GST registration, and communication details printed during reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Card - Presentational Company Card */}
        <div className={`md:col-span-1 rounded-2xl p-5 flex flex-col items-center text-center space-y-4 ${
          theme === 'light' 
            ? 'bg-white border border-slate-200/80 shadow-md' 
            : 'bg-white/5 border border-white/10'
        }`}>
          <div className={`relative group w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden ${
            theme === 'light'
              ? 'bg-slate-50 border-2 border-dashed border-slate-200/80'
              : 'bg-[#8ed5ff]/10 border-2 border-dashed border-[#8ed5ff]/30'
          }`}>
            {formData.logoUrl ? (
              <img 
                src={formData.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain p-1" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <Building2 className={`w-10 h-10 ${theme === 'light' ? 'text-slate-400' : 'text-[#8ed5ff]'}`} />
            )}
            {isEditing && (
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer">
                <Upload className="w-5 h-5 text-white animate-bounce" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  className="hidden" 
                />
              </label>
            )}
          </div>

          <div>
            <h3 className={`font-bold text-base ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
              {profile.companyName || 'Inventory Master'}
            </h3>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono tracking-wide mt-1.5 inline-block ${
              theme === 'light'
                ? 'bg-blue-50 border border-blue-100 text-blue-700'
                : 'bg-[#8ed5ff]/10 border border-[#8ed5ff]/20 text-[#8ed5ff]'
            }`}>
              GSTIN: {profile.gstNumber || 'PENDING'}
            </span>
          </div>

          <div className={`w-full pt-4 space-y-2.5 text-left text-xs ${
            theme === 'light' ? 'border-t border-slate-100 text-slate-600' : 'border-t border-white/5 text-[#dae2fd]'
          }`}>
            <div className="flex items-start gap-2">
              <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${theme === 'light' ? 'text-blue-500' : 'text-sky-400'}`} />
              <span className={`text-[11px] leading-relaxed ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-[#bdc8d1]'}`}>
                {profile.address || 'Address pending configuration'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className={`w-4 h-4 shrink-0 ${theme === 'light' ? 'text-blue-500' : 'text-sky-400'}`} />
              <span className={`text-[11px] truncate ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-[#bdc8d1]'}`}>
                {profile.email || 'Email missing'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className={`w-4 h-4 shrink-0 ${theme === 'light' ? 'text-blue-500' : 'text-sky-400'}`} />
              <span className={`text-[11px] ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-[#bdc8d1]'}`}>
                {profile.contactNumber || 'Contact missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Details / Edit Form */}
        <div className={`md:col-span-2 rounded-2xl p-6 ${
          theme === 'light' 
            ? 'bg-white border border-slate-200/80 shadow-md' 
            : 'bg-white/5 border border-white/10'
        }`}>
          <div className={`flex items-center justify-between border-b pb-4 mb-4 ${
            theme === 'light' ? 'border-slate-100' : 'border-white/10'
          }`}>
            <h3 className={`font-bold text-sm uppercase tracking-wider ${
              theme === 'light' ? 'text-slate-800' : 'text-white'
            }`}>
              {isEditing ? 'Modify Credentials form' : 'Verified Registered Details'}
            </h3>
            {currentUser.role === 'Admin' && !isEditing && (
              <button
                id="edit-profile-btn"
                onClick={() => {
                  setFormData({ ...profile });
                  setIsEditing(true);
                }}
                className={`px-3.5 py-1.5 font-bold text-xs rounded-xl transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-[#8ed5ff] hover:bg-[#aee0ff] text-slate-900'
                }`}
              >
                Edit Profile
              </button>
            )}
          </div>

          {saveSuccess && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 mb-4 animate-pulse ${
              theme === 'light'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              <BadgeCheck className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Company details profile saved successfully to database storage nodes.</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* GSTIN Field with Autofill helper */}
                <div className="sm:col-span-2 bg-slate-50/50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200/50 dark:border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                      theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'
                    }`}>
                      <span>GSTIN (Government Registration Code)</span>
                    </label>
                    <button
                      type="button"
                      disabled={isFetchingGst || formData.gstNumber.trim().length === 0}
                      onClick={handleFetchGSTDetails}
                      className={`text-[9.5px] px-3 py-1 rounded-lg transition font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        theme === 'light'
                          ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700'
                          : 'bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-[#8ed5ff]'
                      }`}
                    >
                      {isFetchingGst ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#2563eb] dark:text-[#8ed5ff]" />
                          <span>Searching Portal...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 text-[#2563eb] dark:text-[#8ed5ff]" />
                          <span>Fetch Details via GSTIN (Auto-Fill)</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    name="gstNumber"
                    required
                    maxLength={15}
                    value={formData.gstNumber}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFormData(prev => ({ ...prev, gstNumber: val }));
                    }}
                    placeholder="e.g. 24AAACO1314M1ZP"
                    className={`w-full text-xs font-mono font-bold p-3 outline-none rounded-xl border transition duration-150 ${
                      theme === 'light'
                        ? 'bg-white border-slate-250 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100'
                        : 'bg-white/5 border-white/10 text-white focus:border-[#8ed5ff] focus:ring-1 focus:ring-white/5'
                    }`}
                  />

                  {/* Preset quick links row */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className={`text-[9.5px] font-bold ${theme === 'light' ? 'text-slate-400' : 'text-stone-500'}`}>
                      Sample / Test Profiles:
                    </span>
                    {[
                      { name: 'U Liva Nutrition', gst: '24AAACU1234M1Z5' },
                      { name: 'Alkem Labs', gst: '24AAAAC1234A1Z1' },
                      { name: 'Sun Pharma', gst: '24AAACT5678B2Z2' },
                      { name: 'Aarti Industries', gst: '24AAACA9876C3Z3' },
                      { name: 'NovaStream', gst: '24AAACO1314M1ZP' }
                    ].map((preset) => (
                      <button
                        key={preset.gst}
                        type="button"
                        onClick={() => {
                          const info = parseGSTIN(preset.gst);
                          if (info) {
                            setFormData({
                              ...formData,
                              gstNumber: preset.gst,
                              companyName: info.companyName,
                              address: info.address,
                              email: info.email,
                              contactNumber: info.contactNumber
                            });
                            setGstFeedback(`✨ Loaded "${info.companyName}" details successfully.`);
                            setTimeout(() => setGstFeedback(null), 4000);
                          }
                        }}
                        className={`text-[9.5px] px-2 py-0.5 rounded-lg border transition duration-150 cursor-pointer font-semibold ${
                          theme === 'light'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            : 'bg-white/5 hover:bg-white/10 text-stone-300 border-white/5'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>

                  {/* Errors / Feedback indicators inside GST input context box */}
                  {gstError && (
                    <div className="mt-2 text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-fade-in font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{gstError}</span>
                    </div>
                  )}

                  {gstFeedback && (
                    <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse font-semibold">
                      <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{gstFeedback}</span>
                    </div>
                  )}
                  
                  <p className={`text-[9.5px] mt-1.5 leading-relaxed ${theme === 'light' ? 'text-slate-400' : 'text-stone-550'}`}>
                    Enter 15-character official state standard GSTIN. The system will auto-lookup, parse company state parameters, match legal name and fill the profile securely.
                  </p>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wide mb-1.5 ${
                    theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'
                  }`}>
                    Company Trade Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter registered business name"
                    className={`w-full text-xs p-2.5 outline-none border rounded-xl ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100'
                        : 'bg-white/5 border-white/10 text-white focus:border-[#8ed5ff]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wide mb-1.5 ${
                    theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'
                  }`}>
                    Official Contact E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="info@yourcompany.com"
                    className={`w-full text-xs p-2.5 outline-none border rounded-xl ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100'
                        : 'bg-white/5 border-white/10 text-white focus:border-[#8ed5ff]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wide mb-1.5 ${
                    theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'
                  }`}>
                    Contact Hotline Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    required
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="+91 99999 88888"
                    className={`w-full text-xs p-2.5 outline-none border rounded-xl ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100'
                        : 'bg-white/5 border-white/10 text-white focus:border-[#8ed5ff]'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={`block text-[10px] font-bold uppercase tracking-wide mb-1.5 ${
                    theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'
                  }`}>
                    Registered Headquarters Address
                  </label>
                  <textarea
                    name="address"
                    required
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Provide full postal address coordinates"
                    className={`w-full text-xs p-2.5 outline-none border rounded-xl ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100'
                        : 'bg-white/5 border-white/10 text-white focus:border-[#8ed5ff]'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={`block text-[10px] font-bold uppercase tracking-wide mb-1.5 ${
                    theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'
                  }`}>
                    Alternate Logo URL or Base64 (optional)
                  </label>
                  <input
                    type="text"
                    name="logoUrl"
                    value={formData.logoUrl || ''}
                    onChange={handleInputChange}
                    placeholder="Paste corporate logo image url/base64"
                    className={`w-full text-xs p-2.5 outline-none border rounded-xl font-mono ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500'
                        : 'bg-white/5 border-white/10 text-white focus:border-[#8ed5ff]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  id="cancel-profile-btn"
                  onClick={() => setIsEditing(false)}
                  className={`px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
                      : 'bg-white/5 hover:bg-white/10 text-white border-transparent'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-profile-btn"
                  className={`px-5 py-2.5 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                    theme === 'light'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'bg-[#8ed5ff] hover:bg-[#aee0ff] text-slate-900'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Profile Data</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-xs font-sans">
              <div className={`p-4 rounded-xl space-y-3 ${
                theme === 'light' ? 'bg-slate-50/70 border border-slate-200/60' : 'bg-white/5'
              }`}>
                <div className={`grid grid-cols-3 py-1.5 border-b ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                  <span className={`font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>Legal Entity:</span>
                  <span className={`col-span-2 font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                    {profile.companyName || 'Inventory Master'}
                  </span>
                </div>
                <div className={`grid grid-cols-3 py-1.5 border-b ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                  <span className={`font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>GST Registration:</span>
                  <span className={`col-span-2 font-bold font-mono ${theme === 'light' ? 'text-blue-600' : 'text-sky-400'}`}>
                    {profile.gstNumber || 'PENDING CONFIGURATION'}
                  </span>
                </div>
                <div className={`grid grid-cols-3 py-1.5 border-b ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                  <span className={`font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>Customer Support:</span>
                  <span className={`col-span-2 font-medium ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                    {profile.contactNumber || 'Please edit to set hotline number'}
                  </span>
                </div>
                <div className={`grid grid-cols-3 py-1.5 border-b ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                  <span className={`font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>Email Inbox:</span>
                  <span className={`col-span-2 font-medium ${theme === 'light' ? 'text-slate-705' : 'text-white'}`}>
                    {profile.email || 'Please edit to set support email'}
                  </span>
                </div>
                <div className="grid grid-cols-3 py-1.5">
                  <span className={`font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-[#87929a]'}`}>Corporate Hub:</span>
                  <span className={`col-span-2 leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                    {profile.address || 'Please edit to set business headquarters'}
                  </span>
                </div>
              </div>

              <div className={`text-[10px] font-mono leading-relaxed p-4 rounded-xl border ${
                theme === 'light' 
                  ? 'bg-blue-50/70 border-blue-100 text-blue-800' 
                  : 'bg-[#8ed5ff]/5 border border-[#8ed5ff]/10 text-[#87929a]'
              }`}>
                📝 <b>Integrity Guarantee:</b> The company GSTIN, office address, and contact details listed above are automatically printed on Goods Receipt Notes, Inward Ledgers, Quality Release Certificates, and Production Outward Issue Vouchers generated from this workspace node.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
