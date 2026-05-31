const { supabase } = require("../lib/supabaseClient");

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

async function listAdminUsers() {
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

  return {
    customers: customersResult,
    doctors: doctorsResult,
    staff: staffResult,
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

async function listAdminServices() {
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

  return services.map((service) => {
    const stats = serviceStats.get(service.id) || { bookings: 0, revenue: 0 };
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
  });
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

async function listAdminAppointments() {
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

  return appointments.map((appointment) => {
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
      phone: appointment.pet?.customer?.phone || "",
      email: "",
      notes: appointment.note || "",
    };
  });
}

async function listAdminStaff() {
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

  return [...doctors, ...staff];
}

async function getAdminDashboard() {
  const [users, services, appointments, pets] = await Promise.all([
    readTable("users", "id, role, status"),
    readTable("services", "id, is_active"),
    readTable("appointments", "id, status"),
    readTable("pets", "id"),
  ]);

  return {
    totals: {
      customers: users.filter((user) => normalizeRole(user.role) === "customer").length,
      doctors: users.filter((user) => normalizeRole(user.role) === "doctor").length,
      staff: users.filter((user) => normalizeRole(user.role) === "staff").length,
      pets: pets.length,
      services: services.length,
      activeServices: services.filter((service) => service.is_active).length,
      appointments: appointments.length,
      scheduledAppointments: appointments.filter((appointment) => ["PENDING", "CONFIRMED"].includes(appointment.status)).length,
    },
  };
}

module.exports = {
  getAdminDashboard,
  listAdminAppointments,
  listAdminServices,
  listAdminStaff,
  listAdminUsers,
};
