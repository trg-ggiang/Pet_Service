const { supabase } = require("../lib/supabaseClient");

const { getStoredSetting, saveStoredSetting } = require("./settingsService");
const { setDoctorScheduleSlotStatus } = require("./doctorScheduleService");

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function initials(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  const parts = source.includes("@") ? [source[0]] : source.split(/\s+/).slice(-2);
  return parts.map((part) => part[0] || "").join("").toUpperCase();
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function formatTime(value) {
  if (!value) return "";
  const raw = String(value);
  return raw.slice(0, 5);
}

function moneyText(value) {
  return Math.round(Number(value || 0)).toLocaleString("vi-VN");
}

function moneyNumber(value) {
  return Math.round(Number(value || 0));
}

function monthKey(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "N/A";
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function dashboardStatusLabel(status) {
  const mapped = mapAppointmentStatus(status);
  const map = {
    scheduled: "Chờ khám",
    in_progress: "Đang khám",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return map[mapped] || "Khác";
}

async function readTable(table, select, options = {}) {
  let request = supabase.from(table).select(select);

  if (options.order) {
    request = request.order(options.order.column, { ascending: options.order.ascending ?? true });
  }

  if (options.limit) {
    request = request.limit(options.limit);
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data || [];
}

function buildMaps(rows, key) {
  return new Map(rows.map((row) => [row[key], row]));
}

function parseProfileDisplayId(value, prefixes) {
  const text = String(value || "").trim();
  const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
  for (const prefix of prefixList) {
    const match = text.match(new RegExp(`^${prefix}(\\d+)$`, "i"));
    if (match) {
      const id = Number(match[1]);
      return Number.isInteger(id) && id > 0 ? id : null;
    }
  }
  const id = Number(text);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function resolveUserIdByProfile(role, displayId) {
  const normalizedRole = normalizeRole(role);
  const config = {
    customer: { table: "customers", prefixes: ["C"] },
    doctor: { table: "doctors", prefixes: ["D", "NV-C"] },
    staff: { table: "staffs", prefixes: ["S", "NV-S"] },
  }[normalizedRole];

  if (!config) {
    const error = new Error("Invalid user role");
    error.statusCode = 400;
    throw error;
  }

  const id = parseProfileDisplayId(displayId, config.prefixes);
  if (!id) {
    const error = new Error("Invalid user id");
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabase
    .from(config.table)
    .select("user_id")
    .eq("id", id)
    .single();

  if (error || !data?.user_id) {
    const notFound = new Error(error?.message || "User profile not found");
    notFound.statusCode = 404;
    throw notFound;
  }

  return data.user_id;
}

async function updateAdminUserLock(role, displayId, locked) {
  const userId = await resolveUserIdByProfile(role, displayId);
  const { error } = await supabase
    .from("users")
    .update({ status: locked ? "LOCKED" : "ACTIVE" })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  return { id: displayId, role: normalizeRole(role), locked: Boolean(locked) };
}

function normalizeAdminUsersRole(value) {
  const role = String(value || "customers").toLowerCase();
  if (["customers", "doctors", "staff"].includes(role)) return role;
  return "customers";
}

function matchesAdminUserSearch(user, query) {
  if (!query) return true;
  const source = [
    user.id,
    user.name,
    user.phone,
    user.email,
    user.role,
    user.address,
    user.specialty,
    user.room,
    user.department,
    user.position,
    ...(Array.isArray(user.pets) ? user.pets : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return source.includes(query);
}

function filterAdminUsersByRole(groups, filters = {}) {
  const role = normalizeAdminUsersRole(filters.role);
  const search = String(filters.search || "").trim().toLowerCase();

  return {
    customers: role === "customers" ? groups.customers.filter((user) => matchesAdminUserSearch(user, search)) : groups.customers,
    doctors: role === "doctors" ? groups.doctors.filter((user) => matchesAdminUserSearch(user, search)) : groups.doctors,
    staff: role === "staff" ? groups.staff.filter((user) => matchesAdminUserSearch(user, search)) : groups.staff,
  };
}

function buildAdminUsersSummary(allGroups, filteredGroups, filters = {}) {
  const allUsers = [...allGroups.customers, ...allGroups.doctors, ...allGroups.staff];
  const activeDoctors = allGroups.doctors.filter((doctor) => !doctor.locked && doctor.status === "active").length;
  const activeStaff = allGroups.staff.filter((member) => !member.locked && member.status === "active").length;
  const vipCustomers = allGroups.customers.filter((customer) => customer.tier === "vip").length;

  return {
    role: normalizeAdminUsersRole(filters.role),
    search: String(filters.search || "").trim(),
    totals: {
      customers: allGroups.customers.length,
      doctors: allGroups.doctors.length,
      staff: allGroups.staff.length,
      locked: allUsers.filter((user) => user.locked).length,
      activeDoctors,
      activeStaff,
      vipCustomers,
    },
    filtered: {
      customers: filteredGroups.customers.length,
      doctors: filteredGroups.doctors.length,
      staff: filteredGroups.staff.length,
    },
    tabs: [
      { role: "customers", label: "Khách hàng", count: allGroups.customers.length },
      { role: "doctors", label: "Bác sĩ", count: allGroups.doctors.length },
      { role: "staff", label: "Nhân viên", count: allGroups.staff.length },
    ],
  };
}

async function listAdminUsers(filters = {}) {
  const [users, customers, doctors, staffs, pets, appointments] = await Promise.all([
    readTable("users", "id, email, role, status, created_at", {
      order: { column: "created_at", ascending: false },
    }),
    readTable("customers", "id, user_id, full_name, phone, address"),
    readTable("doctors", "id, user_id, full_name, specialization, room_name"),
    readTable("staffs", "id, user_id, full_name, phone, address"),
    readTable("pets", "id, customer_id, name, animal_species:species_id(name)"),
    readTable("appointments", "id, pet_id, doctor_id, staff_id, status, created_at"),
  ]);

  const customersByUserId = buildMaps(customers, "user_id");
  const doctorsByUserId = buildMaps(doctors, "user_id");
  const staffsByUserId = buildMaps(staffs, "user_id");
  const petsByCustomerId = new Map();
  const appointmentsByPetId = new Map();
  const appointmentsByDoctorId = new Map();
  const appointmentsByStaffId = new Map();

  pets.forEach((pet) => {
    const current = petsByCustomerId.get(pet.customer_id) || [];
    current.push(pet);
    petsByCustomerId.set(pet.customer_id, current);
  });

  appointments.forEach((appointment) => {
    if (appointment.pet_id) {
      const current = appointmentsByPetId.get(appointment.pet_id) || [];
      current.push(appointment);
      appointmentsByPetId.set(appointment.pet_id, current);
    }
    if (appointment.doctor_id) {
      const current = appointmentsByDoctorId.get(appointment.doctor_id) || [];
      current.push(appointment);
      appointmentsByDoctorId.set(appointment.doctor_id, current);
    }
    if (appointment.staff_id) {
      const current = appointmentsByStaffId.get(appointment.staff_id) || [];
      current.push(appointment);
      appointmentsByStaffId.set(appointment.staff_id, current);
    }
  });

  const customersResult = [];
  const doctorsResult = [];
  const staffResult = [];

  users.forEach((user) => {
    const role = normalizeRole(user.role);
    const locked = normalizeRole(user.status) !== "active";

    if (role === "customer") {
      const customer = customersByUserId.get(user.id);
      const customerPets = customer ? petsByCustomerId.get(customer.id) || [] : [];
      const customerAppointments = customerPets.flatMap((pet) => appointmentsByPetId.get(pet.id) || []);
      const lastVisit = customerAppointments
        .map((appointment) => appointment.created_at)
        .filter(Boolean)
        .sort()
        .at(-1);
      const name = customer?.full_name || user.email;

      customersResult.push({
        id: `C${String(customer?.id || user.id).padStart(3, "0")}`,
        role: "customer",
        name,
        phone: customer?.phone || "",
        email: user.email,
        avatar: initials(name),
        joinDate: formatDate(user.created_at),
        locked,
        tier: customerAppointments.length >= 10 ? "vip" : "regular",
        address: customer?.address || "",
        petCount: customerPets.length,
        pets: customerPets.map((pet) => `${pet.name}${pet.animal_species?.name ? ` (${pet.animal_species.name})` : ""}`),
        totalVisits: customerAppointments.length,
        totalSpend: "0",
        lastVisit: formatDate(lastVisit),
      });
      return;
    }

    if (role === "doctor") {
      const doctor = doctorsByUserId.get(user.id);
      const doctorAppointments = doctor ? appointmentsByDoctorId.get(doctor.id) || [] : [];
      const name = doctor?.full_name || user.email;

      doctorsResult.push({
        id: `D${String(doctor?.id || user.id).padStart(3, "0")}`,
        role: "doctor",
        name,
        phone: "",
        email: user.email,
        avatar: initials(name),
        joinDate: formatDate(user.created_at),
        locked,
        specialty: doctor?.specialization || "Chưa cập nhật",
        room: doctor?.room_name || "Chưa phân phòng",
        status: locked ? "on_leave" : "active",
        todayPatients: doctorAppointments.filter((appointment) => appointment.status !== "CANCELLED").length,
        totalPatients: doctorAppointments.length,
        rating: 0,
        licenseNo: "",
      });
      return;
    }

    if (role === "staff") {
      const staff = staffsByUserId.get(user.id);
      const staffAppointments = staff ? appointmentsByStaffId.get(staff.id) || [] : [];
      const name = staff?.full_name || user.email;

      staffResult.push({
        id: `S${String(staff?.id || user.id).padStart(3, "0")}`,
        role: "staff",
        name,
        phone: staff?.phone || "",
        email: user.email,
        avatar: initials(name),
        joinDate: formatDate(user.created_at),
        locked,
        department: "Vận hành",
        position: "Nhân viên",
        status: locked ? "on_leave" : "active",
        tasksToday: staffAppointments.length,
      });
    }
  });

  const allGroups = {
    customers: customersResult,
    doctors: doctorsResult,
    staff: staffResult,
  };
  const filteredGroups = filterAdminUsersByRole(allGroups, filters);

  return {
    ...filteredGroups,
    summary: buildAdminUsersSummary(allGroups, filteredGroups, filters),
  };
}

function serviceCategory(type) {
  const map = {
    MEDICAL: "clinic",
    VACCINE: "vaccination",
    GROOMING: "grooming",
    BOARDING: "boarding",
  };
  return map[type] || "clinic";
}

function serviceTypeFromCategory(category) {
  const map = {
    clinic: "MEDICAL",
    vaccination: "VACCINE",
    grooming: "GROOMING",
    boarding: "BOARDING",
  };
  return map[category] || null;
}

function parseServiceId(value) {
  const text = String(value || "").trim();
  const match = text.match(/^SV-(\d+)$/i);
  const rawId = match ? match[1] : text;
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function matchesServiceSearch(service, query) {
  if (!query) return true;
  return [service.id, service.name, service.description, service.category]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function mapAdminService(service, stats) {
  return {
    id: `SV-${service.id}`,
    category: serviceCategory(service.type),
    name: service.name,
    description: service.description || "",
    duration: service.type === "BOARDING" ? 1 : 30,
    durationUnit: service.type === "BOARDING" ? "đêm" : "phút",
    pricingType: "fixed",
    basePrice: Number(service.price || 0),
    variants: [],
    status: service.is_active ? "active" : "inactive",
    bookingsMonth: stats.bookings,
    revenueMonth: stats.revenue,
  };
}

function buildServiceSummary(allServices, filteredServices, category) {
  const categories = ["clinic", "vaccination", "grooming", "boarding"].map((item) => {
    const rows = allServices.filter((service) => service.category === item);
    const revenueMonth = rows.reduce((sum, service) => sum + Number(service.revenueMonth || 0), 0);
    return {
      category: item,
      count: rows.length,
      activeCount: rows.filter((service) => service.status === "active").length,
      revenueMonth,
      revenueMonthText: moneyText(revenueMonth),
    };
  });
  const topService = [...allServices].sort((a, b) => b.bookingsMonth - a.bookingsMonth)[0] || null;
  const totalRevenueMonth = allServices.reduce((sum, service) => sum + Number(service.revenueMonth || 0), 0);
  const activeCategory = categories.find((item) => item.category === category) || categories[0];

  return {
    total: allServices.length,
    filtered: filteredServices.length,
    totalActive: allServices.filter((service) => service.status === "active").length,
    totalBookings: allServices.reduce((sum, service) => sum + Number(service.bookingsMonth || 0), 0),
    totalRevenueMonth,
    totalRevenueMonthText: moneyText(totalRevenueMonth),
    topService: topService ? { name: topService.name, bookingsMonth: topService.bookingsMonth } : null,
    categories,
    activeCategory,
  };
}

function servicePayload(input, existingType) {
  const name = String(input?.name || "").trim();
  const category = String(input?.category || "").trim();
  const type = serviceTypeFromCategory(category) || existingType;
  const price = Number(input?.basePrice ?? input?.price ?? 0);

  if (!name) {
    const error = new Error("Service name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!type) {
    const error = new Error("Invalid service category");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(price) || price < 0) {
    const error = new Error("Invalid service price");
    error.statusCode = 400;
    throw error;
  }

  return {
    name,
    type,
    price,
    description: String(input?.description || "").trim() || null,
    is_active: input?.status ? input.status === "active" : true,
  };
}

async function listAdminServices(filters = {}) {
  const [services, appointmentServices] = await Promise.all([
    readTable("services", "id, name, type, price, description, is_active", {
      order: { column: "name", ascending: true },
    }),
    readTable("appointment_services", "service_id, quantity, unit_price"),
  ]);

  const serviceStats = new Map();
  appointmentServices.forEach((row) => {
    const current = serviceStats.get(row.service_id) || { bookings: 0, revenue: 0 };
    const quantity = Number(row.quantity || 1);
    current.bookings += quantity;
    current.revenue += quantity * Number(row.unit_price || 0);
    serviceStats.set(row.service_id, current);
  });

  const mapped = services.map((service) => {
    const stats = serviceStats.get(service.id) || { bookings: 0, revenue: 0 };
    return mapAdminService(service, stats);
  });

  const category = String(filters.category || "clinic");
  const status = String(filters.status || "all");
  const search = String(filters.search || "").trim().toLowerCase();
  const filtered = mapped.filter((service) => {
    const categoryMatched = !category || category === "all" || service.category === category;
    const statusMatched = status === "all" || !status || service.status === status;
    return categoryMatched && statusMatched && matchesServiceSearch(service, search);
  });

  return {
    services: filtered,
    summary: buildServiceSummary(mapped, filtered, category),
  };
}

async function createAdminService(input) {
  const payload = servicePayload(input);
  const { data, error } = await supabase
    .from("services")
    .insert(payload)
    .select("id, name, type, price, description, is_active")
    .single();

  if (error) throw new Error(error.message);

  return mapAdminService(data, { bookings: 0, revenue: 0 });
}

async function updateAdminService(displayId, input) {
  const id = parseServiceId(displayId);
  if (!id) {
    const error = new Error("Invalid service id");
    error.statusCode = 400;
    throw error;
  }

  const { data: existing, error: readError } = await supabase
    .from("services")
    .select("type")
    .eq("id", id)
    .single();

  if (readError) {
    const error = new Error(readError.message);
    error.statusCode = readError.code === "PGRST116" ? 404 : undefined;
    throw error;
  }

  const payload = servicePayload(input, existing.type);
  const { data, error } = await supabase
    .from("services")
    .update(payload)
    .eq("id", id)
    .select("id, name, type, price, description, is_active")
    .single();

  if (error) throw new Error(error.message);

  const result = await listAdminServices();
  return result.services.find((service) => service.id === `SV-${id}`) || mapAdminService(data, { bookings: 0, revenue: 0 });
}

async function updateAdminServiceStatus(displayId, status) {
  const id = parseServiceId(displayId);
  if (!id) {
    const error = new Error("Invalid service id");
    error.statusCode = 400;
    throw error;
  }

  if (!["active", "inactive"].includes(status)) {
    const error = new Error("Invalid service status");
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabase
    .from("services")
    .update({ is_active: status === "active" })
    .eq("id", id)
    .select("id, name, type, price, description, is_active")
    .single();

  if (error) throw new Error(error.message);

  const result = await listAdminServices();
  return result.services.find((service) => service.id === `SV-${id}`) || mapAdminService(data, { bookings: 0, revenue: 0 });
}

function mapAppointmentStatus(status) {
  const map = {
    PENDING: "scheduled",
    CONFIRMED: "scheduled",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    NO_SHOW: "cancelled",
  };
  return map[status] || "scheduled";
}

function appointmentDbStatus(status) {
  const map = {
    scheduled: "CONFIRMED",
    in_progress: "IN_PROGRESS",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
  };
  return map[status] || null;
}

function appointmentStatusLabel(status) {
  const map = {
    all: "Tất cả",
    scheduled: "Chờ khám",
    in_progress: "Đang khám",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return map[status] || status;
}

function parseAppointmentId(value) {
  const text = String(value || "").trim();
  const match = text.match(/^APT-(\d+)$/i);
  const rawId = match ? match[1] : text;
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function matchesAppointmentSearch(appointment, query) {
  if (!query) return true;
  const source = [
    appointment.id,
    appointment.customer,
    appointment.pet,
    appointment.species,
    appointment.service,
    appointment.staff,
    appointment.phone,
    appointment.email,
    appointment.notes,
  ].join(" ").toLowerCase();
  return source.includes(query);
}

function buildAppointmentSummary(allAppointments, filteredAppointments) {
  const statuses = ["scheduled", "in_progress", "completed", "cancelled"];
  const tabs = [
    { status: "all", label: appointmentStatusLabel("all"), count: allAppointments.length },
    ...statuses.map((status) => ({
      status,
      label: appointmentStatusLabel(status),
      count: allAppointments.filter((appointment) => appointment.status === status).length,
    })),
  ];
  const totalAmount = filteredAppointments.reduce((sum, appointment) => sum + Number(appointment.amountValue || 0), 0);

  return {
    total: allAppointments.length,
    filtered: filteredAppointments.length,
    totalAmount,
    totalAmountText: moneyText(totalAmount),
    tabs,
    serviceOptions: Array.from(new Set(allAppointments.map((appointment) => appointment.service).filter(Boolean))).sort(),
    staffOptions: Array.from(new Set(allAppointments.map((appointment) => appointment.staff).filter(Boolean))).sort(),
  };
}

async function listAdminAppointments(filters = {}) {
  const appointments = await readTable(
    "appointments",
    `
      id,
      status,
      requested_date,
      requested_time,
      note,
      created_at,
      pet:pets(name, animal_species:species_id(name), customer:customers(full_name, phone)),
      doctor:doctors(full_name),
      staff:staffs(full_name),
      appointment_services(quantity, unit_price, service:services(name))
    `,
    { order: { column: "created_at", ascending: false }, limit: 100 },
  );

  const mapped = appointments.map((appointment) => {
    const amount = (appointment.appointment_services || []).reduce(
      (sum, item) => sum + Number(item.quantity || 1) * Number(item.unit_price || 0),
      0,
    );
    const firstService = appointment.appointment_services?.[0]?.service?.name;

    return {
      id: `APT-${String(appointment.id).padStart(3, "0")}`,
      time: formatTime(appointment.requested_time) || formatTime(appointment.created_at) || "--:--",
      customer: appointment.pet?.customer?.full_name || "Chưa có khách hàng",
      pet: appointment.pet?.name || "Chưa có thú cưng",
      species: appointment.pet?.animal_species?.name || "",
      service: firstService || "Chưa có dịch vụ",
      staff: appointment.doctor?.full_name || appointment.staff?.full_name || "Chưa phân công",
      status: mapAppointmentStatus(appointment.status),
      amount: moneyText(amount),
      amountValue: moneyNumber(amount),
      phone: appointment.pet?.customer?.phone || "",
      email: "",
      notes: appointment.note || "",
    };
  });

  const status = String(filters.status || "all");
  const search = String(filters.search || "").trim().toLowerCase();
  const filtered = mapped.filter((appointment) => {
    const statusMatched = status === "all" || !status || appointment.status === status;
    return statusMatched && matchesAppointmentSearch(appointment, search);
  });

  return {
    appointments: filtered,
    summary: buildAppointmentSummary(mapped, filtered),
  };
}

async function updateAdminAppointmentStatus(displayId, status) {
  const id = parseAppointmentId(displayId);
  const dbStatus = appointmentDbStatus(status);

  if (!id) {
    const error = new Error("Invalid appointment id");
    error.statusCode = 400;
    throw error;
  }

  if (!dbStatus) {
    const error = new Error("Invalid appointment status");
    error.statusCode = 400;
    throw error;
  }

  const currentResult = await supabase
    .from("appointments")
    .select("doctor_schedule_slot_id")
    .eq("id", id)
    .maybeSingle();
  if (currentResult.error) throw new Error(currentResult.error.message);

  const updatePayload = dbStatus === "CANCELLED"
    ? { status: dbStatus, doctor_schedule_slot_id: null }
    : { status: dbStatus };

  const { error } = await supabase
    .from("appointments")
    .update(updatePayload)
    .eq("id", id);

  if (error) throw new Error(error.message);
  if (dbStatus === "CANCELLED" && currentResult.data?.doctor_schedule_slot_id) {
    await setDoctorScheduleSlotStatus(currentResult.data.doctor_schedule_slot_id, "AVAILABLE");
  }

  const result = await listAdminAppointments();
  const appointment = result.appointments.find((item) => item.id === `APT-${String(id).padStart(3, "0")}`);
  if (!appointment) {
    const notFound = new Error("Appointment not found");
    notFound.statusCode = 404;
    throw notFound;
  }

  return appointment;
}

const ADMIN_STAFF_DEPARTMENTS = ["clinic", "grooming", "boarding", "reception", "admin"];
const ADMIN_STAFF_STATUSES = ["active", "on_leave", "probation"];

function normalizeAdminStaffDepartment(value) {
  const department = String(value || "all").toLowerCase();
  if (department === "all" || ADMIN_STAFF_DEPARTMENTS.includes(department)) return department;
  return "all";
}

function normalizeAdminStaffStatus(value) {
  const status = String(value || "all").toLowerCase();
  if (status === "all" || status === "locked" || ADMIN_STAFF_STATUSES.includes(status)) return status;
  return "all";
}

function matchesAdminStaffSearch(member, query) {
  if (!query) return true;
  return [
    member.id,
    member.name,
    member.department,
    member.position,
    member.phone,
    member.email,
    member.specialty,
    member.room,
    member.licenseNo,
    member.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function filterAdminStaffRows(staff, filters = {}) {
  const department = normalizeAdminStaffDepartment(filters.department);
  const status = normalizeAdminStaffStatus(filters.status);
  const search = String(filters.search || "").trim().toLowerCase();

  return staff.filter((member) => {
    const departmentMatched = department === "all" || member.department === department;
    const statusMatched = status === "all" || (status === "locked" ? member.locked : member.workStatus === status);
    return departmentMatched && statusMatched && matchesAdminStaffSearch(member, search);
  });
}

function buildAdminStaffSummary(allStaff, filteredStaff, filters = {}) {
  const avgPerf = allStaff.length
    ? Math.round(allStaff.reduce((sum, member) => sum + Number(member.monthlyPerf || 0), 0) / allStaff.length)
    : 0;
  const avgRating = allStaff.length
    ? (allStaff.reduce((sum, member) => sum + Number(member.rating || 0), 0) / allStaff.length).toFixed(1)
    : "0.0";

  return {
    department: normalizeAdminStaffDepartment(filters.department),
    status: normalizeAdminStaffStatus(filters.status),
    search: String(filters.search || "").trim(),
    total: allStaff.length,
    filtered: filteredStaff.length,
    activeFiltered: filteredStaff.filter((member) => member.workStatus === "active" && !member.locked).length,
    active: allStaff.filter((member) => member.workStatus === "active" && !member.locked).length,
    onLeave: allStaff.filter((member) => member.workStatus === "on_leave").length,
    probation: allStaff.filter((member) => member.workStatus === "probation").length,
    locked: allStaff.filter((member) => member.locked).length,
    avgPerf,
    avgRating,
    departments: ADMIN_STAFF_DEPARTMENTS.map((department) => ({
      department,
      count: allStaff.filter((member) => member.department === department).length,
    })),
  };
}

async function listAdminStaff(filters = {}) {
  const users = await listAdminUsers();
  const doctors = users.doctors.map((doctor) => ({
    id: doctor.id.replace(/^D/, "NV-C"),
    name: doctor.name,
    avatar: doctor.avatar,
    department: "clinic",
    position: "Bác sĩ thú y",
    phone: doctor.phone,
    email: doctor.email,
    joinDate: doctor.joinDate,
    shift: "Cả ngày (7–19h)",
    workStatus: doctor.status,
    locked: doctor.locked,
    todayTasks: doctor.todayPatients,
    completedTasks: 0,
    monthlyPerf: 0,
    rating: doctor.rating,
    notes: "",
    specialty: doctor.specialty,
    room: doctor.room,
    licenseNo: doctor.licenseNo,
    todayPatients: doctor.todayPatients,
  }));
  const staff = users.staff.map((member) => ({
    id: member.id.replace(/^S/, "NV-S"),
    name: member.name,
    avatar: member.avatar,
    department: "reception",
    position: member.position,
    phone: member.phone,
    email: member.email,
    joinDate: member.joinDate,
    shift: "Cả ngày (7–19h)",
    workStatus: member.status,
    locked: member.locked,
    todayTasks: member.tasksToday,
    completedTasks: 0,
    monthlyPerf: 0,
    rating: 0,
    notes: "",
  }));

  const allStaff = [...doctors, ...staff];
  const filteredStaff = filterAdminStaffRows(allStaff, filters);

  return {
    staff: filteredStaff,
    summary: buildAdminStaffSummary(allStaff, filteredStaff, filters),
  };
}

async function getAdminDashboard() {
  const [users, services, appointmentStatsRows, recentAppointments, pets, invoices, cages, boardings] = await Promise.all([
    readTable("users", "id, role, status"),
    readTable("services", "id, is_active"),
    readTable("appointments", "id, status"),
    readTable(
      "appointments",
      `
        id,
        status,
        requested_date,
        requested_time,
        created_at,
        pet:pets(name, customer:customers(full_name)),
        doctor:doctors(full_name),
        staff:staffs(full_name)
      `,
      { order: { column: "created_at", ascending: false }, limit: 8 },
    ),
    readTable("pets", "id"),
    readTable("invoices", "id, total_amount, created_at", {
      order: { column: "created_at", ascending: false },
      limit: 120,
    }),
    readTable("cages", "id, cage_number, status"),
    readTable(
      "boarding",
      `
        id,
        cage_id,
        check_in,
        check_out,
        current_status,
        appointment:appointments(pet:pets(name, animal_species:species_id(name), customer:customers(full_name)))
      `,
    ),
  ]);

  const statusCounts = new Map();
  appointmentStatsRows.forEach((appointment) => {
    const mapped = mapAppointmentStatus(appointment.status);
    statusCounts.set(mapped, (statusCounts.get(mapped) || 0) + 1);
  });

  const revenueByMonthMap = new Map();
  invoices.forEach((invoice) => {
    const key = monthKey(invoice.created_at);
    revenueByMonthMap.set(key, (revenueByMonthMap.get(key) || 0) + moneyNumber(invoice.total_amount));
  });

  const activeBoardingByCage = new Map(
    boardings
      .filter((boarding) => ["BOOKED", "CHECKED_IN"].includes(String(boarding.current_status || "")))
      .map((boarding) => [boarding.cage_id, boarding]),
  );

  return {
    totals: {
      customers: users.filter((user) => normalizeRole(user.role) === "customer").length,
      doctors: users.filter((user) => normalizeRole(user.role) === "doctor").length,
      staff: users.filter((user) => normalizeRole(user.role) === "staff").length,
      pets: pets.length,
      services: services.length,
      activeServices: services.filter((service) => service.is_active).length,
      appointments: appointmentStatsRows.length,
      scheduledAppointments: appointmentStatsRows.filter((appointment) => ["PENDING", "CONFIRMED"].includes(appointment.status)).length,
      revenue: invoices.reduce((sum, invoice) => sum + moneyNumber(invoice.total_amount), 0),
      cages: cages.length,
      occupiedCages: activeBoardingByCage.size,
    },
    appointmentsByStatus: Array.from(statusCounts.entries()).map(([status, value]) => ({
      status,
      label: dashboardStatusLabel(status),
      value,
    })),
    revenueByMonth: Array.from(revenueByMonthMap.entries())
      .slice(-6)
      .map(([label, value]) => ({ label, value })),
    recentActivity: recentAppointments.map((appointment) => ({
      id: appointment.id,
      time: formatTime(appointment.requested_time) || formatTime(appointment.created_at) || "--:--",
      title: `${dashboardStatusLabel(appointment.status)} - ${appointment.pet?.name || "Thú cưng"}`,
      description: [
        appointment.pet?.customer?.full_name,
        appointment.doctor?.full_name || appointment.staff?.full_name,
      ].filter(Boolean).join(" · "),
    })),
    boardingRooms: cages.map((cage) => {
      const boarding = activeBoardingByCage.get(cage.id);
      return {
        id: cage.id,
        number: cage.cage_number,
        status: boarding ? "occupied" : "available",
        pet: boarding?.appointment?.pet?.name || "",
        species: boarding?.appointment?.pet?.animal_species?.name || "",
        owner: boarding?.appointment?.pet?.customer?.full_name || "",
      };
    }),
  };
}

async function getAdminReports() {
  const [invoices, invoiceItems, services, appointments, users, doctors, staffs] = await Promise.all([
    readTable("invoices", "id, total_amount, created_at, payment_status, status", {
      order: { column: "created_at", ascending: true },
    }),
    readTable("invoice_items", "id, invoice_id, service_id, quantity, total_price, unit_price, description"),
    readTable("services", "id, name, type"),
    readTable("appointments", "id, status, doctor_id, staff_id, created_at"),
    readTable("users", "id, role"),
    readTable("doctors", "id, full_name, specialization"),
    readTable("staffs", "id, full_name"),
  ]);

  const servicesById = buildMaps(services, "id");
  const doctorsById = buildMaps(doctors, "id");
  const staffsById = buildMaps(staffs, "id");

  const revenueMap = new Map();
  invoices.forEach((invoice) => {
    const key = monthKey(invoice.created_at);
    const current = revenueMap.get(key) || { label: key, clinic: 0, vaccination: 0, grooming: 0, boarding: 0 };
    const invoiceLines = invoiceItems.filter((item) => item.invoice_id === invoice.id);

    if (invoiceLines.length === 0) {
      current.clinic += moneyNumber(invoice.total_amount);
    } else {
      invoiceLines.forEach((item) => {
        const service = servicesById.get(item.service_id);
        const category = serviceCategory(service?.type);
        current[category] += moneyNumber(item.total_price || Number(item.quantity || 1) * Number(item.unit_price || 0));
      });
    }

    revenueMap.set(key, current);
  });

  const serviceMap = new Map();
  invoiceItems.forEach((item) => {
    const service = servicesById.get(item.service_id);
    const key = item.service_id || item.description;
    const current = serviceMap.get(key) || {
      id: key,
      name: service?.name || item.description || "Dịch vụ",
      category: serviceCategory(service?.type),
      bookings: 0,
      revenue: 0,
      rating: 0,
    };
    current.bookings += Number(item.quantity || 1);
    current.revenue += moneyNumber(item.total_price || Number(item.quantity || 1) * Number(item.unit_price || 0));
    serviceMap.set(key, current);
  });

  const statusMap = new Map();
  appointments.forEach((appointment) => {
    const status = mapAppointmentStatus(appointment.status);
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const staffMap = new Map();
  appointments.forEach((appointment) => {
    const id = appointment.doctor_id ? `doctor-${appointment.doctor_id}` : appointment.staff_id ? `staff-${appointment.staff_id}` : null;
    if (!id) return;
    const person = appointment.doctor_id ? doctorsById.get(appointment.doctor_id) : staffsById.get(appointment.staff_id);
    const current = staffMap.get(id) || {
      id,
      name: person?.full_name || "Nhân sự",
      department: appointment.doctor_id ? (person?.specialization || "Phòng khám") : "Vận hành",
      appointments: 0,
      completed: 0,
      revenue: 0,
    };
    current.appointments += 1;
    if (appointment.status === "COMPLETED") current.completed += 1;
    staffMap.set(id, current);
  });

  const totalRevenue = invoices.reduce((sum, invoice) => sum + moneyNumber(invoice.total_amount), 0);
  const servedCustomers = users.filter((user) => normalizeRole(user.role) === "customer").length;
  const totalBookings = appointments.length;

  return {
    summary: {
      revenue: totalRevenue,
      customers: servedCustomers,
      bookings: totalBookings,
      avgRevenue: totalBookings ? Math.round(totalRevenue / totalBookings) : 0,
    },
    revenueByPeriod: Array.from(revenueMap.values()).slice(-12),
    topServices: Array.from(serviceMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    appointmentStats: {
      scheduled: statusMap.get("scheduled") || 0,
      inProgress: statusMap.get("in_progress") || 0,
      completed: statusMap.get("completed") || 0,
      cancelled: statusMap.get("cancelled") || 0,
      total: totalBookings,
    },
    staffPerformance: Array.from(staffMap.values()).map((person) => ({
      ...person,
      completionRate: person.appointments ? Math.round((person.completed / person.appointments) * 100) : 0,
    })),
  };
}

async function getAdminSettings(authUser) {
  const adminName = authUser?.fullName || authUser?.email || "Quản trị viên";
  const adminEmail = authUser?.email || "";

  const defaults = {
    clinic: {
      name: process.env.CLINIC_NAME || "Pet Service",
      address: process.env.CLINIC_ADDRESS || "",
      phone: process.env.CLINIC_PHONE || "",
      email: process.env.CLINIC_EMAIL || "",
      website: process.env.CLINIC_WEBSITE || "",
      taxCode: process.env.CLINIC_TAX_CODE || "",
      openFrom: process.env.CLINIC_OPEN_FROM || "07:30",
      openTo: process.env.CLINIC_OPEN_TO || "20:00",
      timezone: process.env.TZ || "Asia/Ho_Chi_Minh",
    },
    account: {
      name: adminName,
      email: adminEmail,
      phone: authUser?.phone || "",
      role: "Quản trị viên",
      initials: initials(adminName),
    },
    notifications: {
      emailNewAppt: true,
      emailCancelAppt: true,
      emailReminder: true,
      emailExamResult: true,
      emailPaymentConfirmation: true,
      emailFollowUpReminder: true,
      emailVaccinationReminder: true,
      emailBoardingUpdate: true,
      smsNewAppt: false,
      smsReminder: false,
      smsCancelAppt: false,
      pushNewAppt: true,
      pushReminder: true,
      pushBoardingAlert: true,
      weeklyReport: true,
      monthlyReport: true,
      lowInventory: true,
      vaccineExpiry: true,
    },
    payment: {
      method: "both",
      bankName: process.env.CLINIC_BANK_NAME || "",
      bankAccount: process.env.CLINIC_BANK_ACCOUNT || "",
      bankOwner: process.env.CLINIC_BANK_OWNER || "",
      autoInvoice: true,
      vatEnabled: false,
    },
    security: {
      twoFactorEnabled: false,
      sessions: [
        {
          device: "Trình duyệt hiện tại",
          location: "Phiên đăng nhập hiện tại",
          time: "Hiện tại",
          current: true,
        },
      ],
    },
  };
  const stored = await getStoredSetting("admin.settings");
  if (!stored) return defaults;
  return {
    ...defaults,
    ...stored,
    clinic: { ...defaults.clinic, ...stored.clinic },
    account: { ...defaults.account, ...stored.account, initials: initials(stored.account?.name || adminName) },
    notifications: { ...defaults.notifications, ...stored.notifications },
    payment: { ...defaults.payment, ...stored.payment },
    security: { ...defaults.security, ...stored.security },
  };
}

async function updateAdminSettings(input, authUser) {
  const current = await getAdminSettings(authUser);
  const next = {
    ...current,
    ...input,
    clinic: { ...current.clinic, ...(input?.clinic || {}) },
    account: { ...current.account, ...(input?.account || {}) },
    notifications: { ...current.notifications, ...(input?.notifications || {}) },
    payment: { ...current.payment, ...(input?.payment || {}) },
    security: { ...current.security, ...(input?.security || {}) },
  };
  next.account.initials = initials(next.account.name);
  return saveStoredSetting("admin.settings", next);
}

async function getAdminExamContext() {
  const [appointments, diseases, prescriptionItems, medicalVisits] = await Promise.all([
    readTable(
      "appointments",
      `
        id,
        status,
        requested_date,
        requested_time,
        note,
        pet:pets(
          id,
          name,
          gender,
          dob,
          weight,
          animal_species:species_id(name),
          breed:breed_id(name),
          customer:customers(full_name, phone)
        ),
        doctor:doctors(full_name, room_name),
        staff:staffs(full_name),
        appointment_services(service:services(name))
      `,
      { order: { column: "created_at", ascending: false }, limit: 1 },
    ),
    readTable("diseases", "id, name", { order: { column: "name", ascending: true }, limit: 12 }),
    readTable("prescription_items", "id, medicine_name, dosage, frequency, duration_days, instructions", {
      order: { column: "id", ascending: false },
      limit: 8,
    }),
    readTable(
      "medical_visits",
      `
        id,
        appointment_id,
        diagnosis_note,
        created_at,
        appointment:appointments(
          requested_date,
          pet:pets(name),
          appointment_services(service:services(name))
        )
      `,
      { order: { column: "created_at", ascending: false }, limit: 5 },
    ),
  ]);

  const appointment = appointments[0] || null;
  const pet = appointment?.pet || {};
  const service = appointment?.appointment_services?.[0]?.service?.name || "";
  const provider = appointment?.doctor?.full_name || appointment?.staff?.full_name || "";

  const bodySystems = [
    "Da & lông",
    "Mắt & tai",
    "Hô hấp",
    "Tim mạch",
    "Tiêu hóa",
    "Thần kinh",
    "Cơ xương khớp",
    "Hạch bạch huyết",
  ].map((label, index) => ({
    id: `system-${index + 1}`,
    label,
    status: "not_checked",
    note: "",
  }));

  return {
    header: {
      appointmentCode: appointment ? `APT-${String(appointment.id).padStart(3, "0")}` : "",
      status: appointment ? mapAppointmentStatus(appointment.status) : "scheduled",
      time: formatTime(appointment?.requested_time),
      room: appointment?.doctor?.room_name || "",
      provider,
    },
    pet: {
      name: pet.name || "",
      species: pet.animal_species?.name || "",
      breed: pet.breed?.name || "",
      gender: pet.gender || "",
      weightKg: pet.weight ? String(pet.weight) : "",
      owner: pet.customer?.full_name || "",
      phone: pet.customer?.phone || "",
      service,
      note: appointment?.note || "",
    },
    vitals: [],
    history: medicalVisits.map((visit) => ({
      date: formatDate(visit.appointment?.requested_date || visit.created_at),
      service: visit.appointment?.appointment_services?.[0]?.service?.name || "Khám bệnh",
      outcome: visit.diagnosis_note || "",
    })),
    options: {
      symptoms: diseases.map((disease) => ({
        id: String(disease.id),
        label: disease.name,
        active: false,
      })),
      bodySystems,
      drugs: prescriptionItems.map((item) => ({
        id: item.id,
        name: item.medicine_name || "",
        dose: item.dosage || "",
        frequency: item.frequency || "",
        duration: item.duration_days ? `${item.duration_days} ngày` : "",
        note: item.instructions || "",
      })),
    },
  };
}

module.exports = {
  createAdminService,
  getAdminDashboard,
  getAdminReports,
  getAdminSettings,
  updateAdminSettings,
  listAdminAppointments,
  listAdminServices,
  listAdminStaff,
  listAdminUsers,
  updateAdminAppointmentStatus,
  updateAdminService,
  updateAdminServiceStatus,
  updateAdminUserLock,
};
