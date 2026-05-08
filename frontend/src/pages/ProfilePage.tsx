import { useState, useEffect, useRef } from "react";
import { User, Mail, Lock, Camera, Save, ArrowLeft, Shield, Phone, FileText, Upload, Star, CreditCard, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import { updateProfile, changePassword, uploadImage } from "../services/authService";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [image, setImage] = useState(user?.image || "");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setBio(user.bio || "");
      setImage(user.image || "");
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return toast.error(t('profile.uploadImageError'));
    }

    // Validate file size (e.g., 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return toast.error(t('profile.fileSizeError'));
    }

    const formData = new FormData();
    formData.append("image", file);

    setIsUploading(true);
    try {
      const response = await uploadImage(formData);
      const newImageUrl = response.url;
      setImage(newImageUrl);
      
      // Immediately update profile in database to persist the photo
      const updateResponse = await updateProfile({ image: newImageUrl });
      login(updateResponse.user);
      
      toast.success(t('profile.photoSuccess'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('profile.photoError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await updateProfile({ name, email, phone, bio, image });
      login(response.user);
      toast.success(t('profile.updateSuccess'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error(t('profile.passwordMatchError'));
    }
    
    setIsPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success(t('profile.passwordSuccess'));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('profile.passwordError'));
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{t('common.back')}</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar / Photo */}
            <div className="md:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-card p-6 rounded-[32px] shadow-sm border border-border text-center transition-colors duration-300">
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-card shadow-md mx-auto">
                    {image ? (
                      <img src={image} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={16} />
                    )}
                  </button>
                </div>
                <h2 className="text-xl font-bold text-card-foreground">{name}</h2>
                <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground uppercase tracking-widest font-bold">{t('profile.status')}</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full font-bold uppercase tracking-tighter">{t('profile.active')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground uppercase tracking-widest font-bold">{t('profile.memberSince')}</span>
                    <span className="text-card-foreground font-bold">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Loyalty Status Card */}
              {user.role === 'customer' && (
                <div className="bg-gradient-to-br from-[#C47C2B] to-[#A8661E] p-6 rounded-[32px] shadow-xl text-white">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Star className="text-yellow-400 fill-yellow-400" size={20} />
                    </div>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                      {user.membershipLevel || 'Bronze'}
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">{t('profile.loyaltyPoints')}</p>
                    <h4 className="text-3xl font-bold">{user.points || 0} <span className="text-sm font-medium text-white/60">{t('profile.pts')}</span></h4>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-white/60">
                        <History size={14} />
                        <span>{t('profile.lastVisit')}</span>
                      </div>
                      <span className="font-bold">{user.lastVisit ? new Date(user.lastVisit).toLocaleDateString() : t('profile.today')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-white/60">
                        <CreditCard size={14} />
                        <span>{t('profile.totalSpent')}</span>
                      </div>
                      <span className="font-bold">${(user.totalSpent || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

            <div className="bg-card p-6 rounded-[32px] shadow-sm border border-border transition-colors duration-300">
              <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
                <Shield size={18} className="text-primary" />
                {t('profile.securityStatus')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground font-medium">{t('profile.twoFactorDisabled')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground font-medium">{t('profile.emailVerified')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Profile Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-8 rounded-[40px] shadow-sm border border-border transition-colors duration-300"
            >
              <h2 className="text-2xl font-bold text-card-foreground mb-8">{t('profile.settings')}</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-4">{t('auth.fullName')}</label>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-16 pr-6 py-4 bg-muted border-none rounded-[24px] font-bold text-sm focus:ring-2 focus:ring-primary transition-all text-card-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-4">{t('auth.emailAddress')}</label>
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-16 pr-6 py-4 bg-muted border-none rounded-[24px] font-bold text-sm focus:ring-2 focus:ring-primary transition-all text-card-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-4">{t('profile.phoneNumber')}</label>
                    <div className="relative group">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('profile.phonePlaceholder')}
                        className="w-full pl-16 pr-6 py-4 bg-muted border-none rounded-[24px] font-bold text-sm focus:ring-2 focus:ring-primary transition-all text-card-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-4">{t('profile.bio')}</label>
                  <div className="relative group">
                    <FileText className="absolute left-6 top-6 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      placeholder={t('profile.bioPlaceholder')}
                      className="w-full pl-16 pr-6 py-5 bg-muted border-none rounded-[24px] font-bold text-sm focus:ring-2 focus:ring-primary transition-all resize-none text-card-foreground"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-[24px] font-bold text-sm flex items-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      {t('profile.saveChanges')}
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Password Change */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card p-8 rounded-[40px] shadow-sm border border-border transition-colors duration-300"
            >
              <h2 className="text-2xl font-bold text-card-foreground mb-8">{t('profile.changePassword')}</h2>
              
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-4">{t('profile.currentPassword')}</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-16 pr-6 py-4 bg-muted border-none rounded-[24px] font-bold text-sm focus:ring-2 focus:ring-primary transition-all text-card-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-4">{t('profile.newPassword')}</label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-16 pr-6 py-4 bg-muted border-none rounded-[24px] font-bold text-sm focus:ring-2 focus:ring-primary transition-all text-card-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-4">{t('profile.confirmPassword')}</label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-16 pr-6 py-4 bg-muted border-none rounded-[24px] font-bold text-sm focus:ring-2 focus:ring-primary transition-all text-card-foreground"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPasswordLoading}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-[24px] font-bold text-sm flex items-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isPasswordLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={18} />
                      {t('profile.updatePassword')}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
