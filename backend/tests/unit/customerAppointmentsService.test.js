const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const {
  appointmentActors,
  appointmentCustomerId,
  appointmentPet,
  completedAppointment,
  groomingService,
  medicalService,
  pendingAppointment,
} = require("../mocks/customerAppointments.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../src/services/emailService", () => ({
  sendAppointmentEventEmail: jest.fn(),
}));

jest.mock("../../src/services/doctorScheduleService", () => ({
  ensureDoctorScheduleSlot: jest.fn(),
  reserveDoctorScheduleSlot: jest.fn(),
  setDoctorScheduleSlotStatus: jest.fn(),
}));

const { supabase } = require("../../src/lib/supabaseClient");
const {
  ensureDoctorScheduleSlot,
  reserveDoctorScheduleSlot,
  setDoctorScheduleSlotStatus,
} = require("../../src/services/doctorScheduleService");
const { sendAppointmentEventEmail } = require("../../src/services/emailService");
const {
  createCustomerAppointment,
  listCustomerAppointmentOptions,
  listCustomerAppointmentProviders,
  listCustomerAppointmentsView,
  cancelCustomerAppointment,
  confirmCustomerAppointment,
  rescheduleCustomerAppointment,
} = require("../../src/services/customer/customerAppointmentsService");

describe("customerAppointmentsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.from.mockReset();
    ensureDoctorScheduleSlot.mockReset();
    reserveDoctorScheduleSlot.mockReset();
    setDoctorScheduleSlotStatus.mockReset();
    sendAppointmentEventEmail.mockReset();
  });

  test("lists only customer-bookable appointment services", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(
      createSupabaseQuery({
        data: [
          medicalService,
          groomingService,
          { id: 503, name: "Pet food", type: "FOOD" },
        ],
        error: null,
      }),
    );

    // Act
    const options = await listCustomerAppointmentOptions(appointmentCustomerId);

    // Assert
    expect(options.services).toHaveLength(2);
    expect(options.services.map((service) => service.id)).toEqual([medicalService.id, groomingService.id]);
    expect(options.services[0]).toEqual(
      expect.objectContaining({
        serviceType: "Khám bệnh",
        iconKey: "medical",
      }),
    );
  });

  test("returns an empty appointment view when the customer has no pets", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }));

    // Act
    const result = await listCustomerAppointmentsView(appointmentCustomerId, { pageSize: 5 });

    // Assert
    expect(result.appointments).toEqual([]);
    expect(result.summary).toEqual(
      expect.objectContaining({
        total: 0,
        filtered: 0,
      }),
    );
    expect(result.pagination).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 5,
        total: 0,
        from: 0,
        to: 0,
      }),
    );
  });

  test("rejects provider lookup when customer id is missing", async () => {
    // Arrange
    const input = { serviceId: medicalService.id, date: "2099-07-20", time: "09:00" };

    // Act
    const action = () => listCustomerAppointmentProviders(input, undefined);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 401 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("rejects appointment creation when pet id is missing", async () => {
    // Arrange
    const input = { serviceId: medicalService.id, date: "2099-07-20", time: "09:00" };

    // Act
    const action = () => createCustomerAppointment(input, appointmentCustomerId);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("rejects appointment creation when selected pet is not owned by the customer", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }));

    // Act
    const action = () =>
      createCustomerAppointment(
        {
          petId: appointmentPet.id,
          serviceId: medicalService.id,
          date: "2099-07-20",
          time: "09:00",
          providerRole: "doctor",
          providerId: 300,
        },
        appointmentCustomerId,
      );

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 404 });
  });


  test("rejects confirming appointments that are not pending", async () => {
    // Arrange
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: completedAppointment, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentPet, error: null }));

    // Act
    const action = () => confirmCustomerAppointment(`APT-${completedAppointment.id}`, appointmentCustomerId);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 409 });
  });

  test("confirms a pending appointment and creates a doctor notification", async () => {
    // Arrange
    const updateQuery = createSupabaseQuery({ data: null, error: null });
    const notificationQuery = createSupabaseQuery({ data: null, error: null });

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: pendingAppointment, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentPet, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentActors, error: null }))
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(notificationQuery)
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }));

    // Act
    const result = await confirmCustomerAppointment(`APT-${pendingAppointment.id}`, appointmentCustomerId);

    // Assert
    expect(result).toBeNull();
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "CONFIRMED",
        note: expect.stringContaining("xác nhận"),
      }),
    );
    expect(notificationQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: appointmentActors.doctors.user_id,
        type: "APPOINTMENT",
        is_read: false,
      }),
    );
  });

  test("rejects cancelling completed appointments", async () => {
    // Arrange
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: completedAppointment, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentPet, error: null }));

    // Act
    const action = () => cancelCustomerAppointment(`APT-${completedAppointment.id}`, { reason: "Busy" }, appointmentCustomerId);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 409 });
  });

  test("rejects rescheduling appointments in an invalid status", async () => {
    // Arrange
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: completedAppointment, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentPet, error: null }));

    // Act
    const action = () =>
      rescheduleCustomerAppointment(
        `APT-${completedAppointment.id}`,
        { date: "2099-07-21", time: "10:00", reason: "Change time" },
        appointmentCustomerId,
      );

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 409 });
  });

  test("lists available doctor provider options for a medical service slot", async () => {
    // Arrange
    const schedule = {
      id: 400,
      doctor_id: 300,
      start_time: "09:00:00",
      end_time: "09:30:00",
      schedule: { room_name: "Room 2" },
      doctor: {
        id: 300,
        full_name: "Dr. Nguyen",
        specialization: "Noi khoa",
        degree: "DVM",
        experience_years: 5,
        room_name: "Room 2",
      },
    };
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: medicalService, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [schedule], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [schedule.doctor], error: null }));

    // Act
    const providers = await listCustomerAppointmentProviders({
      serviceId: medicalService.id,
      date: "2099-07-20",
      time: "09:00",
    }, appointmentCustomerId);

    // Assert
    expect(providers).toEqual([
      expect.objectContaining({
        role: "doctor",
        id: 300,
        name: "Dr. Nguyen",
        room: "Room 2",
        scheduleId: 400,
        serviceType: "Khám bệnh",
        status: "PENDING",
      }),
    ]);
  });

  test("creates a medical appointment, reserves doctor slot and links service", async () => {
    // Arrange
    const appointmentInsert = createSupabaseQuery({ data: { id: pendingAppointment.id }, error: null });
    const serviceInsert = createSupabaseQuery({ data: null, error: null });
    ensureDoctorScheduleSlot.mockResolvedValue({
      id: pendingAppointment.doctor_schedule_slot_id,
      doctor_id: pendingAppointment.doctor_id,
      doctor: { full_name: "Dr. Nguyen" },
      schedule: { room_name: "Room 2" },
    });
    reserveDoctorScheduleSlot.mockResolvedValue({ id: pendingAppointment.doctor_schedule_slot_id });

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentPet, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: medicalService, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ requested_date: "2099-01-01", requested_time: "09:00:00" }], error: null }))
      .mockReturnValueOnce(appointmentInsert)
      .mockReturnValueOnce(serviceInsert)
      .mockReturnValueOnce(createSupabaseQuery({ data: [appointmentPet], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [pendingAppointment], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [appointmentPet], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ id: 300, full_name: "Dr. Nguyen" }], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: [{
          id: pendingAppointment.doctor_schedule_slot_id,
          slot_date: "2099-07-20",
          start_time: "09:00:00",
          schedule: { room_name: "Room 2" },
        }],
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: [{
          id: 700,
          appointment_id: pendingAppointment.id,
          quantity: 1,
          unit_price: medicalService.price,
          service: medicalService,
        }],
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }));

    // Act
    const appointment = await createCustomerAppointment({
      petId: appointmentPet.id,
      serviceId: medicalService.id,
      date: "2099-07-20",
      time: "09:00",
      providerRole: "doctor",
      providerId: 300,
      note: "Need exam",
    }, appointmentCustomerId);

    // Assert
    expect(reserveDoctorScheduleSlot).toHaveBeenCalledWith(pendingAppointment.doctor_schedule_slot_id);
    expect(appointmentInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        pet_id: appointmentPet.id,
        doctor_id: 300,
        doctor_schedule_slot_id: pendingAppointment.doctor_schedule_slot_id,
        appointment_type: "MEDICAL",
        status: "PENDING",
        requested_date: "2099-07-20",
        requested_time: "09:00:00",
      }),
    );
    expect(serviceInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: pendingAppointment.id,
        service_id: medicalService.id,
        quantity: 1,
        unit_price: medicalService.price,
        status: "PENDING",
      }),
    );
    expect(sendAppointmentEventEmail).toHaveBeenCalledWith("appointment_confirmation", pendingAppointment.id);
    expect(appointment).toEqual(
      expect.objectContaining({
        appointmentId: pendingAppointment.id,
        pet: appointmentPet.name,
        doctor: "Dr. Nguyen",
        serviceFee: medicalService.price,
      }),
    );
  });

  test("rolls back appointment and doctor slot when service link creation fails", async () => {
    // Arrange
    const appointmentDelete = createSupabaseQuery({ data: null, error: null });
    ensureDoctorScheduleSlot.mockResolvedValue({
      id: pendingAppointment.doctor_schedule_slot_id,
      doctor_id: pendingAppointment.doctor_id,
    });
    reserveDoctorScheduleSlot.mockResolvedValue({ id: pendingAppointment.doctor_schedule_slot_id });

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentPet, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: medicalService, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: { id: pendingAppointment.id }, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: null, error: { message: "service insert failed" } }))
      .mockReturnValueOnce(appointmentDelete);

    // Act
    const action = () => createCustomerAppointment({
      petId: appointmentPet.id,
      serviceId: medicalService.id,
      date: "2099-07-20",
      time: "09:00",
      providerRole: "doctor",
      providerId: 300,
    }, appointmentCustomerId);

    // Assert
    await expect(action()).rejects.toThrow("service insert failed");
    expect(appointmentDelete.delete).toHaveBeenCalled();
    expect(appointmentDelete.eq).toHaveBeenCalledWith("id", pendingAppointment.id);
    expect(setDoctorScheduleSlotStatus).toHaveBeenCalledWith(pendingAppointment.doctor_schedule_slot_id, "AVAILABLE");
    expect(sendAppointmentEventEmail).not.toHaveBeenCalled();
  });

  test("rejects appointment creation when the selected doctor slot was just reserved by another request", async () => {
    // Arrange
    ensureDoctorScheduleSlot.mockResolvedValue({
      id: pendingAppointment.doctor_schedule_slot_id,
      doctor_id: pendingAppointment.doctor_id,
    });
    reserveDoctorScheduleSlot.mockResolvedValue(null);

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentPet, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: medicalService, error: null }));

    // Act
    const action = () => createCustomerAppointment({
      petId: appointmentPet.id,
      serviceId: medicalService.id,
      date: "2099-07-20",
      time: "09:00",
      providerRole: "doctor",
      providerId: 300,
    }, appointmentCustomerId);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 409 });
    expect(reserveDoctorScheduleSlot).toHaveBeenCalledWith(pendingAppointment.doctor_schedule_slot_id);
    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(sendAppointmentEventEmail).not.toHaveBeenCalled();
  });

  test("reschedules a pending medical appointment, reserves the new slot and releases the old slot", async () => {
    // Arrange
    const newSlot = { id: 401, doctor_id: pendingAppointment.doctor_id };
    const updateQuery = createSupabaseQuery({ data: null, error: null });
    const notificationQuery = createSupabaseQuery({ data: null, error: null });
    ensureDoctorScheduleSlot.mockResolvedValue(newSlot);
    reserveDoctorScheduleSlot.mockResolvedValue(newSlot);

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: pendingAppointment, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentPet, error: null }))
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentActors, error: null }))
      .mockReturnValueOnce(notificationQuery)
      .mockReturnValueOnce(createSupabaseQuery({ data: [appointmentPet], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ ...pendingAppointment, doctor_schedule_slot_id: newSlot.id, requested_date: "2099-07-21", requested_time: "10:00:00" }], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [appointmentPet], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ id: 300, full_name: "Dr. Nguyen" }], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: [{ id: newSlot.id, slot_date: "2099-07-21", start_time: "10:00:00", schedule: { room_name: "Room 3" } }],
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: [{ id: 701, appointment_id: pendingAppointment.id, quantity: 1, unit_price: medicalService.price, service: medicalService }],
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }));

    // Act
    const appointment = await rescheduleCustomerAppointment(
      `APT-${pendingAppointment.id}`,
      { date: "2099-07-21", time: "10:00", reason: "Change doctor slot" },
      appointmentCustomerId,
    );

    // Assert
    expect(ensureDoctorScheduleSlot).toHaveBeenCalledWith(pendingAppointment.doctor_id, "2099-07-21", "10:00:00");
    expect(reserveDoctorScheduleSlot).toHaveBeenCalledWith(newSlot.id);
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        doctor_schedule_slot_id: newSlot.id,
        requested_date: "2099-07-21",
        requested_time: "10:00:00",
        note: expect.stringContaining("Change doctor slot"),
      }),
    );
    expect(setDoctorScheduleSlotStatus).toHaveBeenCalledWith(pendingAppointment.doctor_schedule_slot_id, "AVAILABLE");
    expect(notificationQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: appointmentActors.doctors.user_id,
        type: "APPOINTMENT",
        is_read: false,
      }),
    );
    expect(appointment).toEqual(expect.objectContaining({ appointmentId: pendingAppointment.id, time: "10:00" }));
  });

  test("cancels a pending medical appointment, releases the doctor slot and notifies the doctor", async () => {
    // Arrange
    const updateQuery = createSupabaseQuery({ data: null, error: null });
    const notificationQuery = createSupabaseQuery({ data: null, error: null });

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: pendingAppointment, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentPet, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: appointmentActors, error: null }))
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(notificationQuery)
      .mockReturnValueOnce(createSupabaseQuery({ data: [appointmentPet], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ ...pendingAppointment, status: "CANCELLED", cancel_reason: "Busy day" }], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [appointmentPet], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ id: 300, full_name: "Dr. Nguyen" }], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: [{
          id: pendingAppointment.doctor_schedule_slot_id,
          slot_date: pendingAppointment.requested_date,
          start_time: pendingAppointment.requested_time,
          schedule: { room_name: "Room 2" },
        }],
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: [{ id: 702, appointment_id: pendingAppointment.id, quantity: 1, unit_price: medicalService.price, service: medicalService }],
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }));

    // Act
    const appointment = await cancelCustomerAppointment(
      `APT-${pendingAppointment.id}`,
      { reason: "Busy day" },
      appointmentCustomerId,
    );

    // Assert
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "CANCELLED",
        cancel_reason: "Busy day",
      }),
    );
    expect(setDoctorScheduleSlotStatus).toHaveBeenCalledWith(pendingAppointment.doctor_schedule_slot_id, "AVAILABLE");
    expect(notificationQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: appointmentActors.doctors.user_id,
        type: "APPOINTMENT",
        is_read: false,
      }),
    );
    expect(appointment).toEqual(expect.objectContaining({ appointmentId: pendingAppointment.id, status: "CANCELLED" }));
  });
});
