'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Calendar,
  User,
  Users,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Printer,
  Compass,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ApplyClientProps {
  tenantSlug: string;
  institution: any;
  settings: any;
  institutionType: string;
}

export default function ApplyClient({
  tenantSlug,
  institution,
  settings,
  institutionType
}: ApplyClientProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Student Demographics
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: '',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    nidBirthCertNumber: '',
    phone: '',
    email: '',
    presentAddress: '',
    permanentAddress: '',

    // Step 2: Guardian
    fatherName: '',
    fatherPhone: '',
    fatherProfession: '',
    motherName: '',
    motherPhone: '',
    motherProfession: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Father',
    guardianOccupation: '',

    // Step 3: Academic Placement
    campusId: institution.campuses[0]?.id || '',
    academicYearId: institution.academicYears[0]?.id || '',
    desiredClassId: institution.classes[0]?.id || '',
    desiredProgramId: institution.departments?.[0]?.programs?.[0]?.id || '',
    shiftId: institution.shifts[0]?.id || '',
    sectionId: '',
    academicGroupId: institution.academicGroups?.[0]?.id || '',
    technologyTradeId: institution.technologyTrades?.[0]?.id || '',
    hifzProgram: false,

    // Step 4: Previous Education
    previousSchool: '',
    previousClass: '',
    previousGpa: '',

    // Step 5: Documents
    documentsJson: '[]',

    // Anti-spam honeypot
    website_url_hp: ''
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    setErrorMessage(null);

    // Validation for Step 1
    if (currentStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setErrorMessage('Please provide student first and last name.');
        return;
      }
      if (!formData.dateOfBirth) {
        setErrorMessage('Please select date of birth.');
        return;
      }
      if (!formData.phone.trim()) {
        setErrorMessage('Contact phone number is required.');
        return;
      }
      if (!formData.presentAddress.trim() || !formData.permanentAddress.trim()) {
        setErrorMessage('Both present and permanent addresses are required.');
        return;
      }
    }

    // Validation for Step 2
    if (currentStep === 2) {
      if (!formData.fatherName.trim() && !formData.guardianName.trim()) {
        setErrorMessage('Please provide at least Father or Primary Guardian name.');
        return;
      }
      if (!formData.fatherPhone.trim() && !formData.guardianPhone.trim()) {
        setErrorMessage('Please provide a valid guardian contact phone number.');
        return;
      }
      if (!formData.motherName.trim()) {
        setErrorMessage('Mother name is required.');
        return;
      }
      // Auto-populate guardian name if not manually set
      if (!formData.guardianName) {
        formData.guardianName = formData.fatherName;
        formData.guardianPhone = formData.fatherPhone;
      }
    }

    // Validation for Step 3
    if (currentStep === 3) {
      if (!formData.campusId) {
        setErrorMessage('Please select a campus.');
        return;
      }
      if (!formData.academicYearId) {
        setErrorMessage('Academic year is required.');
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.website_url_hp) {
      return; // Bot detected by honeypot
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        tenantSlug,
        campusId: formData.campusId,
        academicYearId: formData.academicYearId,
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || null,
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || null,
        religion: formData.religion || null,
        nationality: formData.nationality || 'Bangladeshi',
        nidBirthCertNumber: formData.nidBirthCertNumber.trim() || null,
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        presentAddress: formData.presentAddress.trim(),
        permanentAddress: formData.permanentAddress.trim(),

        desiredClassId: formData.desiredClassId || null,
        desiredProgramId: formData.desiredProgramId || null,
        shiftId: formData.shiftId || null,
        sectionId: formData.sectionId || null,
        academicGroupId: formData.academicGroupId || null,
        technologyTradeId: formData.technologyTradeId || null,
        hifzProgram: formData.hifzProgram,

        guardianName: formData.guardianName.trim() || formData.fatherName.trim(),
        guardianPhone: formData.guardianPhone.trim() || formData.fatherPhone.trim(),
        guardianRelation: formData.guardianRelation || 'Father',
        guardianOccupation: formData.guardianOccupation.trim() || null,
        fatherName: formData.fatherName.trim() || null,
        fatherPhone: formData.fatherPhone.trim() || null,
        fatherProfession: formData.fatherProfession.trim() || null,
        motherName: formData.motherName.trim() || null,
        motherPhone: formData.motherPhone.trim() || null,
        motherProfession: formData.motherProfession.trim() || null,

        previousSchool: formData.previousSchool.trim() || null,
        previousClass: formData.previousClass.trim() || null,
        previousGpa: formData.previousGpa ? parseFloat(formData.previousGpa) : null,
        documentsJson: formData.documentsJson
      };

      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to submit application.');
      }

      setSubmittedApp(json.data);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting your application.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success Confirmation Slip Screen
  if (submittedApp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white text-center relative">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Application Submitted Successfully!</h2>
            <p className="text-emerald-100 text-sm mt-1">
              Your admission application has been registered with {institution.name}.
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Official Tracking Number</span>
              <div className="text-3xl font-extrabold text-indigo-600 tracking-wider font-mono">
                {submittedApp.applicationNumber}
              </div>
              <p className="text-xs text-slate-500">
                Please save or print this number. You will need it to check your status, admission test, and interview schedule.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Applicant Name</span>
                <span className="font-semibold text-slate-800">{submittedApp.firstName} {submittedApp.lastName}</span>
              </div>
              <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Campus</span>
                <span className="font-semibold text-slate-800">{submittedApp.campus?.name || 'Main Campus'}</span>
              </div>
              <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Target Placement</span>
                <span className="font-semibold text-slate-800">
                  {submittedApp.desiredClass?.name || submittedApp.desiredProgram?.name || 'General Admission'}
                </span>
              </div>
              <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Application Fee</span>
                <span className="font-semibold text-slate-800">
                  {submittedApp.applicationFeeAmount > 0 ? `BDT ${submittedApp.applicationFeeAmount}` : 'Free / No Fee'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Application Slip
              </button>
              <Link
                href={`/site/${tenantSlug}`}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl font-medium text-sm transition-colors"
              >
                Back to Institution Website
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/50 to-indigo-50/30 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
                Online Admission Portal
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">{institution.name}</h1>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {institution.address}
              </p>
            </div>
          </div>
          <Link
            href={`/site/${tenantSlug}`}
            className="text-xs text-slate-600 hover:text-indigo-600 font-medium bg-slate-100 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
          >
            Visit Institution Website →
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-indigo-600 font-bold' : ''}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>1</span>
              <span>Student</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-indigo-600 font-bold' : ''}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>2</span>
              <span>Guardian</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-indigo-600 font-bold' : ''}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>3</span>
              <span>Academic</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-indigo-600 font-bold' : ''}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>4</span>
              <span>Background</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 5 ? 'text-indigo-600 font-bold' : ''}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 5 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>5</span>
              <span>Review</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm text-rose-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Wizard Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* Honeypot for bots */}
          <input
            type="text"
            name="website_url_hp"
            value={formData.website_url_hp}
            onChange={(e) => updateField('website_url_hp', e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* STEP 1: Student Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Student Personal Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Please provide accurate information as per Birth Certificate or NID.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="e.g. Mahfuzur"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Middle Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => updateField('middleName', e.target.value)}
                    placeholder="e.g. Rahman"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="e.g. Chowdhury"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => updateField('bloodGroup', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Religion</label>
                  <select
                    value={formData.religion}
                    onChange={(e) => updateField('religion', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Islam">Islam</option>
                    <option value="Hinduism">Hinduism</option>
                    <option value="Buddhism">Buddhism</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nationality</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => updateField('nationality', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Birth Cert / NID No</label>
                  <input
                    type="text"
                    value={formData.nidBirthCertNumber}
                    onChange={(e) => updateField('nidBirthCertNumber', e.target.value)}
                    placeholder="17-digit certificate number"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Present Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.presentAddress}
                    onChange={(e) => updateField('presentAddress', e.target.value)}
                    placeholder="House, Road, Area, Thana, District"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Permanent Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.permanentAddress}
                    onChange={(e) => updateField('permanentAddress', e.target.value)}
                    placeholder="Village, Post Office, Upazila, District"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Guardian Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Parents & Guardian Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter legitimate contact details for institutional communications and emergencies.</p>
              </div>

              {/* Father */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Father Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Father Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fatherName}
                      onChange={(e) => updateField('fatherName', e.target.value)}
                      placeholder="e.g. Md. Abdul Rahman"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Father Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.fatherPhone}
                      onChange={(e) => updateField('fatherPhone', e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={formData.fatherProfession}
                      onChange={(e) => updateField('fatherProfession', e.target.value)}
                      placeholder="e.g. Business, Teacher"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Mother */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Mother Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mother Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.motherName}
                      onChange={(e) => updateField('motherName', e.target.value)}
                      placeholder="e.g. Nasima Begum"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mother Phone</label>
                    <input
                      type="tel"
                      value={formData.motherPhone}
                      onChange={(e) => updateField('motherPhone', e.target.value)}
                      placeholder="018xxxxxxxx"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      value={formData.motherProfession}
                      onChange={(e) => updateField('motherProfession', e.target.value)}
                      placeholder="e.g. Homemaker, Banker"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Legal Guardian if other */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Legal Guardian (If other than Father/Mother)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => updateField('guardianName', e.target.value)}
                      placeholder="Leave blank to use Father"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Phone</label>
                    <input
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={(e) => updateField('guardianPhone', e.target.value)}
                      placeholder="019xxxxxxxx"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                    <select
                      value={formData.guardianRelation}
                      onChange={(e) => updateField('guardianRelation', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Academic Placement */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Academic Target & Placement
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Select the target program, class, shift, and campus for this admission session.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Campus *</label>
                  <select
                    required
                    value={formData.campusId}
                    onChange={(e) => updateField('campusId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {institution.campuses.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Academic Session / Year *</label>
                  <select
                    required
                    value={formData.academicYearId}
                    onChange={(e) => updateField('academicYearId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {institution.academicYears.map((ay: any) => (
                      <option key={ay.id} value={ay.id}>{ay.name} (Active Session)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Institution Type Specific Placement */}
              {institutionType === 'UNIVERSITY' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Desired Degree / Program *</label>
                    <select
                      value={formData.desiredProgramId}
                      onChange={(e) => updateField('desiredProgramId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {institution.departments?.flatMap((d: any) => d.programs || []).map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.degreeLevel})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : institutionType === 'POLYTECHNIC' || institutionType === 'TECHNICAL_INSTITUTE' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Technology / Trade *</label>
                    <select
                      value={formData.technologyTradeId}
                      onChange={(e) => updateField('technologyTradeId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {institution.technologyTrades?.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift</label>
                    <select
                      value={formData.shiftId}
                      onChange={(e) => updateField('shiftId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {institution.shifts?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Desired Class / Grade *</label>
                    <select
                      value={formData.desiredClassId}
                      onChange={(e) => updateField('desiredClassId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {institution.classes.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift</label>
                    <select
                      value={formData.shiftId}
                      onChange={(e) => updateField('shiftId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {institution.shifts?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Academic Group (If Applicable)</label>
                    <select
                      value={formData.academicGroupId}
                      onChange={(e) => updateField('academicGroupId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">General / None</option>
                      {institution.academicGroups?.map((g: any) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Madrasha Hifz Checkbox */}
              {institutionType === 'MADRASHA' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-emerald-900 block">Enroll in Hifzul Quran Department</span>
                    <span className="text-xs text-emerald-700">Check this box if the student will participate in the daily Quran memorization curriculum.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.hifzProgram}
                    onChange={(e) => updateField('hifzProgram', e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Previous Education */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Previous Academic Background
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Provide details of the previous school, college, or examination result.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Previous School / College / Institute Name</label>
                  <input
                    type="text"
                    value={formData.previousSchool}
                    onChange={(e) => updateField('previousSchool', e.target.value)}
                    placeholder="e.g. Sylhet Model High School"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Class / Grade Passed</label>
                  <input
                    type="text"
                    value={formData.previousClass}
                    onChange={(e) => updateField('previousClass', e.target.value)}
                    placeholder="e.g. Class 5"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">GPA / Total Marks Obtained</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5.00"
                    value={formData.previousGpa}
                    onChange={(e) => updateField('previousGpa', e.target.value)}
                    placeholder="e.g. 4.85"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Review Application & Confirm
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Please review your submitted details before final submission.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Student Name</span>
                    <span className="font-bold text-slate-800">{formData.firstName} {formData.middleName} {formData.lastName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Gender & DOB</span>
                    <span className="font-medium text-slate-800">{formData.gender}, {formData.dateOfBirth}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Father & Mother</span>
                    <span className="font-medium text-slate-800">{formData.fatherName} & {formData.motherName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Contact Phone</span>
                    <span className="font-medium text-slate-800">{formData.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Target Placement</span>
                    <span className="font-medium text-slate-800">
                      {institution.classes.find((c: any) => c.id === formData.desiredClassId)?.name || 'Degree Program'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Application Fee</span>
                    <span className="font-bold text-indigo-600">
                      {settings.applicationFee > 0 ? `BDT ${settings.applicationFee}` : 'Free'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                ⚠️ I hereby declare that all information provided above is true and authentic. I agree to abide by the rules and regulations of {institution.name}.
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="border-t border-slate-200 pt-6 mt-6 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Step
              </button>
            ) : <div />}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-100"
              >
                Continue Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitApplication}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors shadow-md shadow-emerald-100"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
