require("dotenv").config();

const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const seedTag = "[seed:pet-service-v2]";

const date = (value) => new Date(`${value}T00:00:00.000Z`);
const time = (value) => new Date(`1970-01-01T${value}.000Z`);
const money = (value) => new Prisma.Decimal(value);

function addMinutesToTime(value, minutes) {
  const next = new Date(value);
  next.setUTCMinutes(next.getUTCMinutes() + minutes);
  return next;
}

function appointmentSlotStatus(status) {
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "COMPLETED") return "DONE";
  if (["CANCELLED", "NO_SHOW"].includes(status)) return "AVAILABLE";
  return "BOOKED";
}

async function upsertUser(email, role) {
  return prisma.user.upsert({
    where: { email },
    update: { role, status: "ACTIVE" },
    create: {
      email,
      passwordHash: "$2b$10$seeded-password-hash-for-demo-only",
      role,
      status: "ACTIVE",
    },
  });
}

async function upsertService(data) {
  const existing = await prisma.service.findFirst({ where: { name: data.name } });

  if (existing) {
    return prisma.service.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.service.create({ data });
}

async function upsertAppointment(data) {
  const existing = await prisma.appointment.findFirst({
    where: { note: data.note },
  });

  if (existing) {
    return prisma.appointment.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.appointment.create({ data });
}

async function upsertDoctorScheduleSlot(data) {
  return prisma.doctorScheduleSlot.upsert({
    where: {
      doctorId_slotDate_startTime: {
        doctorId: data.doctorId,
        slotDate: data.slotDate,
        startTime: data.startTime,
      },
    },
    update: data,
    create: data,
  });
}

async function upsertAppointmentService(data) {
  const existing = await prisma.appointmentService.findFirst({
    where: {
      appointmentId: data.appointmentId,
      serviceId: data.serviceId,
    },
  });

  if (existing) {
    return prisma.appointmentService.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.appointmentService.create({ data });
}

async function upsertInvoice(appointmentId, data, items) {
  const invoice = await prisma.invoice.upsert({
    where: { appointmentId },
    update: data,
    create: {
      appointmentId,
      ...data,
    },
  });

  await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });

  await prisma.invoiceItem.createMany({
    data: items.map((item) => ({
      invoiceId: invoice.id,
      ...item,
    })),
  });

  return invoice;
}

async function resetSeededWorkflowData() {
  await prisma.review.deleteMany({
    where: {
      feedback: { startsWith: "[Seed]" },
    },
  });
  await prisma.notification.deleteMany({
    where: {
      title: { startsWith: "[Seed]" },
    },
  });
  await prisma.appointment.deleteMany({
    where: {
      note: { startsWith: seedTag },
    },
  });

  await prisma.animalSpecies.updateMany({ where: { name: "Cho" }, data: { name: "Chó" } });
  await prisma.animalSpecies.updateMany({ where: { name: "Meo" }, data: { name: "Mèo" } });
  await prisma.animalSpecies.updateMany({ where: { name: "Tho" }, data: { name: "Thỏ" } });

  await prisma.service.updateMany({ where: { name: "Kham tong quat" }, data: { name: "Khám tổng quát" } });
  await prisma.service.updateMany({ where: { name: "Tiem vaccine 5 benh" }, data: { name: "Tiêm vaccine 5 bệnh" } });
  await prisma.service.updateMany({ where: { name: "Tam va cat tia long" }, data: { name: "Tắm và cắt tỉa lông" } });
  await prisma.service.updateMany({ where: { name: "Luu tru pet hotel 1 ngay" }, data: { name: "Lưu trú pet hotel 1 ngày" } });
  await prisma.service.updateMany({ where: { name: "Pate bo sung" }, data: { name: "Pate bổ sung" } });

  await prisma.disease.updateMany({ where: { name: "Viem da co dia" }, data: { name: "Viêm da cơ địa" } });
  await prisma.disease.updateMany({ where: { name: "Roi loan tieu hoa" }, data: { name: "Rối loạn tiêu hóa" } });
  await prisma.disease.updateMany({ where: { name: "Nhiem ky sinh trung ngoai da" }, data: { name: "Nhiễm ký sinh trùng ngoài da" } });

  await prisma.vaccination.updateMany({ where: { vaccineName: "Vaccine 5 benh" }, data: { vaccineName: "Vaccine 5 bệnh" } });
  await prisma.vaccination.updateMany({ where: { vaccineName: "Vaccine dai" }, data: { vaccineName: "Vaccine dại" } });
  await prisma.vaccination.updateMany({ where: { vaccineName: "Vaccine ho coi cho" }, data: { vaccineName: "Vaccine ho cũi chó" } });
  await prisma.vaccination.deleteMany({
    where: {
      vaccineName: {
        in: ["Vaccine 5 bệnh", "Vaccine dại", "Vaccine ho cũi chó"],
      },
    },
  });

  await prisma.pet.updateMany({ where: { name: "Bap" }, data: { name: "Bắp" } });
  await prisma.pet.updateMany({ where: { name: "Bong" }, data: { name: "Bông" } });
}

async function main() {
  await resetSeededWorkflowData();

  const adminUser = await upsertUser("admin@petservice.local", "ADMIN");

  const customerUsers = await Promise.all([
    upsertUser("minh.nguyen@example.com", "CUSTOMER"),
    upsertUser("lan.tran@example.com", "CUSTOMER"),
    upsertUser("hoa.pham@example.com", "CUSTOMER"),
  ]);

  const doctorUsers = await Promise.all([
    upsertUser("doctor.an@example.com", "DOCTOR"),
    upsertUser("doctor.binh@example.com", "DOCTOR"),
    upsertUser("doctor.chi@example.com", "DOCTOR"),
  ]);

  const staffUsers = await Promise.all([
    upsertUser("staff.thao@example.com", "STAFF"),
    upsertUser("staff.long@example.com", "STAFF"),
    upsertUser("staff.nhi@example.com", "STAFF"),
  ]);

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { userId: customerUsers[0].id },
      update: {
        fullName: "Nguyễn Văn Minh",
        phone: "0901000001",
        address: "12 Nguyễn Trãi, Quận 1, TP.HCM",
      },
      create: {
        userId: customerUsers[0].id,
        fullName: "Nguyễn Văn Minh",
        phone: "0901000001",
        address: "12 Nguyễn Trãi, Quận 1, TP.HCM",
      },
    }),
    prisma.customer.upsert({
      where: { userId: customerUsers[1].id },
      update: {
        fullName: "Trần Ngọc Lan",
        phone: "0901000002",
        address: "88 Lê Lợi, Quận 3, TP.HCM",
      },
      create: {
        userId: customerUsers[1].id,
        fullName: "Trần Ngọc Lan",
        phone: "0901000002",
        address: "88 Lê Lợi, Quận 3, TP.HCM",
      },
    }),
    prisma.customer.upsert({
      where: { userId: customerUsers[2].id },
      update: {
        fullName: "Phạm Minh Hòa",
        phone: "0901000003",
        address: "25 Phan Xích Long, Phú Nhuận, TP.HCM",
      },
      create: {
        userId: customerUsers[2].id,
        fullName: "Phạm Minh Hòa",
        phone: "0901000003",
        address: "25 Phan Xích Long, Phú Nhuận, TP.HCM",
      },
    }),
  ]);

  const doctors = await Promise.all([
    prisma.doctor.upsert({
      where: { userId: doctorUsers[0].id },
      update: {
        fullName: "BS. Lê Hoàng An",
        specialization: "Nội khoa thú y",
        degree: "DVM",
        experienceYears: 8,
        roomName: "Phòng khám 01",
      },
      create: {
        userId: doctorUsers[0].id,
        fullName: "BS. Lê Hoàng An",
        specialization: "Nội khoa thú y",
        degree: "DVM",
        experienceYears: 8,
        roomName: "Phòng khám 01",
      },
    }),
    prisma.doctor.upsert({
      where: { userId: doctorUsers[1].id },
      update: {
        fullName: "BS. Phạm Quang Bình",
        specialization: "Da liễu và vaccine",
        degree: "DVM",
        experienceYears: 5,
        roomName: "Phòng khám 02",
      },
      create: {
        userId: doctorUsers[1].id,
        fullName: "BS. Phạm Quang Bình",
        specialization: "Da liễu và vaccine",
        degree: "DVM",
        experienceYears: 5,
        roomName: "Phòng khám 02",
      },
    }),
    prisma.doctor.upsert({
      where: { userId: doctorUsers[2].id },
      update: {
        fullName: "BS. Nguyễn Mai Chi",
        specialization: "Dinh dưỡng và nội khoa",
        degree: "DVM",
        experienceYears: 4,
        roomName: "Phòng khám 03",
      },
      create: {
        userId: doctorUsers[2].id,
        fullName: "BS. Nguyễn Mai Chi",
        specialization: "Dinh dưỡng và nội khoa",
        degree: "DVM",
        experienceYears: 4,
        roomName: "Phòng khám 03",
      },
    }),
  ]);

  const staffs = await Promise.all([
    prisma.staff.upsert({
      where: { userId: staffUsers[0].id },
      update: {
        fullName: "Võ Thu Thảo",
        phone: "0902000001",
        address: "Quận Bình Thạnh, TP.HCM",
      },
      create: {
        userId: staffUsers[0].id,
        fullName: "Võ Thu Thảo",
        phone: "0902000001",
        address: "Quận Bình Thạnh, TP.HCM",
      },
    }),
    prisma.staff.upsert({
      where: { userId: staffUsers[1].id },
      update: {
        fullName: "Đỗ Thanh Long",
        phone: "0902000002",
        address: "Quận Gò Vấp, TP.HCM",
      },
      create: {
        userId: staffUsers[1].id,
        fullName: "Đỗ Thanh Long",
        phone: "0902000002",
        address: "Quận Gò Vấp, TP.HCM",
      },
    }),
    prisma.staff.upsert({
      where: { userId: staffUsers[2].id },
      update: {
        fullName: "Lê Bảo Nhi",
        phone: "0902000003",
        address: "Quận Tân Bình, TP.HCM",
      },
      create: {
        userId: staffUsers[2].id,
        fullName: "Lê Bảo Nhi",
        phone: "0902000003",
        address: "Quận Tân Bình, TP.HCM",
      },
    }),
  ]);

  const [dog, cat, rabbit] = await Promise.all([
    prisma.animalSpecies.upsert({
      where: { name: "Chó" },
      update: {
        description: "Loài thú cưng phổ biến, cần vận động và tiêm phòng định kỳ.",
        careInstruction: "Cho ăn đúng bữa, tắm định kỳ và theo dõi vaccine.",
      },
      create: {
        name: "Chó",
        description: "Loài thú cưng phổ biến, cần vận động và tiêm phòng định kỳ.",
        careInstruction: "Cho ăn đúng bữa, tắm định kỳ và theo dõi vaccine.",
      },
    }),
    prisma.animalSpecies.upsert({
      where: { name: "Mèo" },
      update: {
        description: "Thú cưng nhỏ, cần chăm sóc lông và kiểm tra ký sinh trùng.",
        careInstruction: "Chăm lông, cắt móng và vệ sinh khay cát thường xuyên.",
      },
      create: {
        name: "Mèo",
        description: "Thú cưng nhỏ, cần chăm sóc lông và kiểm tra ký sinh trùng.",
        careInstruction: "Chăm lông, cắt móng và vệ sinh khay cát thường xuyên.",
      },
    }),
    prisma.animalSpecies.upsert({
      where: { name: "Thỏ" },
      update: {
        description: "Thú cưng ăn cỏ, cần chú ý răng và hệ tiêu hóa.",
        careInstruction: "Bổ sung cỏ khô, rau sạch và không gian thoáng.",
      },
      create: {
        name: "Thỏ",
        description: "Thú cưng ăn cỏ, cần chú ý răng và hệ tiêu hóa.",
        careInstruction: "Bổ sung cỏ khô, rau sạch và không gian thoáng.",
      },
    }),
  ]);

  const [poodle, corgi, britishShorthair, persian, hollandLop] = await Promise.all([
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: dog.id, name: "Poodle" } },
      update: { description: "Giống chó nhỏ, lông xoăn, cần grooming định kỳ." },
      create: { speciesId: dog.id, name: "Poodle", description: "Giống chó nhỏ, lông xoăn, cần grooming định kỳ." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: dog.id, name: "Corgi" } },
      update: { description: "Giống chó chân ngắn, năng động." },
      create: { speciesId: dog.id, name: "Corgi", description: "Giống chó chân ngắn, năng động." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: cat.id, name: "British Shorthair" } },
      update: { description: "Mèo Anh lông ngắn, tính cách hiền." },
      create: { speciesId: cat.id, name: "British Shorthair", description: "Mèo Anh lông ngắn, tính cách hiền." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: cat.id, name: "Persian" } },
      update: { description: "Mèo Ba Tư lông dài, cần chăm lông kỹ." },
      create: { speciesId: cat.id, name: "Persian", description: "Mèo Ba Tư lông dài, cần chăm lông kỹ." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: rabbit.id, name: "Holland Lop" } },
      update: { description: "Thỏ tai cụp kích thước nhỏ." },
      create: { speciesId: rabbit.id, name: "Holland Lop", description: "Thỏ tai cụp kích thước nhỏ." },
    }),
  ]);

  await Promise.all([
    // Thêm các giống chó
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: dog.id, name: "Golden Retriever" } },
      update: { description: "Giống chó thông minh, thân thiện, trung thành." },
      create: { speciesId: dog.id, name: "Golden Retriever", description: "Giống chó thông minh, thân thiện, trung thành." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: dog.id, name: "Husky" } },
      update: { description: "Giống chó kéo xe năng động, thân thiện và tinh nghịch." },
      create: { speciesId: dog.id, name: "Husky", description: "Giống chó kéo xe năng động, thân thiện và tinh nghịch." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: dog.id, name: "Pug" } },
      update: { description: "Giống chó mặt xệ, thân thiện, thích ngủ." },
      create: { speciesId: dog.id, name: "Pug", description: "Giống chó mặt xệ, thân thiện, thích ngủ." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: dog.id, name: "Shiba Inu" } },
      update: { description: "Giống chó từ Nhật Bản, tự lập và sạch sự." },
      create: { speciesId: dog.id, name: "Shiba Inu", description: "Giống chó từ Nhật Bản, tự lập và sạch sự." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: dog.id, name: "Bulldog" } },
      update: { description: "Giống chó dũng mãnh nhưng hiền lành." },
      create: { speciesId: dog.id, name: "Bulldog", description: "Giống chó dũng mãnh nhưng hiền lành." },
    }),

    // Thêm các giống mèo
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: cat.id, name: "Maine Coon" } },
      update: { description: "Giống mèo kích thước lớn, lông dày và thân thiện." },
      create: { speciesId: cat.id, name: "Maine Coon", description: "Giống mèo kích thước lớn, lông dày và thân thiện." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: cat.id, name: "Ragdoll" } },
      update: { description: "Mèo lông dài, mắt xanh dương, rất quấn chủ." },
      create: { speciesId: cat.id, name: "Ragdoll", description: "Mèo lông dài, mắt xanh dương, rất quấn chủ." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: cat.id, name: "Sphynx" } },
      update: { description: "Mèo không lông đặc trưng, thông minh và năng động." },
      create: { speciesId: cat.id, name: "Sphynx", description: "Mèo không lông đặc trưng, thông minh và năng động." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: cat.id, name: "Siamese (Mèo Xiêm)" } },
      update: { description: "Mèo Xiêm thông minh, mắt xanh đặc trưng." },
      create: { speciesId: cat.id, name: "Siamese (Mèo Xiêm)", description: "Mèo Xiêm thông minh, mắt xanh đặc trưng." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: cat.id, name: "Scottish Fold" } },
      update: { description: "Mèo tai cụp đáng yêu và điềm tĩnh." },
      create: { speciesId: cat.id, name: "Scottish Fold", description: "Mèo tai cụp đáng yêu và điềm tĩnh." },
    }),
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: cat.id, name: "Munchkin" } },
      update: { description: "Mèo chân ngắn ngộ nghĩnh và năng động." },
      create: { speciesId: cat.id, name: "Munchkin", description: "Mèo chân ngắn ngộ nghĩnh và năng động." },
    }),

    // Thêm các giống thỏ
    prisma.breed.upsert({
      where: { speciesId_name: { speciesId: rabbit.id, name: "Netherland Dwarf" } },
      update: { description: "Giống thỏ siêu nhỏ, năng động." },
      create: { speciesId: rabbit.id, name: "Netherland Dwarf", description: "Giống thỏ siêu nhỏ, năng động." },
    }),
  ]);

  const petData = [
    {
      customerId: customers[0].id,
      speciesId: dog.id,
      breedId: poodle.id,
      name: "Milo",
      gender: "MALE",
      dob: date("2021-03-12"),
      weight: money("5.40"),
      color: "Trắng",
      allergies: "Dị ứng nhẹ với hải sản",
      specialNote: "Hơi sợ tiếng động lớn",
    },
    {
      customerId: customers[0].id,
      speciesId: cat.id,
      breedId: britishShorthair.id,
      name: "Miu",
      gender: "FEMALE",
      dob: date("2022-06-05"),
      weight: money("4.10"),
      color: "Xám xanh",
      allergies: null,
      specialNote: "Cần vệ sinh mắt hằng ngày",
    },
    {
      customerId: customers[1].id,
      speciesId: dog.id,
      breedId: corgi.id,
      name: "Bắp",
      gender: "MALE",
      dob: date("2020-10-20"),
      weight: money("10.20"),
      color: "Vàng trắng",
      allergies: null,
      chronicDiseases: "Dễ tăng cân",
    },
    {
      customerId: customers[2].id,
      speciesId: cat.id,
      breedId: persian.id,
      name: "Kem",
      gender: "FEMALE",
      dob: date("2023-01-18"),
      weight: money("3.80"),
      color: "Kem",
      allergies: "Không dùng sữa bò",
    },
    {
      customerId: customers[2].id,
      speciesId: rabbit.id,
      breedId: hollandLop.id,
      name: "Bông",
      gender: "UNKNOWN",
      dob: date("2023-09-01"),
      weight: money("1.70"),
      color: "Nâu trắng",
      specialNote: "Ăn cỏ khô mỗi ngày",
    },
  ];

  const pets = [];
  for (const item of petData) {
    const existing = await prisma.pet.findFirst({
      where: {
        customerId: item.customerId,
        name: item.name,
      },
    });
    pets.push(existing ? await prisma.pet.update({ where: { id: existing.id }, data: item }) : await prisma.pet.create({ data: item }));
  }

  const services = await Promise.all([
    upsertService({
      name: "Khám tổng quát",
      type: "MEDICAL",
      price: money("250000"),
      description: "Khám sức khỏe cơ bản và tư vấn chăm sóc.",
      isActive: true,
    }),
    upsertService({
      name: "Tiêm vaccine 5 bệnh",
      type: "VACCINE",
      price: money("350000"),
      description: "Tiêm vaccine phòng bệnh định kỳ.",
      isActive: true,
    }),
    upsertService({
      name: "Tắm và cắt tỉa lông",
      type: "GROOMING",
      price: money("300000"),
      description: "Tắm, sấy, cắt tỉa và vệ sinh tai móng.",
      isActive: true,
    }),
    upsertService({
      name: "Lưu trú pet hotel 1 ngày",
      type: "BOARDING",
      price: money("180000"),
      description: "Dịch vụ lưu trú theo ngày.",
      isActive: true,
    }),
    upsertService({
      name: "Pate bổ sung",
      type: "FOOD",
      price: money("45000"),
      description: "Khẩu phần pate thêm trong ngày.",
      isActive: true,
    }),
  ]);

  const diseases = await Promise.all([
    prisma.disease.upsert({
      where: { name: "Viêm da cơ địa" },
      update: {
        description: "Tình trạng viêm da lặp lại, thường do dị ứng.",
        symptoms: "Ngứa, đỏ da, rụng lông cục bộ.",
      },
      create: {
        name: "Viêm da cơ địa",
        description: "Tình trạng viêm da lặp lại, thường do dị ứng.",
        symptoms: "Ngứa, đỏ da, rụng lông cục bộ.",
      },
    }),
    prisma.disease.upsert({
      where: { name: "Rối loạn tiêu hóa" },
      update: {
        description: "Tiêu chảy, nôn hoặc chán ăn do thay đổi thức ăn.",
        symptoms: "Tiêu chảy, nôn, mệt mỏi.",
      },
      create: {
        name: "Rối loạn tiêu hóa",
        description: "Tiêu chảy, nôn hoặc chán ăn do thay đổi thức ăn.",
        symptoms: "Tiêu chảy, nôn, mệt mỏi.",
      },
    }),
    prisma.disease.upsert({
      where: { name: "Nhiễm ký sinh trùng ngoài da" },
      update: {
        description: "Ve, bọ chét hoặc ghẻ gây kích ứng da.",
        symptoms: "Ngứa nhiều, có vết chàm, rụng lông.",
      },
      create: {
        name: "Nhiễm ký sinh trùng ngoài da",
        description: "Ve, bọ chét hoặc ghẻ gây kích ứng da.",
        symptoms: "Ngứa nhiều, có vết chàm, rụng lông.",
      },
    }),
  ]);

  const cages = await Promise.all([
    prisma.cage.upsert({
      where: { cageNumber: "CAGE-01" },
      update: { status: "OCCUPIED", note: "Phòng nhỏ, phù hợp cho mèo và chó nhỏ." },
      create: { cageNumber: "CAGE-01", status: "OCCUPIED", note: "Phòng nhỏ, phù hợp cho mèo và chó nhỏ." },
    }),
    prisma.cage.upsert({
      where: { cageNumber: "CAGE-02" },
      update: { status: "AVAILABLE", note: "Phòng tiêu chuẩn." },
      create: { cageNumber: "CAGE-02", status: "AVAILABLE", note: "Phòng tiêu chuẩn." },
    }),
    prisma.cage.upsert({
      where: { cageNumber: "CAGE-03" },
      update: { status: "CLEANING", note: "Đang vệ sinh sau lưu trú." },
      create: { cageNumber: "CAGE-03", status: "CLEANING", note: "Đang vệ sinh sau lưu trú." },
    }),
    prisma.cage.upsert({
      where: { cageNumber: "CAGE-04" },
      update: { status: "AVAILABLE", note: "Phòng rộng cho thú cưng trung bình." },
      create: { cageNumber: "CAGE-04", status: "AVAILABLE", note: "Phòng rộng cho thú cưng trung bình." },
    }),
  ]);

  const schedules = [];
  const scheduleData = [
    { doctorId: doctors[0].id, workDate: date("2026-05-25"), startTime: time("09:00:00"), endTime: time("10:00:00"), roomName: "Phòng khám 01" },
    { doctorId: doctors[0].id, workDate: date("2026-05-25"), startTime: time("10:00:00"), endTime: time("11:00:00"), roomName: "Phòng khám 01" },
    { doctorId: doctors[1].id, workDate: date("2026-05-26"), startTime: time("14:00:00"), endTime: time("15:00:00"), roomName: "Phòng khám 02" },
    { doctorId: doctors[1].id, workDate: date("2026-05-27"), startTime: time("08:30:00"), endTime: time("09:30:00"), roomName: "Phòng khám 02" },
    { doctorId: doctors[2].id, workDate: date("2026-05-27"), startTime: time("09:30:00"), endTime: time("10:30:00"), roomName: "Phòng khám 03" },
  ];

  for (const item of scheduleData) {
    const existing = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId: item.doctorId,
        workDate: item.workDate,
        startTime: item.startTime,
      },
    });
    schedules.push(existing ? await prisma.doctorSchedule.update({ where: { id: existing.id }, data: item }) : await prisma.doctorSchedule.create({ data: item }));
  }

  const scheduleSlots = [];
  for (const schedule of schedules) {
    const firstSlot = await upsertDoctorScheduleSlot({
      doctorScheduleId: schedule.id,
      doctorId: schedule.doctorId,
      slotDate: schedule.workDate,
      startTime: schedule.startTime,
      endTime: addMinutesToTime(schedule.startTime, 30),
      status: "AVAILABLE",
    });
    await upsertDoctorScheduleSlot({
      doctorScheduleId: schedule.id,
      doctorId: schedule.doctorId,
      slotDate: schedule.workDate,
      startTime: addMinutesToTime(schedule.startTime, 30),
      endTime: schedule.endTime,
      status: "AVAILABLE",
    });
    scheduleSlots.push(firstSlot);
  }

  const appointments = await Promise.all([
    upsertAppointment({
      petId: pets[0].id,
      doctorId: doctors[0].id,
      staffId: staffs[0].id,
      doctorScheduleSlotId: scheduleSlots[0].id,
      appointmentType: "MEDICAL",
      status: "COMPLETED",
      note: `${seedTag} Milo khám tổng quát và kiểm tra da.`,
    }),
    upsertAppointment({
      petId: pets[1].id,
      staffId: staffs[0].id,
      appointmentType: "GROOMING",
      status: "COMPLETED",
      note: `${seedTag} Miu grooming cắt tỉa lông.`,
    }),
    upsertAppointment({
      petId: pets[2].id,
      staffId: staffs[1].id,
      appointmentType: "BOARDING",
      status: "IN_PROGRESS",
      note: `${seedTag} Bắp lưu trú 3 ngày.`,
    }),
    upsertAppointment({
      petId: pets[3].id,
      doctorId: doctors[1].id,
      staffId: staffs[1].id,
      doctorScheduleSlotId: scheduleSlots[2].id,
      appointmentType: "MIXED",
      status: "CONFIRMED",
      note: `${seedTag} Kem tiêm vaccine và grooming nhẹ.`,
    }),
    upsertAppointment({
      petId: pets[4].id,
      doctorId: doctors[2].id,
      doctorScheduleSlotId: scheduleSlots[4].id,
      appointmentType: "MEDICAL",
      status: "PENDING",
      note: `${seedTag} Bông khám tư vấn dinh dưỡng.`,
    }),
    upsertAppointment({
      petId: pets[2].id,
      staffId: staffs[2].id,
      appointmentType: "GROOMING",
      status: "CONFIRMED",
      note: `${seedTag} Bắp grooming vệ sinh lông và móng.`,
    }),
    upsertAppointment({
      petId: pets[3].id,
      staffId: staffs[2].id,
      appointmentType: "BOARDING",
      status: "CONFIRMED",
      note: `${seedTag} Kem đặt lịch lưu trú 2 ngày.`,
    }),
    upsertAppointment({
      petId: pets[4].id,
      staffId: staffs[0].id,
      appointmentType: "BOARDING",
      status: "COMPLETED",
      note: `${seedTag} Bông lưu trú ngắn ngày.`,
    }),
  ]);

  await Promise.all([
    [scheduleSlots[0], appointments[0]],
    [scheduleSlots[2], appointments[3]],
    [scheduleSlots[4], appointments[4]],
  ].map(([slot, appointment]) => prisma.doctorScheduleSlot.update({
    where: { id: slot.id },
    data: { status: appointmentSlotStatus(appointment.status) },
  })));

  const apptServices = await Promise.all([
    upsertAppointmentService({
      appointmentId: appointments[0].id,
      serviceId: services[0].id,
      quantity: 1,
      unitPrice: services[0].price,
      status: "COMPLETED",
    }),
    upsertAppointmentService({
      appointmentId: appointments[1].id,
      serviceId: services[2].id,
      quantity: 1,
      unitPrice: services[2].price,
      status: "COMPLETED",
    }),
    upsertAppointmentService({
      appointmentId: appointments[2].id,
      serviceId: services[3].id,
      quantity: 3,
      unitPrice: services[3].price,
      status: "IN_PROGRESS",
    }),
    upsertAppointmentService({
      appointmentId: appointments[3].id,
      serviceId: services[1].id,
      quantity: 1,
      unitPrice: services[1].price,
      status: "PENDING",
    }),
    upsertAppointmentService({
      appointmentId: appointments[3].id,
      serviceId: services[2].id,
      quantity: 1,
      unitPrice: services[2].price,
      status: "PENDING",
    }),
    upsertAppointmentService({
      appointmentId: appointments[5].id,
      serviceId: services[2].id,
      quantity: 1,
      unitPrice: services[2].price,
      status: "PENDING",
    }),
    upsertAppointmentService({
      appointmentId: appointments[6].id,
      serviceId: services[3].id,
      quantity: 2,
      unitPrice: services[3].price,
      status: "PENDING",
    }),
    upsertAppointmentService({
      appointmentId: appointments[7].id,
      serviceId: services[3].id,
      quantity: 1,
      unitPrice: services[3].price,
      status: "COMPLETED",
    }),
  ]);

  const medicalVisit = await prisma.medicalVisit.upsert({
    where: { appointmentId: appointments[0].id },
    update: {
      symptoms: "Ngứa nhiều, đỏ da vùng bụng.",
      clinicalExam: "Da hơi đỏ, không sốt, niêm mạc hồng.",
      diagnosisNote: "Theo dõi viêm da cơ địa mức độ nhẹ.",
      nextVisitDate: date("2026-06-08"),
    },
    create: {
      appointmentId: appointments[0].id,
      symptoms: "Ngứa nhiều, đỏ da vùng bụng.",
      clinicalExam: "Da hơi đỏ, không sốt, niêm mạc hồng.",
      diagnosisNote: "Theo dõi viêm da cơ địa mức độ nhẹ.",
      nextVisitDate: date("2026-06-08"),
    },
  });

  await prisma.medicalVisitDisease.upsert({
    where: {
      medicalVisitId_diseaseId: {
        medicalVisitId: medicalVisit.id,
        diseaseId: diseases[0].id,
      },
    },
    update: { note: "Mức độ nhẹ, ưu tiên chăm sóc da và theo dõi." },
    create: {
      medicalVisitId: medicalVisit.id,
      diseaseId: diseases[0].id,
      note: "Mức độ nhẹ, ưu tiên chăm sóc da và theo dõi.",
    },
  });

  const medicalVisit2 = await prisma.medicalVisit.upsert({
    where: { appointmentId: appointments[3].id },
    update: {
      symptoms: "Đến tiêm vaccine, có hơi rụng lông nhẹ.",
      clinicalExam: "Thể trạng tốt, thân nhiệt bình thường.",
      diagnosisNote: "Đủ điều kiện tiêm vaccine, theo dõi da lông.",
      nextVisitDate: date("2026-06-26"),
    },
    create: {
      appointmentId: appointments[3].id,
      symptoms: "Đến tiêm vaccine, có hơi rụng lông nhẹ.",
      clinicalExam: "Thể trạng tốt, thân nhiệt bình thường.",
      diagnosisNote: "Đủ điều kiện tiêm vaccine, theo dõi da lông.",
      nextVisitDate: date("2026-06-26"),
    },
  });

  await prisma.medicalVisitDisease.upsert({
    where: {
      medicalVisitId_diseaseId: {
        medicalVisitId: medicalVisit2.id,
        diseaseId: diseases[2].id,
      },
    },
    update: { note: "Kiểm tra ký sinh trùng ngoài da, chưa thấy dấu hiệu nặng." },
    create: {
      medicalVisitId: medicalVisit2.id,
      diseaseId: diseases[2].id,
      note: "Kiểm tra ký sinh trùng ngoài da, chưa thấy dấu hiệu nặng.",
    },
  });

  const medicalVisit3 = await prisma.medicalVisit.upsert({
    where: { appointmentId: appointments[4].id },
    update: {
      symptoms: "Chủ nuôi cần tư vấn dinh dưỡng và theo dõi tiêu hóa.",
      clinicalExam: "Bụng mềm, ăn uống bình thường.",
      diagnosisNote: "Tư vấn chế độ ăn nhiều cỏ khô, theo dõi phân.",
      nextVisitDate: date("2026-06-10"),
    },
    create: {
      appointmentId: appointments[4].id,
      symptoms: "Chủ nuôi cần tư vấn dinh dưỡng và theo dõi tiêu hóa.",
      clinicalExam: "Bụng mềm, ăn uống bình thường.",
      diagnosisNote: "Tư vấn chế độ ăn nhiều cỏ khô, theo dõi phân.",
      nextVisitDate: date("2026-06-10"),
    },
  });

  await prisma.medicalVisitDisease.upsert({
    where: {
      medicalVisitId_diseaseId: {
        medicalVisitId: medicalVisit3.id,
        diseaseId: diseases[1].id,
      },
    },
    update: { note: "Cần theo dõi tiêu hóa khi đổi thức ăn." },
    create: {
      medicalVisitId: medicalVisit3.id,
      diseaseId: diseases[1].id,
      note: "Cần theo dõi tiêu hóa khi đổi thức ăn.",
    },
  });

  const prescription =
    (await prisma.prescription.findFirst({ where: { medicalVisitId: medicalVisit.id } })) ||
    (await prisma.prescription.create({
      data: {
        medicalVisitId: medicalVisit.id,
        notes: "Dùng thuốc sau ăn, tái khám nếu còn ngứa nhiều.",
      },
    }));

  await prisma.prescription.update({
    where: { id: prescription.id },
    data: {
      notes: "Dùng thuốc sau ăn, tái khám nếu còn ngứa nhiều.",
    },
  });
  await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: prescription.id } });
  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescription.id,
        medicineName: "Cetirizine thú cưng",
        dosage: "1/2 viên",
        frequency: "1 lần/ngày",
        durationDays: 5,
        instructions: "Uống sau bữa ăn tối.",
      },
      {
        prescriptionId: prescription.id,
        medicineName: "Dung dịch vệ sinh da",
        dosage: "Xịt vùng da viêm",
        frequency: "2 lần/ngày",
        durationDays: 7,
        instructions: "Không để thú cưng liếm trong 10 phút đầu.",
      },
    ],
  });

  const prescription2 =
    (await prisma.prescription.findFirst({ where: { medicalVisitId: medicalVisit2.id } })) ||
    (await prisma.prescription.create({
      data: {
        medicalVisitId: medicalVisit2.id,
        notes: "Theo dõi sau tiêm, tránh tắm trong 24 giờ.",
      },
    }));

  await prisma.prescription.update({
    where: { id: prescription2.id },
    data: {
      notes: "Theo dõi sau tiêm, tránh tắm trong 24 giờ.",
    },
  });
  await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: prescription2.id } });
  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescription2.id,
        medicineName: "Men tiêu hóa thú cưng",
        dosage: "1 gói",
        frequency: "1 lần/ngày",
        durationDays: 3,
        instructions: "Pha với thức ăn mềm nếu ăn kém.",
      },
      {
        prescriptionId: prescription2.id,
        medicineName: "Dung dịch nhỏ mắt",
        dosage: "1 giọt/mắt",
        frequency: "2 lần/ngày",
        durationDays: 5,
        instructions: "Dùng khi mắt có ghèn nhẹ.",
      },
    ],
  });

  const prescription3 =
    (await prisma.prescription.findFirst({ where: { medicalVisitId: medicalVisit3.id } })) ||
    (await prisma.prescription.create({
      data: {
        medicalVisitId: medicalVisit3.id,
        notes: "Chủ yếu điều chỉnh khẩu phần, không cần thuốc mạnh.",
      },
    }));

  await prisma.prescription.update({
    where: { id: prescription3.id },
    data: {
      notes: "Chủ yếu điều chỉnh khẩu phần, không cần thuốc mạnh.",
    },
  });
  await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: prescription3.id } });
  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescription3.id,
        medicineName: "Vitamin tổng hợp cho thỏ",
        dosage: "0.5ml",
        frequency: "1 lần/ngày",
        durationDays: 7,
        instructions: "Nhỏ vào nước uống hoặc thức ăn.",
      },
    ],
  });

  const vaccination = await prisma.vaccination.upsert({
    where: { id: (await prisma.vaccination.findFirst({ where: { appointmentId: appointments[3].id, petId: pets[3].id } }))?.id || 0 },
    update: {
      vaccineName: "Vaccine 5 bệnh",
      dateGiven: date("2026-05-26"),
      nextDueDate: date("2027-05-26"),
      note: "Theo dõi phản ứng sau tiêm trong 24 giờ.",
    },
    create: {
      appointmentId: appointments[3].id,
      petId: pets[3].id,
      vaccineName: "Vaccine 5 bệnh",
      dateGiven: date("2026-05-26"),
      nextDueDate: date("2027-05-26"),
      note: "Theo dõi phản ứng sau tiêm trong 24 giờ.",
    },
  });

  const vaccination2 = await prisma.vaccination.upsert({
    where: { id: (await prisma.vaccination.findFirst({ where: { petId: pets[0].id, vaccineName: "Vaccine dại" } }))?.id || 0 },
    update: {
      appointmentId: appointments[0].id,
      vaccineName: "Vaccine dại",
      dateGiven: date("2026-05-24"),
      nextDueDate: date("2027-05-24"),
      note: "Đã tiêm sau khi khám tổng quát.",
    },
    create: {
      appointmentId: appointments[0].id,
      petId: pets[0].id,
      vaccineName: "Vaccine dại",
      dateGiven: date("2026-05-24"),
      nextDueDate: date("2027-05-24"),
      note: "Đã tiêm sau khi khám tổng quát.",
    },
  });

  const vaccination3 = await prisma.vaccination.upsert({
    where: { id: (await prisma.vaccination.findFirst({ where: { petId: pets[2].id, vaccineName: "Vaccine ho cũi chó" } }))?.id || 0 },
    update: {
      appointmentId: null,
      vaccineName: "Vaccine ho cũi chó",
      dateGiven: date("2026-04-20"),
      nextDueDate: date("2027-04-20"),
      note: "Lịch sử tiêm từ lần chăm sóc trước.",
    },
    create: {
      petId: pets[2].id,
      vaccineName: "Vaccine ho cũi chó",
      dateGiven: date("2026-04-20"),
      nextDueDate: date("2027-04-20"),
      note: "Lịch sử tiêm từ lần chăm sóc trước.",
    },
  });

  const groomingRecord =
    (await prisma.groomingRecord.findFirst({ where: { appointmentId: appointments[1].id } })) ||
    (await prisma.groomingRecord.create({
      data: {
        appointmentId: appointments[1].id,
        appointmentServiceId: apptServices[1].id,
        staffId: staffs[0].id,
      },
    }));

  await prisma.groomingRecord.update({
    where: { id: groomingRecord.id },
    data: {
      appointmentServiceId: apptServices[1].id,
      staffId: staffs[0].id,
      status: "COMPLETED",
      startedAt: new Date("2026-05-24T02:00:00.000Z"),
      completedAt: new Date("2026-05-24T03:20:00.000Z"),
      beforeImageUrl: "https://example.com/pets/miu-before.jpg",
      afterImageUrl: "https://example.com/pets/miu-after.jpg",
      notes: "Cắt tỉa gọn lông bụng, vệ sinh tai và móng.",
    },
  });

  const groomingRecord2 =
    (await prisma.groomingRecord.findFirst({ where: { appointmentId: appointments[3].id } })) ||
    (await prisma.groomingRecord.create({
      data: {
        appointmentId: appointments[3].id,
        appointmentServiceId: apptServices[4].id,
        staffId: staffs[1].id,
      },
    }));

  await prisma.groomingRecord.update({
    where: { id: groomingRecord2.id },
    data: {
      appointmentServiceId: apptServices[4].id,
      staffId: staffs[1].id,
      status: "PENDING",
      startedAt: null,
      completedAt: null,
      beforeImageUrl: "https://example.com/pets/kem-before.jpg",
      afterImageUrl: null,
      notes: "Grooming nhẹ sau tiêm nếu sức khỏe ổn định.",
    },
  });

  const groomingRecord3 =
    (await prisma.groomingRecord.findFirst({ where: { appointmentId: appointments[5].id } })) ||
    (await prisma.groomingRecord.create({
      data: {
        appointmentId: appointments[5].id,
        appointmentServiceId: apptServices[5].id,
        staffId: staffs[2].id,
      },
    }));

  await prisma.groomingRecord.update({
    where: { id: groomingRecord3.id },
    data: {
      appointmentServiceId: apptServices[5].id,
      staffId: staffs[2].id,
      status: "IN_PROGRESS",
      startedAt: new Date("2026-05-25T02:15:00.000Z"),
      completedAt: null,
      beforeImageUrl: "https://example.com/pets/bap-before.jpg",
      afterImageUrl: null,
      notes: "Đang vệ sinh lông và cắt móng.",
    },
  });

  const boarding =
    (await prisma.boarding.findFirst({ where: { appointmentId: appointments[2].id } })) ||
    (await prisma.boarding.create({
      data: {
        appointmentId: appointments[2].id,
        cageId: cages[0].id,
      },
    }));

  await prisma.boarding.update({
    where: { id: boarding.id },
    data: {
      cageId: cages[0].id,
      checkIn: new Date("2026-05-24T01:30:00.000Z"),
      checkOut: new Date("2026-05-27T03:00:00.000Z"),
      feedingInstruction: "Ăn hạt 2 bữa/ngày, mỗi bữa 80g.",
      habitNote: "Thích đi dạo buổi chiều.",
      specialNote: "Kiểm soát khẩu phần vì dễ tăng cân.",
      pickupReminderAt: new Date("2026-05-27T02:00:00.000Z"),
      currentStatus: "STAYING",
    },
  });

  const boarding2 =
    (await prisma.boarding.findFirst({ where: { appointmentId: appointments[6].id } })) ||
    (await prisma.boarding.create({
      data: {
        appointmentId: appointments[6].id,
        cageId: cages[3].id,
      },
    }));

  await prisma.boarding.update({
    where: { id: boarding2.id },
    data: {
      cageId: cages[3].id,
      checkIn: new Date("2026-05-28T02:00:00.000Z"),
      checkOut: new Date("2026-05-30T02:00:00.000Z"),
      feedingInstruction: "Ăn pate và hạt mềm 2 bữa/ngày.",
      habitNote: "Hơi nhát khi ở môi trường mới.",
      specialNote: "Theo dõi mắt và lông dài.",
      pickupReminderAt: new Date("2026-05-30T01:00:00.000Z"),
      currentStatus: "BOOKED",
    },
  });

  const boarding3 =
    (await prisma.boarding.findFirst({ where: { appointmentId: appointments[7].id } })) ||
    (await prisma.boarding.create({
      data: {
        appointmentId: appointments[7].id,
        cageId: cages[1].id,
      },
    }));

  await prisma.boarding.update({
    where: { id: boarding3.id },
    data: {
      cageId: cages[1].id,
      checkIn: new Date("2026-05-20T01:00:00.000Z"),
      checkOut: new Date("2026-05-21T01:00:00.000Z"),
      feedingInstruction: "Cỏ khô luôn có sẵn, bổ sung rau sạch buổi chiều.",
      habitNote: "Thích không gian yên tĩnh.",
      specialNote: "Không bế ẵm quá lâu.",
      pickupReminderAt: new Date("2026-05-21T00:30:00.000Z"),
      currentStatus: "CHECKED_OUT",
    },
  });

  await prisma.boardingDailyUpdate.deleteMany({
    where: { boardingId: { in: [boarding.id, boarding2.id, boarding3.id] } },
  });
  await prisma.boardingDailyUpdate.createMany({
    data: [
      {
        boardingId: boarding.id,
        staffId: staffs[1].id,
        date: date("2026-05-24"),
        eatingStatus: "Ăn hết khẩu phần",
        healthStatus: "Ổn định",
        activityStatus: "Đi dạo 20 phút",
        note: "Thân thiện, hợp tác tốt.",
        imgUrl: "https://example.com/boarding/bap-day-1.jpg",
      },
      {
        boardingId: boarding.id,
        staffId: staffs[1].id,
        date: date("2026-05-25"),
        eatingStatus: "Ăn gần hết",
        healthStatus: "Ổn định",
        activityStatus: "Chơi bóng nhẹ",
        note: "Cần theo dõi cân nặng.",
        imgUrl: "https://example.com/boarding/bap-day-2.jpg",
      },
      {
        boardingId: boarding2.id,
        staffId: staffs[2].id,
        date: date("2026-05-28"),
        eatingStatus: "Mới ăn nửa khẩu phần",
        healthStatus: "Ổn định",
        activityStatus: "Nằm nghỉ nhiều",
        note: "Kem đang làm quen chuồng mới.",
        imgUrl: "https://example.com/boarding/kem-day-1.jpg",
      },
      {
        boardingId: boarding3.id,
        staffId: staffs[0].id,
        date: date("2026-05-20"),
        eatingStatus: "Ăn cỏ khô tốt",
        healthStatus: "Ổn định",
        activityStatus: "Vận động nhẹ",
        note: "Bông hợp tác, không có dấu hiệu stress.",
        imgUrl: "https://example.com/boarding/bong-day-1.jpg",
      },
    ],
  });

  await upsertInvoice(
    appointments[0].id,
    {
      subtotalAmount: money("600000"),
      discountAmount: money("0"),
      taxAmount: money("0"),
      totalAmount: money("600000"),
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      transactionCode: "CASH-SEED-001",
      paidAt: new Date("2026-05-24T04:00:00.000Z"),
      status: "PAID",
    },
    [
      {
        serviceId: services[0].id,
        appointmentServiceId: apptServices[0].id,
        medicalVisitId: medicalVisit.id,
        sourceType: "MEDICAL_VISIT",
        description: "Phí khám tổng quát",
        quantity: 1,
        unitPrice: money("250000"),
        totalPrice: money("250000"),
      },
      {
        serviceId: services[1].id,
        vaccinationId: vaccination2.id,
        sourceType: "VACCINATION",
        description: "Tiêm vaccine dại",
        quantity: 1,
        unitPrice: money("350000"),
        totalPrice: money("350000"),
      },
    ],
  );

  await upsertInvoice(
    appointments[1].id,
    {
      subtotalAmount: money("300000"),
      discountAmount: money("0"),
      taxAmount: money("0"),
      totalAmount: money("300000"),
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PAID",
      transactionCode: "BANK-SEED-002",
      paidAt: new Date("2026-05-24T05:00:00.000Z"),
      status: "PAID",
    },
    [
      {
        serviceId: services[2].id,
        appointmentServiceId: apptServices[1].id,
        groomingRecordId: groomingRecord.id,
        sourceType: "GROOMING",
        description: "Tắm và cắt tỉa lông",
        quantity: 1,
        unitPrice: money("300000"),
        totalPrice: money("300000"),
      },
    ],
  );

  await upsertInvoice(
    appointments[2].id,
    {
      subtotalAmount: money("585000"),
      discountAmount: money("0"),
      taxAmount: money("0"),
      totalAmount: money("585000"),
      paymentMethod: null,
      paymentStatus: "UNPAID",
      transactionCode: null,
      paidAt: null,
      status: "PENDING",
    },
    [
      {
        serviceId: services[3].id,
        appointmentServiceId: apptServices[2].id,
        boardingId: boarding.id,
        sourceType: "BOARDING",
        description: "Lưu trú pet hotel 3 ngày",
        quantity: 3,
        unitPrice: money("180000"),
        totalPrice: money("540000"),
      },
      {
        serviceId: services[4].id,
        sourceType: "SERVICE",
        description: "Pate bổ sung",
        quantity: 1,
        unitPrice: money("45000"),
        totalPrice: money("45000"),
      },
    ],
  );

  await upsertInvoice(
    appointments[3].id,
    {
      subtotalAmount: money("650000"),
      discountAmount: money("50000"),
      taxAmount: money("0"),
      totalAmount: money("600000"),
      paymentMethod: null,
      paymentStatus: "UNPAID",
      transactionCode: null,
      paidAt: null,
      status: "PENDING",
    },
    [
      {
        serviceId: services[1].id,
        appointmentServiceId: apptServices[3].id,
        vaccinationId: vaccination.id,
        sourceType: "VACCINATION",
        description: "Tiêm vaccine 5 bệnh",
        quantity: 1,
        unitPrice: money("350000"),
        totalPrice: money("350000"),
      },
      {
        serviceId: services[2].id,
        appointmentServiceId: apptServices[4].id,
        groomingRecordId: groomingRecord2.id,
        sourceType: "SERVICE",
        description: "Grooming nhẹ",
        quantity: 1,
        unitPrice: money("300000"),
        totalPrice: money("300000"),
      },
    ],
  );

  await upsertInvoice(
    appointments[4].id,
    {
      subtotalAmount: money("250000"),
      discountAmount: money("0"),
      taxAmount: money("0"),
      totalAmount: money("250000"),
      paymentMethod: null,
      paymentStatus: "UNPAID",
      transactionCode: null,
      paidAt: null,
      status: "DRAFT",
    },
    [
      {
        serviceId: services[0].id,
        medicalVisitId: medicalVisit3.id,
        sourceType: "MEDICAL_VISIT",
        description: "Tư vấn dinh dưỡng thú cưng",
        quantity: 1,
        unitPrice: money("250000"),
        totalPrice: money("250000"),
      },
    ],
  );

  await upsertInvoice(
    appointments[5].id,
    {
      subtotalAmount: money("300000"),
      discountAmount: money("0"),
      taxAmount: money("0"),
      totalAmount: money("300000"),
      paymentMethod: null,
      paymentStatus: "UNPAID",
      transactionCode: null,
      paidAt: null,
      status: "PENDING",
    },
    [
      {
        serviceId: services[2].id,
        appointmentServiceId: apptServices[5].id,
        groomingRecordId: groomingRecord3.id,
        sourceType: "GROOMING",
        description: "Grooming vệ sinh lông và móng",
        quantity: 1,
        unitPrice: money("300000"),
        totalPrice: money("300000"),
      },
    ],
  );

  await upsertInvoice(
    appointments[6].id,
    {
      subtotalAmount: money("360000"),
      discountAmount: money("0"),
      taxAmount: money("0"),
      totalAmount: money("360000"),
      paymentMethod: null,
      paymentStatus: "UNPAID",
      transactionCode: null,
      paidAt: null,
      status: "PENDING",
    },
    [
      {
        serviceId: services[3].id,
        appointmentServiceId: apptServices[6].id,
        boardingId: boarding2.id,
        sourceType: "BOARDING",
        description: "Lưu trú pet hotel 2 ngày",
        quantity: 2,
        unitPrice: money("180000"),
        totalPrice: money("360000"),
      },
    ],
  );

  await upsertInvoice(
    appointments[7].id,
    {
      subtotalAmount: money("180000"),
      discountAmount: money("0"),
      taxAmount: money("0"),
      totalAmount: money("180000"),
      paymentMethod: "VNPAY",
      paymentStatus: "PAID",
      transactionCode: "VNPAY-SEED-003",
      paidAt: new Date("2026-05-21T02:00:00.000Z"),
      status: "PAID",
    },
    [
      {
        serviceId: services[3].id,
        appointmentServiceId: apptServices[7].id,
        boardingId: boarding3.id,
        sourceType: "BOARDING",
        description: "Lưu trú ngắn ngày",
        quantity: 1,
        unitPrice: money("180000"),
        totalPrice: money("180000"),
      },
    ],
  );

  await prisma.notification.deleteMany({
    where: {
      title: { startsWith: "[Seed]" },
    },
  });
  await prisma.notification.createMany({
    data: [
      {
        userId: customerUsers[0].id,
        title: "[Seed] Lịch khám đã hoàn tất",
        content: "Milo đã hoàn tất lịch khám tổng quát. Đơn thuốc đã được cập nhật.",
        type: "APPOINTMENT",
        isRead: false,
      },
      {
        userId: customerUsers[1].id,
        title: "[Seed] Cập nhật lưu trú",
        content: "Bắp đang lưu trú ổn định tại CAGE-01.",
        type: "BOARDING",
        isRead: false,
      },
      {
        userId: customerUsers[2].id,
        title: "[Seed] Nhắc vaccine",
        content: "Kem có lịch tiêm vaccine vào ngày 26/05/2026.",
        type: "VACCINE",
        isRead: true,
      },
    ],
  });

  await prisma.review.deleteMany({
    where: {
      feedback: { startsWith: "[Seed]" },
    },
  });
  await prisma.review.createMany({
    data: [
      {
        customerId: customers[0].id,
        appointmentId: appointments[0].id,
        targetType: "DOCTOR",
        targetId: doctors[0].id,
        rating: 5,
        feedback: "[Seed] Bác sĩ tư vấn kỹ, giải thích dễ hiểu.",
        replyContent: "Cảm ơn anh Minh đã tin tưởng trung tâm.",
        repliedByUserId: adminUser.id,
        repliedAt: new Date("2026-05-24T06:00:00.000Z"),
      },
      {
        customerId: customers[0].id,
        appointmentId: appointments[1].id,
        targetType: "GROOMING",
        targetId: groomingRecord.id,
        rating: 5,
        feedback: "[Seed] Grooming gọn gàng, Miu thơm và sạch.",
      },
      {
        customerId: customers[1].id,
        appointmentId: appointments[2].id,
        targetType: "BOARDING",
        targetId: boarding.id,
        rating: 4,
        feedback: "[Seed] Cập nhật hằng ngày rõ ràng, có ảnh kèm theo.",
      },
    ],
  });

  console.log("Seed completed:");
  const tableCounts = [
    ["users", prisma.user],
    ["customers", prisma.customer],
    ["staffs", prisma.staff],
    ["doctors", prisma.doctor],
    ["doctor_schedules", prisma.doctorSchedule],
    ["doctor_schedule_slots", prisma.doctorScheduleSlot],
    ["animal_species", prisma.animalSpecies],
    ["breeds", prisma.breed],
    ["pets", prisma.pet],
    ["appointments", prisma.appointment],
    ["services", prisma.service],
    ["appointment_services", prisma.appointmentService],
    ["diseases", prisma.disease],
    ["medical_visits", prisma.medicalVisit],
    ["medical_visit_diseases", prisma.medicalVisitDisease],
    ["prescriptions", prisma.prescription],
    ["prescription_items", prisma.prescriptionItem],
    ["vaccinations", prisma.vaccination],
    ["grooming_records", prisma.groomingRecord],
    ["cages", prisma.cage],
    ["boarding", prisma.boarding],
    ["boarding_daily_updates", prisma.boardingDailyUpdate],
    ["invoices", prisma.invoice],
    ["invoice_items", prisma.invoiceItem],
    ["notifications", prisma.notification],
    ["reviews", prisma.review],
  ];

  for (const [tableName, model] of tableCounts) {
    console.log(`- ${tableName}: ${await model.count()}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

