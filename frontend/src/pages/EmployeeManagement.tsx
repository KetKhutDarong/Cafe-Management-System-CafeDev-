import { useState, type ReactNode, type ChangeEvent, type FormEvent, useEffect, useRef } from "react";
import { Search, Plus, Filter, MoreVertical, Mail, Phone, Calendar, DollarSign, Clock, UserCheck, UserX, UserMinus, Edit2, Key, X, Check, Camera, Upload, User, Users, Box, BarChart3, Coffee, LayoutDashboard, Shield, Utensils, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Employee } from "@/types";
import { useLocation } from "@/LocationContext";
import { useLanguage } from "@/LanguageContext";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { getUsers, createUser, updateUser, deleteUser } from "@/services/userService";
import { uploadImage } from "@/services/authService";

export default function EmployeeManagement() {
  const { t } = useLanguage();
  const { currentLocation } = useLocation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalTab, setModalTab] = useState<'general' | 'schedule' | 'permissions'>('general');
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEmployees();
    const interval = setInterval(() => fetchEmployees(false), 15000); // 15 seconds for employees
    return () => clearInterval(interval);
  }, [currentLocation]);

  const fetchEmployees = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const params = currentLocation ? { locationId: currentLocation.id || currentLocation._id } : {};
      const data = await getUsers(params);
      // Filter only employees (exclude customers if needed, or show all staff)
      const staff = data.filter((u: any) => ["admin", "manager", "cashier", "barista"].includes(u.role));
      setEmployees(staff);
      if (staff.length > 0 && !selectedEmployee) {
        setSelectedEmployee(staff[0]);
      }
    } catch (error: any) {
      if (showLoading) toast.error(t('employee.fetchError'));
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const DEFAULT_SCHEDULE = [
    { day: "Monday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Tuesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Wednesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Thursday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Friday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Saturday", startTime: "09:00", endTime: "17:00", enabled: false },
    { day: "Sunday", startTime: "09:00", endTime: "17:00", enabled: false },
  ];

  const DEFAULT_PERMISSIONS = {
    manageOrders: true,
    manageInventory: false,
    manageEmployees: false,
    viewReports: false,
    manageMenu: false,
    manageTables: false,
    manageSupport: false,
  };

  const handleAction = async (action: string) => {
    if (!selectedEmployee) return;

    if (action === "Edit Profile") {
      setModalMode('edit');
      setModalTab('general');
      const permissions = { ...DEFAULT_PERMISSIONS, ...(selectedEmployee.permissions || {}) };
      setFormData({
        ...selectedEmployee,
        schedule: selectedEmployee.schedule || DEFAULT_SCHEDULE,
        permissions
      });
      setIsModalOpen(true);
    } else if (action === "Reset Password") {
      setNewPassword("");
      setIsPasswordModalOpen(true);
    } else if (action === "Delete Employee") {
      setIsDeleteModalOpen(true);
    } else if (action === "Save Changes") {
      toast.success(t('employee.successSave'));
    }
  };

  const handleAddEmployee = () => {
    setModalMode('add');
    setModalTab('general');
    setFormData({
      status: 'Active',
      image: "",
      totalHours: 0,
      schedule: DEFAULT_SCHEDULE,
      permissions: DEFAULT_PERMISSIONS
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const payload = {
          ...formData,
          locationId: currentLocation?.id || currentLocation?._id
        };
        const newEmployee = await createUser(payload as any);
        setEmployees([...employees, newEmployee]);
        setSelectedEmployee(newEmployee);
        toast.success("Employee added successfully");
      } else {
        if (!formData.id) return;
        const updatedEmployee = await updateUser(formData.id, formData);
        const updatedEmployees = employees.map(e => e.id === formData.id ? updatedEmployee : e);
        setEmployees(updatedEmployees);
        setSelectedEmployee(updatedEmployee);
        toast.success("Employee updated successfully");
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save employee");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteUser(selectedEmployee.id);
      const updated = employees.filter(e => e.id !== selectedEmployee.id);
      setEmployees(updated);
      if (updated.length > 0) setSelectedEmployee(updated[0]);
      else setSelectedEmployee(null);
      toast.success("Employee deleted successfully");
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      toast.error("Failed to delete employee");
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    setIsUploading(true);
    try {
      const response = await uploadImage(uploadFormData);
      setFormData({ ...formData, image: response.url });
      toast.success(t('employee.photoSuccess'));
    } catch (error: any) {
      toast.error(t('employee.photoError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFilter = () => {
    setSearchQuery("");
    setRoleFilter("All");
    toast.info("Filters cleared");
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (emp.name?.toLowerCase() || "").includes(searchLower) ||
      (emp.role?.toLowerCase() || "").includes(searchLower) ||
      (emp.id || "").toLowerCase().includes(searchLower) ||
      (`#${emp.id || ""}`).toLowerCase().includes(searchLower);
    
    const matchesRole = roleFilter === 'All' || emp.role?.toLowerCase() === roleFilter.toLowerCase();
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col relative bg-background transition-colors duration-300">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleFilter}
            className="p-3 bg-card rounded-xl shadow-sm hover:bg-muted transition-colors border border-border"
          >
            <Filter size={20} className="text-muted-foreground" />
          </button>
          <button 
            onClick={handleAddEmployee}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            {t('employee.add')}
          </button>
        </div>
      </header>

      <h2 className="text-2xl sm:text-3xl font-display font-bold mb-8 text-foreground">{t('employee.title')}</h2>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0 relative">
        {/* Employee List */}
        <div className={cn(
          "w-full lg:w-96 flex flex-col gap-4 transition-all duration-300",
          !isMobileListVisible && "hidden lg:flex"
        )}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={t('employee.search')}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
            />
          </div>

          <div className="flex gap-2 mb-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
            {['All', 'barista', 'manager', 'cashier'].map(filter => (
              <button
                key={filter}
                onClick={() => setRoleFilter(filter)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  roleFilter === filter ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted border border-border"
                )}
              >
                {filter === 'All' ? t('common.all') : t(`employee.${filter.toLowerCase()}s`)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-full h-20 bg-muted animate-pulse rounded-xl" />
              ))
            ) : filteredEmployees.map((emp, idx) => (
              <button
                key={`employee-item-${emp.id || (emp as any)._id || idx}-${idx}`} 
                onClick={() => {
                  setSelectedEmployee(emp);
                  setIsMobileListVisible(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                  selectedEmployee?.id === emp.id 
                    ? "bg-muted text-primary border-primary shadow-sm" 
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border-2 border-card shadow-sm flex items-center justify-center">
                    {emp.image ? (
                      <img src={emp.image} alt={emp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card",
                    emp.status === 'Active' ? "bg-success" : emp.status === 'On Break' ? "bg-warning" : "bg-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-foreground">{emp.name}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    {emp.role ? emp.role.charAt(0).toUpperCase() + emp.role.slice(1) : ''} • ID: #{emp.id}
                  </p>
                </div>
                <MoreVertical className={cn(
                  "text-muted-foreground group-hover:text-primary transition-colors",
                  selectedEmployee?.id === emp.id && "text-primary"
                )} size={18} />
              </button>
            ))}
          </div>
        </div>

        {/* Employee Detail */}
        <div className={cn(
          "flex-1 bg-card rounded-[14px] shadow-sm flex flex-col overflow-hidden border border-border transition-all duration-300",
          isMobileListVisible && "hidden lg:flex"
        )}>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedEmployee ? (
            <>
              <div className="p-6 sm:p-10 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
                  <button 
                    onClick={() => setIsMobileListVisible(true)}
                    className="lg:hidden self-start p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={24} />
                  </button>
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[32px] sm:rounded-[40px] bg-muted overflow-hidden border-4 border-card shadow-xl">
                      {selectedEmployee.image ? (
                        <img src={selectedEmployee.image} alt={selectedEmployee.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                          <User size={48} />
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "absolute -top-2 -right-2 px-3 py-1 text-[10px] font-bold rounded-full border-2 border-card",
                      selectedEmployee.status === 'Active' ? "bg-muted text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {selectedEmployee.status.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-4xl font-display font-bold mb-2 text-foreground">{selectedEmployee.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{selectedEmployee.role} • Hired {selectedEmployee.hiredDate || new Date(selectedEmployee.createdAt || Date.now()).toLocaleDateString()}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-6">
                      <button 
                        onClick={() => handleAction("Edit Profile")}
                        className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-xs sm:text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                      >
                        <Edit2 size={16} />
                        {t('employee.editProfile')}
                      </button>
                      <button 
                        onClick={() => handleAction("Reset Password")}
                        className="flex items-center gap-2 px-4 sm:px-6 py-3 border border-border rounded-2xl font-bold text-xs sm:text-sm hover:bg-muted transition-all text-foreground"
                      >
                        <Key size={16} />
                        {t('employee.resetPassword')}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-center lg:text-right">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('employee.totalHours')}</p>
                  <p className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-foreground">{selectedEmployee.totalHours || 0}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-6 sm:px-10 pt-6 border-b border-border flex gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
                  {['Profile', 'Schedule', 'Permissions'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab.toLowerCase());
                      }}
                      className={cn(
                        "pb-4 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap",
                        activeTab === tab.toLowerCase() 
                          ? "text-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t(`employee.${tab.toLowerCase()}`)}
                      {activeTab === tab.toLowerCase() && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-12 custom-scrollbar">
                  {activeTab === 'profile' && (
                    <>
                      <section>
                        <div className="flex items-center gap-3 mb-8 text-primary">
                          <UserCheck size={24} />
                          <h4 className="text-lg sm:text-xl font-display font-bold text-foreground">{t('employee.personalInfo')}</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                          <InfoField label={t('employee.firstName')} value={selectedEmployee.name?.split(' ')[0] || ''} />
                          <InfoField label={t('employee.lastName')} value={selectedEmployee.name?.split(' ').slice(1).join(' ') || ''} />
                          <InfoField label={t('employee.email')} value={selectedEmployee.email || ''} icon={<Mail size={18} className="text-primary" />} />
                          <InfoField label={t('employee.phone')} value={selectedEmployee.phone || t('common.notProvided')} icon={<Phone size={18} className="text-primary" />} />
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center gap-3 mb-8 text-primary">
                          <Calendar size={24} />
                          <h4 className="text-lg sm:text-xl font-display font-bold text-foreground">{t('employee.employmentDetails')}</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                          <InfoField label={t('employee.role')} value={selectedEmployee.role ? t(`employee.${selectedEmployee.role}`) : ''} />
                          <InfoField label={t('employee.hourlyRate')} value={(selectedEmployee.hourlyRate || 0).toFixed(2)} />
                          <InfoField label={t('employee.id')} value={selectedEmployee.id} />
                        </div>
                      </section>
                    </>
                  )}

                  {activeTab === 'schedule' && (
                    <section>
                      <div className="flex items-center gap-3 mb-8 text-primary">
                        <Clock size={24} />
                        <h4 className="text-lg sm:text-xl font-display font-bold text-foreground">{t('employee.weeklySchedule')}</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {(selectedEmployee.schedule || DEFAULT_SCHEDULE).map((item, idx) => (
                          <div key={`${item.day}-${idx}`} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                item.enabled ? "bg-primary" : "bg-muted-foreground/30"
                              )} />
                              <span className="text-sm font-bold text-foreground">{t(`days.${item.day.toLowerCase()}`)}</span>
                            </div>
                            <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                              {item.enabled ? `${item.startTime} - ${item.endTime}` : t('employee.offDay')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {activeTab === 'permissions' && (
                    <section>
                      <div className="flex items-center gap-3 mb-8 text-primary">
                        <Shield size={24} />
                        <h4 className="text-lg sm:text-xl font-display font-bold text-foreground">{t('employee.accessPermissions')}</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(selectedEmployee.permissions || DEFAULT_PERMISSIONS).map(([key, value], idx) => (
                          <div key={`${key}-${idx}`} className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                              {key === 'manageOrders' && <Utensils size={16} />}
                              {key === 'manageInventory' && <Box size={16} />}
                              {key === 'manageEmployees' && <Users size={16} />}
                              {key === 'viewReports' && <BarChart3 size={16} />}
                              {key === 'manageMenu' && <Coffee size={16} />}
                              {key === 'manageTables' && <LayoutDashboard size={16} />}
                              {key === 'manageSupport' && <MessageSquare size={16} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground capitalize truncate">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                              <p className="text-[10px] text-muted-foreground font-medium">{value ? 'Access Granted' : 'No Access'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-border">
                    <button 
                      onClick={() => handleAction("Delete Employee")}
                      className="text-destructive font-bold text-sm hover:underline flex items-center gap-2"
                    >
                      <UserX size={18} />
                      Delete Employee
                    </button>
                    <button 
                      onClick={() => handleAction("Save Changes")}
                      className="w-full sm:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
              <Users size={64} className="mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">No Employee Selected</h3>
              <p className="text-sm max-w-xs">Select an employee from the list to view their details or add a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-[32px] p-8 shadow-2xl overflow-hidden border border-border"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                  <UserX size={40} className="text-destructive" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2 text-foreground">{t('employee.deleteConfirmTitle')}</h3>
                <p className="text-muted-foreground mb-8">
                  {t('employee.deleteConfirmDesc', { name: selectedEmployee.name })}
                </p>
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-muted text-muted-foreground rounded-2xl font-bold hover:bg-muted/80 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-6 py-4 bg-destructive text-destructive-foreground rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-destructive/20"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-card rounded-[40px] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8 border-b border-border flex items-center justify-between">
                <h3 className="text-2xl font-display font-bold text-foreground">
                  {modalMode === 'add' ? 'Add New Employee' : 'Edit Employee Profile'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X size={24} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex border-b border-border px-8">
                {['general', 'schedule', 'permissions'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setModalTab(tab as any)}
                    className={cn(
                      "px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
                      modalTab === tab 
                        ? "border-primary text-primary" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <form onSubmit={handleModalSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {modalTab === 'general' && (
                  <>
                    {/* Photo Upload */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-muted overflow-hidden border-4 border-card shadow-lg">
                          {formData.image ? (
                            <img src={formData.image} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Camera size={32} />
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
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {isUploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload size={14} />
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-3">{t('employee.photo')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('employee.fullName')}</label>
                        <input 
                          type="text"
                          required
                          value={formData.name || ''}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder={t('employee.placeholderName')}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('employee.role')}</label>
                        <select 
                          required
                          value={formData.role || ''}
                          onChange={e => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        >
                          <option value="">{t('employee.selectRole')}</option>
                          <option value="manager">{t('employee.manager')}</option>
                          <option value="cashier">{t('employee.cashier')}</option>
                          <option value="barista">{t('employee.barista')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('employee.email')}</label>
                        <input 
                          type="email"
                          required
                          value={formData.email || ''}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="name@cafe.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('employee.phone')}</label>
                        <input 
                          type="tel"
                          required
                          value={formData.phone || ''}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="+855 00 000 000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('employee.hourlyRate')}</label>
                        <input 
                          type="number"
                          step="0.01"
                          required
                          value={isNaN(formData.hourlyRate!) ? '' : formData.hourlyRate}
                          onChange={e => setFormData({ ...formData, hourlyRate: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                          className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('common.status')}</label>
                        <select 
                          required
                          value={formData.status || ''}
                          onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        >
                          <option value="Active">{t('menu.active')}</option>
                          <option value="Inactive">{t('common.inactive')}</option>
                          <option value="On Break">{t('employee.onBreak')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('employee.password')} {modalMode === 'edit' && `(${t('employee.leaveBlank')})`}</label>
                        <input 
                          type="password"
                          required={modalMode === 'add'}
                          value={formData.password || ''}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </>
                )}

                {modalTab === 'schedule' && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground mb-4">{t('employee.scheduleDesc')}</p>
                    {formData.schedule?.map((item, index) => (
                      <div key={`${item.day}-${index}`} className="flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-2xl">
                        <div className="flex items-center gap-3 w-32">
                          <input 
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) => {
                              const newSchedule = [...(formData.schedule || [])];
                              newSchedule[index] = { ...item, enabled: e.target.checked };
                              setFormData({ ...formData, schedule: newSchedule });
                            }}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-foreground">{t(`days.${item.day.toLowerCase()}`)}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <input 
                            type="time"
                            disabled={!item.enabled}
                            value={item.startTime}
                            onChange={(e) => {
                              const newSchedule = [...(formData.schedule || [])];
                              newSchedule[index] = { ...item, startTime: e.target.value };
                              setFormData({ ...formData, schedule: newSchedule });
                            }}
                            className="flex-1 px-3 py-2 bg-card border border-border rounded-xl text-xs disabled:opacity-50 text-foreground"
                          />
                          <span className="text-muted-foreground">{t('employee.to')}</span>
                          <input 
                            type="time"
                            disabled={!item.enabled}
                            value={item.endTime}
                            onChange={(e) => {
                              const newSchedule = [...(formData.schedule || [])];
                              newSchedule[index] = { ...item, endTime: e.target.value };
                              setFormData({ ...formData, schedule: newSchedule });
                            }}
                            className="flex-1 px-3 py-2 bg-card border border-border rounded-xl text-xs disabled:opacity-50 text-foreground"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {modalTab === 'permissions' && (
                  <div className="grid grid-cols-1 gap-4">
                    <p className="text-xs text-muted-foreground mb-4">{t('employee.permissionsDesc')}</p>
                    {Object.entries(formData.permissions || {}).map(([key, value], idx) => (
                      <div key={`${key}-${idx}`} className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground">
                            {key === 'manageOrders' && <Utensils size={16} />}
                            {key === 'manageInventory' && <Box size={16} />}
                            {key === 'manageEmployees' && <Users size={16} />}
                            {key === 'viewReports' && <BarChart3 size={16} />}
                            {key === 'manageMenu' && <Coffee size={16} />}
                            {key === 'manageTables' && <LayoutDashboard size={16} />}
                            {key === 'manageSupport' && <MessageSquare size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground capitalize">{t(`employee.${key}`)}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{t('employee.allowAccess')}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newPermissions = { ...(formData.permissions || {}), [key]: !value };
                            setFormData({ ...formData, permissions: newPermissions as any });
                          }}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            value ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                            value ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-muted text-muted-foreground rounded-2xl font-bold hover:bg-muted/80 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    {modalMode === 'add' ? t('employee.add') : t('employee.updateProfile')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-[40px] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-8 border-b border-border flex items-center justify-between">
                <h3 className="text-2xl font-display font-bold text-foreground">{t('employee.resetPassword')}</h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X size={24} className="text-muted-foreground" />
                </button>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success(t('employee.passwordResetSuccess', { name: selectedEmployee.name }));
                  setIsPasswordModalOpen(false);
                }}
                className="p-8 space-y-6"
              >
                <div className="p-4 bg-primary/10 rounded-2xl flex items-start gap-3">
                  <Key size={18} className="text-primary mt-0.5" />
                  <p className="text-xs text-primary leading-relaxed">
                    {t('employee.passwordResetDesc')}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">{t('employee.newPassword')}</label>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="flex-1 py-4 bg-muted text-muted-foreground rounded-2xl font-bold hover:bg-muted/80 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                  >
                    {t('employee.savePassword')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoField({ label, value, icon }: { label: string, value: string, icon?: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        <input
          type="text"
          readOnly={true}
          value={value}
          className={cn(
            "w-full py-4 bg-muted border border-border rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
            icon ? "pl-12 pr-4" : "px-6"
          )}
        />
      </div>
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-5 h-5", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
