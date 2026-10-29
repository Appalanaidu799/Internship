import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  MapPin,
  HeartHandshake,
  Edit2,
  Save,
  Sparkles,
  Fingerprint,
  CreditCard,
  Upload,
  Eye,
  EyeOff,
  Trash2,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  calculateAge,
  validateAadhaarNumber,
  validatePanNumber,
  maskIdentityNumber,
  formatAadhaarDisplay,
  IdDocumentType
} from '../../types/auth';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { processDocumentOcr, OcrExtractionResult } from '../../lib/ocrService';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB configurable limit

export const CustomerProfile: React.FC = () => {
  const { user, customerProfile, updateCustomerProfile } = useAuth();

  // Personal Information States
  const [fullName, setFullName] = useState(
    customerProfile?.full_name || user?.fullName || (user?.email ? user.email.split('@')[0] : 'Guest Customer')
  );
  const [phone, setPhone] = useState(customerProfile?.phone || user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(customerProfile?.date_of_birth || '');
  const [gender, setGender] = useState<string>(customerProfile?.gender || 'Prefer not to say');

  // Identity Document States (Aadhaar or PAN)
  const [idProofType, setIdProofType] = useState<IdDocumentType>(
    (customerProfile?.id_proof_type as IdDocumentType) || 'Aadhar Card'
  );
  const [idProofNumber, setIdProofNumber] = useState(
    customerProfile?.id_proof_number || customerProfile?.aadhar_number || ''
  );
  const [showDocNumber, setShowDocNumber] = useState(false);
  const [docNumberError, setDocNumberError] = useState('');

  // Document Upload & Preview States
  const [docFileName, setDocFileName] = useState(customerProfile?.id_document_name || '');
  const [docFileSize, setDocFileSize] = useState(customerProfile?.id_document_size || '');
  const [docPreview, setDocPreview] = useState(customerProfile?.id_document_preview || '');
  const [docMimeType, setDocMimeType] = useState('image/jpeg');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OCR Workflow States
  const [ocrConsent, setOcrConsent] = useState(false);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>(customerProfile?.ocr_status || 'not_scanned');
  const [ocrNotice, setOcrNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [extractedReview, setExtractedReview] = useState<OcrExtractionResult | null>(null);

  // Address Details States
  const [addressLine, setAddressLine] = useState(customerProfile?.address_line || '');
  const [addressLine2, setAddressLine2] = useState(customerProfile?.address_line2 || '');
  const [city, setCity] = useState(customerProfile?.city || '');
  const [state, setState] = useState(customerProfile?.state || '');
  const [postalCode, setPostalCode] = useState(customerProfile?.postal_code || '');
  const [country, setCountry] = useState(customerProfile?.country || 'India');

  // Emergency Contact States
  const [emergencyName, setEmergencyName] = useState(customerProfile?.emergency_contact_name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(customerProfile?.emergency_contact_phone || '');

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUuid, setCopiedUuid] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Synchronize state when customerProfile changes
  useEffect(() => {
    if (customerProfile) {
      setFullName(customerProfile.full_name || user?.fullName || '');
      setPhone(customerProfile.phone || user?.phone || '');
      setDateOfBirth(customerProfile.date_of_birth || '');
      setGender(customerProfile.gender || 'Prefer not to say');
      setAddressLine(customerProfile.address_line || '');
      setAddressLine2(customerProfile.address_line2 || '');
      setCity(customerProfile.city || '');
      setState(customerProfile.state || '');
      setPostalCode(customerProfile.postal_code || '');
      setCountry(customerProfile.country || 'India');
      setEmergencyName(customerProfile.emergency_contact_name || '');
      setEmergencyPhone(customerProfile.emergency_contact_phone || '');
      setIdProofType((customerProfile.id_proof_type as IdDocumentType) || 'Aadhar Card');
      setIdProofNumber(customerProfile.id_proof_number || customerProfile.aadhar_number || '');
      setDocFileName(customerProfile.id_document_name || '');
      setDocFileSize(customerProfile.id_document_size || '');
      setDocPreview(customerProfile.id_document_preview || '');
      setOcrStatus(customerProfile.ocr_status || 'not_scanned');
    } else if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [customerProfile, user]);

  const customerCode = customerProfile?.customer_code || 'CUS-NAIDU001';
  const customerUuid = user?.id || customerProfile?.id || 'c0000000-0000-0000-0000-000000000003';
  const accountEmail = user?.email || customerProfile?.email || 'customer@gmail.com';
  const calculatedAge = calculateAge(dateOfBirth);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(customerCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {}
  };

  const handleCopyUuid = async () => {
    try {
      await navigator.clipboard.writeText(customerUuid);
      setCopiedUuid(true);
      setTimeout(() => setCopiedUuid(false), 2500);
    } catch {}
  };

  // Live validation for Aadhaar or PAN format
  const handleDocNumberChange = (rawInput: string) => {
    setDocNumberError('');
    if (idProofType === 'PAN Card') {
      const upper = rawInput.toUpperCase();
      setIdProofNumber(upper);
      if (upper && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(upper)) {
        setDocNumberError('PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).');
      }
    } else {
      setIdProofNumber(rawInput);
      const clean = rawInput.replace(/[\s-]/g, '');
      if (clean && !/^\d{12}$/.test(clean)) {
        setDocNumberError('Aadhaar must be exactly 12 numeric digits (e.g. 1234 5678 9012).');
      }
    }
  };

  const handleDocTypeChange = (newType: IdDocumentType) => {
    setIdProofType(newType);
    setDocNumberError('');
    setOcrNotice(null);
    setExtractedReview(null);
  };

  // Document file selection & size validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setOcrNotice(null);
    setExtractedReview(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError('Unsupported file type. Please upload a JPG, JPEG, or PNG image.');
      return;
    }

    // Validate size limit (5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File exceeds 5MB size limit. Please upload a smaller document image.');
      return;
    }

    setDocMimeType(file.type);
    const sizeKB = (file.size / 1024).toFixed(1);
    setDocFileSize(file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKB} KB`);
    setDocFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setDocPreview(reader.result as string);
    };
    reader.onerror = () => {
      setUploadError('Failed to read document file. Please select a valid image.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = () => {
    setDocFileName('');
    setDocFileSize('');
    setDocPreview('');
    setUploadError('');
    setOcrNotice(null);
    setExtractedReview(null);
    setOcrStatus('not_scanned');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // OCR Workflow Trigger
  const handleRunOcrExtraction = async () => {
    setOcrNotice(null);
    setExtractedReview(null);

    if (!docPreview) {
      setOcrNotice({ type: 'error', message: 'Please upload an Aadhaar or PAN document image first.' });
      return;
    }

    if (!ocrConsent) {
      setOcrNotice({
        type: 'error',
        message: 'Please provide consent before initiating automated document scanning.'
      });
      return;
    }

    setIsScanningOcr(true);
    try {
      const result = await processDocumentOcr(docPreview, docMimeType, idProofType);

      if (!result.success) {
        setOcrStatus('failed');
        setOcrNotice({
          type: 'error',
          message: result.error || 'OCR could not extract address from this document. Please enter your address manually.'
        });
        return;
      }

      setOcrStatus('extracted');

      // Auto-populate document number if readable and user has not manually entered one
      if (result.documentNumber && !idProofNumber) {
        if (result.documentType === 'PAN Card') {
          setIdProofNumber(result.documentNumber.toUpperCase());
        } else {
          setIdProofNumber(result.documentNumber);
        }
      }

      // Special handling for PAN cards: They NEVER contain residential addresses in India
      if (result.documentType === 'PAN Card' || idProofType === 'PAN Card') {
        setOcrNotice({
          type: 'info',
          message: 'PAN Card verified. Note: Indian PAN Cards do not contain a residential address; please enter your permanent address details manually below.'
        });
        return;
      }

      // For Aadhaar Card: Present Extracted Details for User Review
      if (result.hasAddress) {
        setExtractedReview(result);
        setOcrNotice({
          type: 'success',
          message: 'Aadhaar Card address details extracted! Review the extracted values below and click "Apply to Address Fields".'
        });
      } else {
        setOcrNotice({
          type: 'info',
          message: 'Document recognized, but permanent address was not clearly readable. Please enter address manually.'
        });
      }
    } catch (err: any) {
      setOcrStatus('failed');
      setOcrNotice({
        type: 'error',
        message: err?.message || 'OCR processing service is currently unavailable. Please enter address manually.'
      });
    } finally {
      setIsScanningOcr(false);
    }
  };

  // User applies extracted address to the form
  const handleApplyExtractedAddress = () => {
    if (!extractedReview) return;

    if (extractedReview.addressLine1) setAddressLine(extractedReview.addressLine1);
    if (extractedReview.addressLine2) setAddressLine2(extractedReview.addressLine2);
    if (extractedReview.city) setCity(extractedReview.city);
    if (extractedReview.state) setState(extractedReview.state);
    if (extractedReview.pincode) setPostalCode(extractedReview.pincode);
    if (extractedReview.country) setCountry(extractedReview.country);

    setExtractedReview(null);
    setOcrNotice({
      type: 'success',
      message: 'Extracted address successfully populated into your profile fields. You can review or edit if necessary.'
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    // Optional document validation if provided
    if (idProofNumber.trim()) {
      if (idProofType === 'PAN Card') {
        const val = validatePanNumber(idProofNumber);
        if (!val.isValid) {
          setProfileError(val.error || 'Invalid PAN format.');
          return;
        }
      } else if (idProofType === 'Aadhar Card') {
        const val = validateAadhaarNumber(idProofNumber);
        if (!val.isValid) {
          setProfileError(val.error || 'Invalid Aadhaar format.');
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const res = await updateCustomerProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        date_of_birth: dateOfBirth || undefined,
        gender,
        id_proof_type: idProofType,
        id_proof_number: idProofNumber.trim() || undefined,
        aadhar_number: idProofType === 'Aadhar Card' ? idProofNumber.trim() : undefined,
        id_document_name: docFileName || undefined,
        id_document_size: docFileSize || undefined,
        id_document_preview: docPreview || undefined,
        ocr_status: (ocrStatus as any) || 'not_scanned',
        ocr_verified_by_user: Boolean(ocrStatus === 'extracted'),
        address_line: addressLine.trim(),
        address_line2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        country: country.trim() || 'India',
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_phone: emergencyPhone.trim()
      });

      if (res.success) {
        setIsEditing(false);
        setProfileSuccess('Customer profile, identity document, and permanent address saved successfully.');
        setTimeout(() => setProfileSuccess(''), 5000);
      } else {
        setProfileError(res.error || 'Failed to update customer profile.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to save customer profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both new password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setPasswordError(error.message || 'Failed to update password with Supabase Auth.');
          setIsUpdatingPassword(false);
          return;
        }
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Account security credentials updated successfully.');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Password update failed.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Guest Profile & Identity Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Government-compliant KYC identification, automated OCR address extraction, and concierge stay preferences.
        </p>
      </div>

      {profileSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {profileError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{profileError}</span>
        </div>
      )}

      {/* 1. Permanent Customer Identity Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-xl ring-4 ring-white/10 shrink-0">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{fullName}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Customer
                </span>
                {docFileName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    ID Uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{accountEmail}</p>

              {/* Unique Customer Identifiers */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs">
                  <Fingerprint className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-300">Customer ID:</span>
                  <span className="font-mono font-bold text-white tracking-wider">{customerCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 hover:text-blue-300 text-slate-400 transition-colors ml-1"
                    title="Copy Customer ID"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-400">
                  <span>UUID:</span>
                  <span className="font-mono text-slate-300 truncate max-w-[140px] sm:max-w-none">{customerUuid}</span>
                  <button
                    type="button"
                    onClick={handleCopyUuid}
                    className="p-1 hover:text-blue-300 text-slate-400 transition-colors"
                    title="Copy Supabase UUID"
                  >
                    {copiedUuid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile & Documents'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Profile Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Personal & Identification Profile</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Identity document credentials, automated OCR permanent address autofill, and guest contact details.
            </p>
          </div>
          <span className="text-[11px] text-slate-400">
            Account created: {customerProfile?.created_at ? new Date(customerProfile.created_at).toLocaleDateString() : 'Active Member'}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
          {/* Section A: Personal Information */}
          <div className="space-y-4">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Basic Personal Information</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Rajesh Naidu"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address (Primary Auth)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={accountEmail}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telephone Contact</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    disabled={!isEditing}
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  disabled={!isEditing}
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section B: Identity Document (Aadhaar or PAN) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h5 className="font-bold text-slate-900">2. Identity Document Verification (Aadhaar or PAN)</h5>
              </div>
              <span className="text-[11px] text-slate-500">
                Optional for profile update; required for hotel check-in compliance.
              </span>
            </div>

            {/* Document Selector & Number Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Type
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="idProofType"
                      disabled={!isEditing}
                      checked={idProofType === 'Aadhar Card'}
                      onChange={() => handleDocTypeChange('Aadhar Card')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-800">Aadhaar Card (UIDAI)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="idProofType"
                      disabled={!isEditing}
                      checked={idProofType === 'PAN Card'}
                      onChange={() => handleDocTypeChange('PAN Card')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-800">PAN Card (Income Tax)</span>
                  </label>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Select your government identification document.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {idProofType} Number
                </label>
                <div className="relative">
                  <input
                    type={showDocNumber || isEditing ? 'text' : 'password'}
                    disabled={!isEditing}
                    value={
                      !isEditing && !showDocNumber
                        ? maskIdentityNumber(idProofNumber, idProofType)
                        : idProofType === 'Aadhar Card'
                        ? formatAadhaarDisplay(idProofNumber)
                        : idProofNumber
                    }
                    onChange={e => handleDocNumberChange(e.target.value)}
                    placeholder={idProofType === 'Aadhar Card' ? '1234 5678 9012 (12 digits)' : 'ABCDE1234F (10 characters)'}
                    maxLength={idProofType === 'Aadhar Card' ? 14 : 10}
                    className={`w-full pl-3 pr-10 py-2 bg-white disabled:bg-slate-100 border rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      docNumberError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDocNumber(!showDocNumber)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showDocNumber ? 'Hide Number' : 'Show Number'}
                  >
                    {showDocNumber ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {docNumberError && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {docNumberError}
                  </p>
                )}
                {!docNumberError && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {idProofType === 'Aadhar Card'
                      ? 'Format: Strictly 12 numeric digits.'
                      : 'Format: 5 letters, 4 digits, 1 letter (auto-uppercase).'}
                  </span>
                )}
              </div>
            </div>

            {/* Document Image Upload & Preview Section */}
            <div className="pt-2 border-t border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">
                    Upload {idProofType} Image (JPG, JPEG, PNG, WebP)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Max file size: 5 MB. Documents are encrypted and restricted for identity check-in.
                  </span>
                </div>
                {docFileName && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-emerald-600" />
                    Attached
                  </span>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                disabled={!isEditing}
                onChange={handleFileUpload}
                className="hidden"
              />

              {!docPreview ? (
                /* Unloaded dropzone */
                <div
                  onClick={() => isEditing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    isEditing
                      ? 'border-blue-300 hover:border-blue-500 hover:bg-blue-50/40 bg-white cursor-pointer'
                      : 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-75'
                  }`}
                >
                  <Upload className="w-6 h-6 text-blue-600 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-800 text-xs">
                    {isEditing ? `Click to upload ${idProofType} image` : `No ${idProofType} uploaded yet`}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Supports high-resolution camera photos or scans (up to 5MB)
                  </p>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Browse Image
                    </button>
                  )}
                </div>
              ) : (
                /* Uploaded Preview with Actions */
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={docPreview}
                      alt="Document Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-300 shadow-2xs shrink-0 bg-slate-50"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate" title={docFileName}>
                        {docFileName || `${idProofType} Image`}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Size: {docFileSize || 'Ready'} · {idProofType}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-medium mt-1">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        Stored securely with access control
                      </span>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveDocument}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                        title="Remove document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {uploadError}
                </p>
              )}

              {/* OCR Consent & Trigger Box */}
              {docPreview && isEditing && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                  <label className="flex items-start gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={ocrConsent}
                      onChange={e => setOcrConsent(e.target.checked)}
                      className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-700 text-[11px] leading-relaxed">
                      I consent to Naidu Hotel processing this document via secure OCR to extract address fields for check-in registration and billing.
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-200/60">
                    <div className="text-[11px] text-slate-500">
                      {idProofType === 'PAN Card'
                        ? 'Note: PAN cards do not contain address fields; address is entered manually.'
                        : 'OCR extracts permanent street address, city, state, and PIN code.'}
                    </div>

                    <button
                      type="button"
                      disabled={isScanningOcr || !ocrConsent}
                      onClick={handleRunOcrExtraction}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isScanningOcr ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Scanning with OCR...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Scan & Autofill Address</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* OCR Notice / Result Banner */}
              {ocrNotice && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    ocrNotice.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : ocrNotice.type === 'info'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {ocrNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : ocrNotice.type === 'info' ? (
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{ocrNotice.message}</span>
                </div>
              )}

              {/* Extracted Address Review Card (Allows user review before applying) */}
              {extractedReview && (
                <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-1.5">
                    <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Review Extracted Aadhaar Address
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded">
                      Confirmation Required
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Address Line 1:</span>
                      <span className="font-semibold text-slate-800">{extractedReview.addressLine1 || '(Not detected)'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Address Line 2:</span>
                      <span className="font-semibold text-slate-800">{extractedReview.addressLine2 || '(Not detected)'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">City:</span>
                      <span className="font-semibold text-slate-800">{extractedReview.city || '(Not detected)'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">State:</span>
                      <span className="font-semibold text-slate-800">{extractedReview.state || '(Not detected)'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">PIN Code:</span>
                      <span className="font-semibold text-slate-800 font-mono">{extractedReview.pincode || '(Not detected)'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Country:</span>
                      <span className="font-semibold text-slate-800">{extractedReview.country || 'India'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-200/60 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setExtractedReview(null)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200"
                    >
                      Dismiss / Keep Current
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyExtractedAddress}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply to Address Fields
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section C: Permanent Residential Address */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Permanent Residential Address & Billing Details</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Address Line 1 (House No, Street, Premises)
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={addressLine}
                  onChange={e => setAddressLine(e.target.value)}
                  placeholder="e.g. Door No. 12-4-5, Beach Road"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Address Line 2 (Area, Locality, Landmark)
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={addressLine2}
                  onChange={e => setAddressLine2(e.target.value)}
                  placeholder="e.g. Near RK Beach, Maharani Peta"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City / Town</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Visakhapatnam"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="Andhra Pradesh"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Postal / PIN Code</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  placeholder="530002"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="India"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Section D: Emergency Contact */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
              <span>4. Emergency Contact Information</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={emergencyName}
                  onChange={e => setEmergencyName(e.target.value)}
                  placeholder="e.g. Sitaram Naidu"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Telephone</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  placeholder="+91 99887 66554"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Save / Cancel Bar */}
          {isEditing && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving to Database...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 3. Account Security & Password Update */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Lock className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold text-slate-900">Security Credentials & Password</h4>
        </div>

        {passwordSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Secure Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
