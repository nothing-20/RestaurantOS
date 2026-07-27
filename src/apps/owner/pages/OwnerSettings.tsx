import React, { useEffect, useState, useRef } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/ui/Input/Input';
import Select from '../../../components/ui/Select/Select';
import Button from '../../../components/ui/Button/Button';
import Card from '../../../components/ui/Card/Card';
import Tabs from '../../../components/ui/Tabs/Tabs';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  Building2, 
  Clock, 
  Sliders, 
  FileText, 
  ShieldCheck, 
  Save, 
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Database,
  RotateCcw
} from 'lucide-react';

export const OwnerSettings: React.FC = () => {
  const { user } = useAuth();

  // Loading & Saving States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Resolved Tenant ID state
  const [resolvedTenantId, setResolvedTenantId] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState('profile');

  // Form Fields - Restaurant Profile Tab
  const [restaurantName, setRestaurantName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressCountry, setAddressCountry] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // Form Fields - Business Hours Tab
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [workingDays, setWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [holidaySettings, setHolidaySettings] = useState('None');

  // Form Fields - Branding Tab
  const [logo, setLogo] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Form Fields - Business Settings Tab
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('GMT');
  const [language, setLanguage] = useState('en');

  // Form Fields - Tax & Compliance Tab
  const [gstNumber, setGstNumber] = useState('');
  const [pan, setPan] = useState('');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [taxPercent, setTaxPercent] = useState(5);
  const [serviceCharge, setServiceCharge] = useState(5);

  // Form Fields - QR & Seating Tab
  const [tableServiceEnabled, setTableServiceEnabled] = useState(true);
  const [qrOrderingEnabled, setQrOrderingEnabled] = useState(true);

  // Demo Mode States
  const [selectedPreset, setSelectedPreset] = useState<'italian' | 'japanese'>('italian');
  const [isResettingDemo, setIsResettingDemo] = useState(false);

  // Field validation error states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleResetDemoData = async () => {
    const targetTenantId = resolvedTenantId || user?.tenantId;
    if (!targetTenantId) {
      toast.error('Could not resolve tenant workspace.');
      return;
    }

    const confirm = window.confirm(
      `WARNING: This will completely delete all active orders, inventory levels, menu categories, tables, employees, and review items for this tenant, then seed new demo data for "${selectedPreset === 'italian' ? 'Bella Italia Bistro' : 'Sakura Zen Ramen'}". Proceed?`
    );
    if (!confirm) return;

    setIsResettingDemo(true);
    toast.loading('Resetting and seeding demo database...', { id: 'demo-seeder' });

    try {
      const { demoService } = await import('../../../shared/services/demoService');
      const res = await demoService.seedDemoRestaurant(targetTenantId, selectedPreset);
      if (res.success) {
        toast.success(res.message, { id: 'demo-seeder' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(res.message, { id: 'demo-seeder' });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Demo seeding failed: ${err.message || 'Unknown error'}`, { id: 'demo-seeder' });
    } finally {
      setIsResettingDemo(false);
    }
  };

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Fetch tenant settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        let activeTenantId = user.tenantId;
        if (!activeTenantId && user.uid) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            activeTenantId = userSnap.data().tenantId || '';
          }
        }

        if (!activeTenantId) {
          toast.error('No associated restaurant workspace resolved.');
          setIsLoading(false);
          return;
        }

        setResolvedTenantId(activeTenantId);

        const docRef = doc(db, 'tenants', activeTenantId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          
          setRestaurantName(data.restaurantName || data.name || 'Gourmet Restaurant');
          setLogo(data.logo || data.logoUrl || '');
          setCoverImage(data.coverImage || '');
          setDescription(data.description || '');
          setCuisine(data.cuisine || 'Fine Dining');
          setGstNumber(data.gstNumber || 'GST-MOCK-12345');
          setPan(data.pan || '');
          setFssaiNumber(data.fssaiNumber || data.fssaiLicense || '12345678901234');
          setContactPhone(data.phone || '');
          setContactEmail(data.email || '');
          setWebsiteUrl(data.website || '');
          
          if (data.address) {
            if (typeof data.address === 'string') {
              setAddressStreet(data.address);
            } else {
              setAddressStreet(data.address.street || data.address.addressLine1 || '');
              setAddressCity(data.address.city || '');
              setAddressZip(data.address.zipCode || data.address.postalCode || '');
              setAddressState(data.address.state || '');
              setAddressCountry(data.address.country || 'USA');
            }
          }
          setGoogleMapsUrl(data.googleMapsUrl || '');

          if (data.businessHours) {
            setOpeningTime(data.businessHours.openingTime || '09:00');
            setClosingTime(data.businessHours.closingTime || '22:00');
            setWorkingDays(data.businessHours.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
            setHolidaySettings(data.businessHours.holidaySettings || 'None');
          } else {
            setOpeningTime(data.openingHours || '09:00');
            setClosingTime(data.closingHours || '22:00');
          }

          if (data.settings) {
            setCurrency(data.settings.currency || 'USD');
            setTimezone(data.settings.timezone || 'GMT');
            setLanguage(data.settings.language || 'en');
            setTaxPercent(data.settings.taxPercent ?? data.taxPercent ?? 5);
            setServiceCharge(data.settings.serviceCharge ?? 5);
            setTableServiceEnabled(data.settings.tableServiceEnabled ?? true);
            setQrOrderingEnabled(data.settings.qrOrderingEnabled ?? true);
          } else {
            setTaxPercent(data.taxPercent ?? 5);
            setCurrency(data.currencyCode || 'USD');
          }
        } else {
          const defaultPayload = {
            tenantId: activeTenantId,
            restaurantName: 'Gourmet Restaurant',
            name: 'Gourmet Restaurant',
            logo: '',
            coverImage: '',
            description: 'Welcome to Gourmet Restaurant!',
            cuisine: 'Fine Dining',
            gstNumber: 'GST-MOCK-12345',
            pan: '',
            fssaiNumber: '12345678901234',
            phone: user.email ? '555-019-2834' : '',
            email: user.email || '',
            website: '',
            address: {
              street: '123 Dining St',
              city: 'San Francisco',
              zipCode: '94103',
              state: 'CA',
              country: 'USA'
            },
            googleMapsUrl: '',
            businessHours: {
              openingTime: '09:00',
              closingTime: '22:00',
              workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              holidaySettings: 'None'
            },
            settings: {
              currency: 'USD',
              timezone: 'GMT',
              language: 'en',
              taxPercent: 5,
              serviceCharge: 5,
              tableServiceEnabled: true,
              qrOrderingEnabled: true
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await setDoc(docRef, defaultPayload);

          setRestaurantName(defaultPayload.restaurantName);
          setLogo(defaultPayload.logo);
          setCoverImage(defaultPayload.coverImage);
          setDescription(defaultPayload.description);
          setCuisine(defaultPayload.cuisine);
          setGstNumber(defaultPayload.gstNumber);
          setPan(defaultPayload.pan);
          setFssaiNumber(defaultPayload.fssaiNumber);
          setContactPhone(defaultPayload.phone);
          setContactEmail(defaultPayload.email);
          setWebsiteUrl(defaultPayload.website);
          setAddressStreet(defaultPayload.address.street);
          setAddressCity(defaultPayload.address.city);
          setAddressZip(defaultPayload.address.zipCode);
          setAddressState(defaultPayload.address.state);
          setAddressCountry(defaultPayload.address.country);
          setGoogleMapsUrl(defaultPayload.googleMapsUrl);
          setOpeningTime(defaultPayload.businessHours.openingTime);
          setClosingTime(defaultPayload.businessHours.closingTime);
          setWorkingDays(defaultPayload.businessHours.workingDays);
          setHolidaySettings(defaultPayload.businessHours.holidaySettings);
          setCurrency(defaultPayload.settings.currency);
          setTimezone(defaultPayload.settings.timezone);
          setLanguage(defaultPayload.settings.language);
          setTaxPercent(defaultPayload.settings.taxPercent);
          setServiceCharge(defaultPayload.settings.serviceCharge);
          setTableServiceEnabled(defaultPayload.settings.tableServiceEnabled);
          setQrOrderingEnabled(defaultPayload.settings.qrOrderingEnabled);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
        toast.error('Error fetching settings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!restaurantName.trim()) newErrors.restaurantName = 'Restaurant name is required.';
    if (contactEmail && !/\S+@\S+\.\S+/.test(contactEmail)) newErrors.contactEmail = 'Enter a valid email address.';
    if (contactPhone && contactPhone.length < 8) newErrors.contactPhone = 'Enter a valid contact number.';
    if (websiteUrl && !websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      newErrors.websiteUrl = 'URL must start with http:// or https://';
    }
    if (googleMapsUrl && !googleMapsUrl.startsWith('http://') && !googleMapsUrl.startsWith('https://')) {
      newErrors.googleMapsUrl = 'URL must start with http:// or https://';
    }
    if (taxPercent < 0 || taxPercent > 100) newErrors.taxPercent = 'Tax rate must be between 0 and 100.';
    if (serviceCharge < 0 || serviceCharge > 100) newErrors.serviceCharge = 'Service charge must be between 0 and 100.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e?: React.FormEvent, silent = false) => {
    if (e) e.preventDefault();
    const targetTenantId = resolvedTenantId || user?.tenantId;
    if (!targetTenantId) {
      if (!silent) toast.error('Unresolved restaurant profile.');
      return;
    }

    if (!validateForm()) {
      if (!silent) toast.error('Please fix validation errors before saving.');
      return;
    }

    if (!silent) setIsSaving(true);
    setSaveStatus('saving');

    try {
      const docRef = doc(db, 'tenants', targetTenantId);
      
      const payload = {
        name: restaurantName,
        restaurantName,
        logo,
        logoUrl: logo,
        coverImage,
        description,
        cuisine,
        gstNumber,
        pan,
        fssaiNumber,
        phone: contactPhone,
        email: contactEmail,
        website: websiteUrl,
        address: {
          street: addressStreet,
          city: addressCity,
          zipCode: addressZip,
          state: addressState,
          country: addressCountry
        },
        googleMapsUrl,
        businessHours: {
          openingTime,
          closingTime,
          workingDays,
          holidaySettings
        },
        settings: {
          currency,
          timezone,
          language,
          taxPercent,
          serviceCharge,
          tableServiceEnabled,
          qrOrderingEnabled
        },
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, payload);
      
      setSaveStatus('saved');
      if (!silent) toast.success('Profile configurations saved!');
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      if (!silent) toast.error('Failed to save settings.');
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  const triggerAutoSave = () => {
    handleSave(undefined, true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
        setTimeout(() => handleSave(undefined, true), 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Cover image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
        setTimeout(() => handleSave(undefined, true), 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDay = (day: string) => {
    const updated = workingDays.includes(day)
      ? workingDays.filter(d => d !== day)
      : [...workingDays, day];
    setWorkingDays(updated);
    setTimeout(() => handleSave(undefined, true), 100);
  };

  const settingsTabs = [
    { id: 'profile', label: 'Restaurant Profile', icon: Building2 },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'branding', label: 'Branding', icon: ImageIcon },
    { id: 'business', label: 'Business Settings', icon: Sliders },
    { id: 'tax', label: 'Tax & Compliance', icon: FileText },
    { id: 'qr', label: 'QR & Seating', icon: ShieldCheck },
    { id: 'demo', label: 'Demo Mode', icon: Database }
  ];

  return (
    <div className="space-y-6 text-left select-none pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-850">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-textPearl">Restaurant Profile & Settings</h1>
          <p className="text-xs text-mutedAsh font-semibold">Update brand assets, hours of operation, and financial configs.</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          {saveStatus === 'saving' && (
            <span className="text-slate-400 animate-pulse">Auto-saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 animate-bounce" />
              <span>All changes saved to database</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Auto-save failed</span>
            </span>
          )}
        </div>
      </div>

      <Tabs 
        tabs={settingsTabs}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
        
        {activeTab === 'profile' && (
          <Card className="p-6 border-slate-850 bg-slate-900/40 space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-850">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wide">Restaurant Profile</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Restaurant Business Name *"
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                onBlur={triggerAutoSave}
                error={errors.restaurantName}
                required
              />
              <Input 
                label="Cuisine Specialty *"
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                onBlur={triggerAutoSave}
                placeholder="Italian, Continental, Fusion"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label="Contact Phone *"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                onBlur={triggerAutoSave}
                error={errors.contactPhone}
                required
              />
              <Input 
                label="Public Email *"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                onBlur={triggerAutoSave}
                error={errors.contactEmail}
                required
              />
              <Input 
                label="Website URL"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onBlur={triggerAutoSave}
                placeholder="https://gourmet.com"
                error={errors.websiteUrl}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Input 
                  label="Street Address *"
                  type="text"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  onBlur={triggerAutoSave}
                  required
                />
              </div>
              <Input 
                label="City *"
                type="text"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                onBlur={triggerAutoSave}
                required
              />
              <Input 
                label="State / Region *"
                type="text"
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
                onBlur={triggerAutoSave}
                required
              />
              <Input 
                label="Zip Code *"
                type="text"
                value={addressZip}
                onChange={(e) => setAddressZip(e.target.value)}
                onBlur={triggerAutoSave}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Country *"
                type="text"
                value={addressCountry}
                onChange={(e) => setAddressCountry(e.target.value)}
                onBlur={triggerAutoSave}
                required
              />
              <Input 
                label="Google Maps Location URL"
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                onBlur={triggerAutoSave}
                placeholder="https://maps.google.com/?q=..."
                error={errors.googleMapsUrl}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Business Description</label>
              <textarea
                placeholder="Describe your dining workspace backstory..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={triggerAutoSave}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-primary text-textPearl text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-slate-600 outline-none"
                rows={3}
              />
            </div>
          </Card>
        )}

        {activeTab === 'hours' && (
          <Card className="p-6 border-slate-850 bg-slate-900/40 space-y-5">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-850">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wide">Business Hours</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label="Opening Hours *"
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                onBlur={triggerAutoSave}
                required
              />
              <Input 
                label="Closing Hours *"
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                onBlur={triggerAutoSave}
                required
              />
              <Select 
                label="Holiday preset"
                options={[
                  { value: 'None', label: 'None / Open Daily' },
                  { value: 'Closed Public Holidays', label: 'Closed on Public Holidays' },
                  { value: 'Temporary Closed', label: 'Temporary Closed' }
                ]}
                value={holidaySettings}
                onChange={(e) => {
                  setHolidaySettings(e.target.value);
                  setTimeout(() => handleSave(undefined, true), 100);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Weekly Operating Days</label>
              <div className="flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isActive = workingDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-4.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        isActive 
                          ? 'bg-primary border-primary text-background' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-textPearl'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'branding' && (
          <Card className="p-6 border-slate-850 bg-slate-900/40 space-y-6">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-850">
              <ImageIcon className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wide">Branding Visual Assets</h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex flex-col items-center space-y-2 shrink-0">
                <span className="text-xs font-semibold text-slate-400 w-full text-left">Brand Logo</span>
                <div className="relative w-28 h-28 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all group">
                  {logo ? (
                    <>
                      <img src={logo} alt="Logo preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-textPearl text-[10px] font-bold text-center">
                        <span>Change Logo</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-slate-500 space-y-1 p-2">
                      <ImageIcon className="w-5 h-5 mx-auto text-slate-700" />
                      <span className="text-[9px] font-bold block">Upload Logo</span>
                    </div>
                  )}
                  <input 
                    type="file"
                    accept="image/*"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-2 w-full">
                <span className="text-xs font-semibold text-slate-400 block">Branding Cover Photo</span>
                <div className="relative h-28 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all group">
                  {coverImage ? (
                    <>
                      <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-textPearl text-xs font-bold gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <span>Upload Cover</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-slate-500 space-y-1">
                      <ImageIcon className="w-6 h-6 mx-auto text-slate-700" />
                      <span className="text-xs font-bold block">Upload Cover Photo</span>
                    </div>
                  )}
                  <input 
                    type="file"
                    accept="image/*"
                    ref={coverInputRef}
                    onChange={handleCoverUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'business' && (
          <Card className="p-6 border-slate-850 bg-slate-900/40 space-y-5">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-850">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wide">Business Configurations</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select 
                label="Currency Code *"
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'INR', label: 'INR (₹)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'AED', label: 'AED (AED)' },
                  { value: 'SAR', label: 'SAR (SR)' },
                  { value: 'AUD', label: 'AUD ($)' },
                  { value: 'CAD', label: 'CAD ($)' },
                  { value: 'JPY', label: 'JPY (¥)' },
                  { value: 'SGD', label: 'SGD (S$)' },
                  { value: 'MYR', label: 'MYR (RM)' },
                  { value: 'THB', label: 'THB (฿)' }
                ]}
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  setTimeout(() => handleSave(undefined, true), 100);
                }}
              />
              <Select 
                label="Timezone Region *"
                options={[
                  { value: 'GMT', label: 'GMT (UTC+0)' },
                  { value: 'EST', label: 'EST (UTC-5)' },
                  { value: 'IST', label: 'IST (UTC+5:30)' },
                  { value: 'PST', label: 'PST (UTC-8)' }
                ]}
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  setTimeout(() => handleSave(undefined, true), 100);
                }}
              />
              <Select 
                label="System Language *"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' }
                ]}
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setTimeout(() => handleSave(undefined, true), 100);
                }}
              />
            </div>
          </Card>
        )}

        {activeTab === 'tax' && (
          <Card className="p-6 border-slate-850 bg-slate-900/40 space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-850">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wide">Tax & Regulatory Compliance</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label="GST Number *"
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                onBlur={triggerAutoSave}
                placeholder="22AAAAA0000A1Z5"
                required
              />
              <Input 
                label="PAN Card Number"
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                onBlur={triggerAutoSave}
                placeholder="ABCDE1234F"
              />
              <Input 
                label="FSSAI License *"
                type="text"
                value={fssaiNumber}
                onChange={(e) => setFssaiNumber(e.target.value)}
                onBlur={triggerAutoSave}
                placeholder="12345678901234"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="GST / Tax Rate (%) *"
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                onBlur={triggerAutoSave}
                error={errors.taxPercent}
                required
              />
              <Input 
                label="Service Charge Fee (%) *"
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(Number(e.target.value))}
                onBlur={triggerAutoSave}
                error={errors.serviceCharge}
                required
              />
            </div>
          </Card>
        )}

        {activeTab === 'qr' && (
          <Card className="p-6 border-slate-850 bg-slate-900/40 space-y-4">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-850">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wide">QR Ordering & Seating Services</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="p-4 bg-slate-955/40 border border-slate-850 rounded-2xl flex items-center justify-between cursor-pointer hover:border-primary transition-all">
                <div className="space-y-0.5 text-left">
                  <span className="text-xs font-bold text-textPearl">Enable Seating Table Service</span>
                  <p className="text-[10px] text-slate-500 font-semibold">Allow waiter requests and alerts.</p>
                </div>
                <input 
                  type="checkbox"
                  checked={tableServiceEnabled}
                  onChange={(e) => {
                    setTableServiceEnabled(e.target.checked);
                    setTimeout(() => handleSave(undefined, true), 100);
                  }}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </label>

              <label className="p-4 bg-slate-955/40 border border-slate-850 rounded-2xl flex items-center justify-between cursor-pointer hover:border-primary transition-all">
                <div className="space-y-0.5 text-left">
                  <span className="text-xs font-bold text-textPearl">Enable Table-side QR Ordering</span>
                  <p className="text-[10px] text-slate-500 font-semibold">Enable self-service customer orders.</p>
                </div>
                <input 
                  type="checkbox"
                  checked={qrOrderingEnabled}
                  onChange={(e) => {
                    setQrOrderingEnabled(e.target.checked);
                    setTimeout(() => handleSave(undefined, true), 100);
                  }}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </label>
            </div>
          </Card>
        )}

        {activeTab === 'demo' && (
          <Card className="p-6 border-slate-850 bg-slate-900/40 space-y-6">
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-850">
              <Database className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-textPearl uppercase tracking-wide">Demo Mode & Reset Controls</h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-mutedAsh leading-relaxed font-semibold">
                Demo Mode allows you to populate the restaurant workspace with pre-configured high-quality menus, table seating floor layouts, clocked-in employees, realistic pending review complaints, and active inventory warnings.
              </p>

              <div className="p-4 bg-slate-955/40 border border-slate-850 rounded-2xl max-w-xl space-y-4">
                <span className="text-xs font-bold text-textPearl block">Select Cuisine Preset Theme</span>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 border rounded-xl flex flex-col justify-between h-20 cursor-pointer transition-all ${selectedPreset === 'italian' ? 'border-primary bg-primary/5' : 'border-slate-850 bg-slate-955/20 hover:border-slate-800'}`}>
                    <span className="text-xs font-bold text-textPearl">Bella Italia Bistro</span>
                    <span className="text-[9px] text-slate-500 block mt-1">Italian Pasta & Pizza</span>
                    <input 
                      type="radio" 
                      name="preset" 
                      checked={selectedPreset === 'italian'} 
                      onChange={() => setSelectedPreset('italian')} 
                      className="hidden" 
                    />
                  </label>
                  <label className={`p-3 border rounded-xl flex flex-col justify-between h-20 cursor-pointer transition-all ${selectedPreset === 'japanese' ? 'border-primary bg-primary/5' : 'border-slate-850 bg-slate-955/20 hover:border-slate-800'}`}>
                    <span className="text-xs font-bold text-textPearl">Sakura Zen Ramen</span>
                    <span className="text-[9px] text-slate-500 block mt-1">Japanese Sushi & Ramen</span>
                    <input 
                      type="radio" 
                      name="preset" 
                      checked={selectedPreset === 'japanese'} 
                      onChange={() => setSelectedPreset('japanese')} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  type="button"
                  onClick={handleResetDemoData}
                  isLoading={isResettingDemo}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  <span>Reset & Seed Demo Database</span>
                </Button>
                <span className="text-[10px] text-slate-500 font-semibold max-w-xs leading-normal">
                  * This action will wipe all existing data under this tenant and initialize the new sandbox environment.
                </span>
              </div>
            </div>
          </Card>
        )}

        {activeTab !== 'demo' && (
          <div className="pt-2 text-right">
            <Button
              type="submit"
              isLoading={isSaving}
              className="px-8 shadow-xl shadow-primary/10"
            >
              <Save className="w-4 h-4 mr-2" />
              <span>Save configurations</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default OwnerSettings;
