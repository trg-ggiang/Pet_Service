const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const {
  availableCage,
  boardingIds,
  boardingServiceRow,
  bookedCage,
  checkedInBoardingRow,
  customerBoardingRow,
  maintenanceCage,
  pendingBoardingRow,
  petRow,
} = require("../mocks/boardingOperations.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../../src/services/emailService", () => ({
  sendAppointmentEventEmail: jest.fn(),
}));

const { supabase } = require("../../src/lib/supabaseClient");
const { sendAppointmentEventEmail } = require("../../src/services/emailService");
const {
  approveBoardingBooking,
  checkInBoarding,
  checkOutBoarding,
  createCage,
  createBoardingBooking,
  deleteCage,
  extendBoardingStay,
  getCustomerBoardings,
  listConfirmedBoardings,
  listPendingBoardings,
  listRoomsWithAvailability,
  rescheduleBoardingBooking,
  updateCage,
  updateBoardingCareByCustomer,
} = require("../../src/services/boardingService");

function futureDate(daysFromNow) {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

describe("boardingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects invalid room availability date ranges before querying", async () => {
    // Arrange
    const checkIn = "2099-07-20";
    const checkOut = "2099-07-20";

    // Act
    const action = () => listRoomsWithAvailability(checkIn, checkOut);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("lists rooms with unavailable overlapping or maintenance cages", async () => {
    // Arrange
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({
        data: [bookedCage, maintenanceCage, availableCage],
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: [{ cage_id: bookedCage.id }],
        error: null,
      }));

    // Act
    const rooms = await listRoomsWithAvailability("2099-07-20", "2099-07-22");

    // Assert
    expect(rooms.map((room) => room.cageNumber)).toEqual(["CAGE-01", "CAGE-03", "CAGE-02"]);
    expect(rooms).toEqual([
      expect.objectContaining({ id: availableCage.id, isAvailable: true, pricePerDay: 180000 }),
      expect.objectContaining({ id: bookedCage.id, isAvailable: false }),
      expect.objectContaining({ id: maintenanceCage.id, isAvailable: false }),
    ]);
  });

  test("creates a boarding booking with appointment, service link and boarding record", async () => {
    // Arrange
    const checkIn = futureDate(10);
    const checkOut = futureDate(13);
    const appointmentInsert = createSupabaseQuery({
      data: { id: boardingIds.appointmentId },
      error: null,
    });
    const serviceLinkInsert = createSupabaseQuery({ data: null, error: null });
    const boardingInsert = createSupabaseQuery({
      data: { id: boardingIds.boardingId },
      error: null,
    });

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: petRow, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: availableCage, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: boardingServiceRow, error: null }))
      .mockReturnValueOnce(appointmentInsert)
      .mockReturnValueOnce(serviceLinkInsert)
      .mockReturnValueOnce(boardingInsert);

    // Act
    const result = await createBoardingBooking({
      petId: boardingIds.petId,
      cageId: boardingIds.cageId,
      checkIn,
      checkOut,
      feedingInstruction: "Dry food",
      habitNote: "Sleeps early",
      specialNote: "Needs blanket",
    }, boardingIds.customerId);

    // Assert
    expect(result).toEqual({
      boardingId: boardingIds.boardingId,
      appointmentId: boardingIds.appointmentId,
    });
    expect(appointmentInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        pet_id: boardingIds.petId,
        appointment_type: "BOARDING",
        status: "PENDING",
        requested_date: checkIn,
      }),
    );
    expect(serviceLinkInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: boardingIds.appointmentId,
        service_id: boardingServiceRow.id,
        quantity: 3,
        unit_price: availableCage.price_per_day,
      }),
    );
    expect(boardingInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: boardingIds.appointmentId,
        cage_id: boardingIds.cageId,
        current_status: "BOOKED",
        requested_check_in: checkIn,
        requested_check_out: checkOut,
      }),
    );
    expect(sendAppointmentEventEmail).toHaveBeenCalledWith(
      "boarding_booked",
      boardingIds.appointmentId,
      expect.objectContaining({ roomNumber: availableCage.cage_number }),
    );
  });

  test("rejects booking when the cage already overlaps another active stay", async () => {
    // Arrange
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: petRow, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: availableCage, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ id: 999 }], error: null }));

    // Act
    const action = () => createBoardingBooking({
      petId: boardingIds.petId,
      cageId: boardingIds.cageId,
      checkIn: futureDate(10),
      checkOut: futureDate(13),
    }, boardingIds.customerId);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 400 });
    expect(sendAppointmentEventEmail).not.toHaveBeenCalled();
  });

  test("approves and checks in boarding while notifying customer and occupying the cage", async () => {
    // Arrange
    const approveAppointmentUpdate = createSupabaseQuery({ data: null, error: null });
    const notificationInsert = createSupabaseQuery({ data: null, error: null });
    const boardingUpdate = createSupabaseQuery({ data: null, error: null });
    const cageUpdate = createSupabaseQuery({ data: null, error: null });
    const appointmentUpdate = createSupabaseQuery({ data: null, error: null });

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: pendingBoardingRow, error: null }))
      .mockReturnValueOnce(approveAppointmentUpdate)
      .mockReturnValueOnce(notificationInsert)
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          id: boardingIds.boardingId,
          current_status: "BOOKED",
          cage_id: boardingIds.cageId,
          appointments: { id: boardingIds.appointmentId, status: "CONFIRMED" },
        },
        error: null,
      }))
      .mockReturnValueOnce(boardingUpdate)
      .mockReturnValueOnce(cageUpdate)
      .mockReturnValueOnce(appointmentUpdate);

    // Act
    await approveBoardingBooking(boardingIds.boardingId, boardingIds.staffId);
    await checkInBoarding(boardingIds.boardingId, boardingIds.staffId);

    // Assert
    expect(approveAppointmentUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "CONFIRMED",
        staff_id: boardingIds.staffId,
      }),
    );
    expect(notificationInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u-customer-1",
        type: "BOARDING",
        is_read: false,
      }),
    );
    expect(boardingUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_status: "CHECKED_IN" }),
    );
    expect(cageUpdate.update).toHaveBeenCalledWith({ status: "OCCUPIED" });
    expect(appointmentUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "IN_PROGRESS",
        staff_id: boardingIds.staffId,
      }),
    );
  });

  test("rejects checkout when an existing invoice has already been paid", async () => {
    // Arrange
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: checkedInBoardingRow, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: { id: boardingIds.invoiceId, payment_status: "PAID" },
        error: null,
      }));

    // Act
    const action = () => checkOutBoarding(boardingIds.boardingId, boardingIds.staffId);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 400 });
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  test("checks out boarding with invoice items and final state updates", async () => {
    // Arrange
    const invoiceInsert = createSupabaseQuery({
      data: { id: boardingIds.invoiceId },
      error: null,
    });
    const itemDelete = createSupabaseQuery({ data: null, error: null });
    const itemInsert = createSupabaseQuery({ data: null, error: null });
    const boardingUpdate = createSupabaseQuery({ data: null, error: null });
    const cageUpdate = createSupabaseQuery({ data: null, error: null });
    const appointmentUpdate = createSupabaseQuery({ data: null, error: null });
    const notificationInsert = createSupabaseQuery({ data: null, error: null });

    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: checkedInBoardingRow, error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }))
      .mockReturnValueOnce(invoiceInsert)
      .mockReturnValueOnce(itemDelete)
      .mockReturnValueOnce(itemInsert)
      .mockReturnValueOnce(boardingUpdate)
      .mockReturnValueOnce(cageUpdate)
      .mockReturnValueOnce(appointmentUpdate)
      .mockReturnValueOnce(notificationInsert);

    // Act
    const result = await checkOutBoarding(boardingIds.boardingId, boardingIds.staffId, {
      foodFeePerDay: 20000,
      extraServiceFee: 50000,
    });

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        invoiceId: boardingIds.invoiceId,
        roomFee: expect.any(Number),
        foodFee: expect.any(Number),
        serviceFee: 50000,
        total: expect.any(Number),
      }),
    );
    expect(invoiceInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        appointment_id: boardingIds.appointmentId,
        payment_status: "UNPAID",
        status: "PENDING",
      }),
    );
    expect(itemDelete.delete).toHaveBeenCalled();
    expect(itemInsert.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ source_type: "BOARDING", boarding_id: boardingIds.boardingId }),
        expect.objectContaining({ source_type: "EXTRA", boarding_id: boardingIds.boardingId }),
      ]),
    );
    expect(boardingUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ current_status: "CHECKED_OUT" }),
    );
    expect(cageUpdate.update).toHaveBeenCalledWith({ status: "CLEANING" });
    expect(appointmentUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "COMPLETED" }),
    );
    expect(notificationInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u-customer-1", type: "BOARDING" }),
    );
  });

  test("allows customer care updates and notifies staff users", async () => {
    // Arrange
    const boardingUpdate = createSupabaseQuery({ data: null, error: null });
    const staffQuery = createSupabaseQuery({
      data: [{ user_id: "u-staff-1" }, { user_id: "u-staff-2" }],
      error: null,
    });
    const notificationOne = createSupabaseQuery({ data: null, error: null });
    const notificationTwo = createSupabaseQuery({ data: null, error: null });
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: customerBoardingRow, error: null }))
      .mockReturnValueOnce(boardingUpdate)
      .mockReturnValueOnce(staffQuery)
      .mockReturnValueOnce(notificationOne)
      .mockReturnValueOnce(notificationTwo);

    // Act
    await updateBoardingCareByCustomer(boardingIds.boardingId, boardingIds.customerId, {
      feedingInstruction: "Soft food",
      specialNote: "Call owner if fever",
    });

    // Assert
    expect(boardingUpdate.update).toHaveBeenCalledWith({
      feeding_instruction: "Soft food",
      special_note: "Call owner if fever",
    });
    expect(notificationOne.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u-staff-1", type: "BOARDING" }),
    );
    expect(notificationTwo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u-staff-2", type: "BOARDING" }),
    );
  });

  test("rejects boarding extension when another active stay overlaps the extension range", async () => {
    // Arrange
    const currentCheckOut = futureDate(5);
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          ...customerBoardingRow,
          cage_id: boardingIds.cageId,
          pickup_reminder_at: `${currentCheckOut}T12:00:00.000Z`,
          cages: availableCage,
        },
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ id: 999 }], error: null }));

    // Act
    const action = () => extendBoardingStay(boardingIds.boardingId, boardingIds.customerId, {
      newCheckOut: futureDate(7),
    });

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 400 });
  });

  test("lists pending and confirmed boardings with computed nights and room data", async () => {
    // Arrange
    const pendingRow = {
      id: boardingIds.boardingId,
      cage_id: boardingIds.cageId,
      check_in: "2099-07-20T12:00:00.000Z",
      pickup_reminder_at: "2099-07-23T12:00:00.000Z",
      feeding_instruction: "Dry food",
      habit_note: "Sleeps early",
      special_note: "Needs blanket",
      current_status: "BOOKED",
      cages: availableCage,
      appointments: {
        id: boardingIds.appointmentId,
        status: "PENDING",
        created_at: "2026-06-20T08:00:00.000Z",
        pets: {
          name: "Milo",
          species: { name: "Dog" },
          breed: { name: "Poodle" },
          customers: { full_name: "Nguyen Van Minh", phone: "0901000001" },
        },
      },
    };
    const confirmedRow = {
      ...pendingRow,
      id: boardingIds.boardingId + 1,
      appointments: { ...pendingRow.appointments, status: "CONFIRMED" },
    };
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: [pendingRow, confirmedRow], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [pendingRow, confirmedRow], error: null }));

    // Act
    const pending = await listPendingBoardings();
    const confirmed = await listConfirmedBoardings();

    // Assert
    expect(pending).toEqual([
      expect.objectContaining({
        id: boardingIds.boardingId,
        appointmentId: boardingIds.appointmentId,
        room: "CAGE-01",
        pricePerDay: 180000,
        nights: 3,
        petName: "Milo",
        owner: "Nguyen Van Minh",
      }),
    ]);
    expect(confirmed).toEqual([
      expect.objectContaining({
        id: boardingIds.boardingId + 1,
        appointmentId: boardingIds.appointmentId,
        room: "CAGE-01",
        nights: 3,
      }),
    ]);
  });

  test("returns customer boardings with daily updates sorted newest first", async () => {
    // Arrange
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ id: boardingIds.petId }], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ id: boardingIds.appointmentId }], error: null }))
      .mockReturnValueOnce(createSupabaseQuery({
        data: [
          {
            id: boardingIds.boardingId,
            current_status: "CHECKED_IN",
            check_in: "2099-07-20T12:00:00.000Z",
            check_out: null,
            pickup_reminder_at: "2099-07-23T12:00:00.000Z",
            feeding_instruction: "Dry food",
            habit_note: "Sleeps early",
            special_note: "Needs blanket",
            cages: availableCage,
            appointments: {
              id: boardingIds.appointmentId,
              pets: {
                id: boardingIds.petId,
                name: "Milo",
                species: { name: "Dog" },
                breed: { name: "Poodle" },
              },
            },
            boarding_daily_updates: [
              {
                id: 1,
                date: "2099-07-21",
                eating_status: "BREAKFAST,LUNCH",
                health_status: "CHECKED",
                activity_status: "EXERCISED",
                note: "Day one",
                img_url: null,
                staffs: { full_name: "Staff One" },
              },
              {
                id: 2,
                date: "2099-07-22",
                eating_status: "BREAKFAST,LUNCH,DINNER",
                health_status: "CHECKED",
                activity_status: "EXERCISED",
                note: "Day two",
                img_url: "https://example.test/day-two.jpg",
                staffs: { full_name: "Staff Two" },
              },
            ],
          },
        ],
        error: null,
      }));

    // Act
    const result = await getCustomerBoardings(boardingIds.customerId);

    // Assert
    expect(result).toEqual([
      expect.objectContaining({
        id: boardingIds.boardingId,
        status: "CHECKED_IN",
        petName: "Milo",
        roomNumber: "CAGE-01",
        dailyUpdates: [
          expect.objectContaining({ id: 2, date: "2099-07-22", staffName: "Staff Two" }),
          expect.objectContaining({ id: 1, date: "2099-07-21", staffName: "Staff One" }),
        ],
      }),
    ]);
  });

  test("extends boarding stay when the room is still available and notifies staff", async () => {
    // Arrange
    const currentCheckOut = futureDate(5);
    const newCheckOut = futureDate(7);
    const extensionUpdate = createSupabaseQuery({ data: null, error: null });
    const staffQuery = createSupabaseQuery({
      data: [{ user_id: "u-staff-1" }, { user_id: "u-staff-2" }],
      error: null,
    });
    const notificationOne = createSupabaseQuery({ data: null, error: null });
    const notificationTwo = createSupabaseQuery({ data: null, error: null });
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          ...customerBoardingRow,
          cage_id: boardingIds.cageId,
          pickup_reminder_at: `${currentCheckOut}T12:00:00.000Z`,
          cages: availableCage,
        },
        error: null,
      }))
      .mockReturnValueOnce(createSupabaseQuery({ data: [], error: null }))
      .mockReturnValueOnce(extensionUpdate)
      .mockReturnValueOnce(staffQuery)
      .mockReturnValueOnce(notificationOne)
      .mockReturnValueOnce(notificationTwo);

    // Act
    const result = await extendBoardingStay(boardingIds.boardingId, boardingIds.customerId, {
      newCheckOut,
    });

    // Assert
    expect(result).toEqual({
      newCheckOut,
      petName: "Milo",
      roomNumber: "CAGE-01",
    });
    expect(extensionUpdate.update).toHaveBeenCalledWith({
      pickup_reminder_at: `${newCheckOut}T12:00:00.000Z`,
    });
    expect(notificationOne.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u-staff-1", type: "BOARDING" }),
    );
    expect(notificationTwo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u-staff-2", type: "BOARDING" }),
    );
  });

  test("creates, updates and blocks deleting active boarding rooms", async () => {
    // Arrange
    const createQuery = createSupabaseQuery({ data: { id: 301, cage_number: "CAGE-09" }, error: null });
    const updateQuery = createSupabaseQuery({ data: null, error: null });
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }))
      .mockReturnValueOnce(createQuery)
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(createSupabaseQuery({ data: [{ id: boardingIds.boardingId }], error: null }));

    // Act
    const room = await createCage({
      cageNumber: " CAGE-09 ",
      sizeType: "VIP",
      pricePerDay: 350000,
      description: "Premium room",
      note: "Window side",
    });
    await updateCage(301, { status: "CLEANING", note: "Sanitizing" });
    const deleteAction = () => deleteCage(301);

    // Assert
    expect(room).toEqual({ id: 301, cage_number: "CAGE-09" });
    expect(createQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cage_number: "CAGE-09",
        status: "AVAILABLE",
        size_type: "VIP",
        price_per_day: 350000,
        description: "Premium room",
        note: "Window side",
      }),
    );
    expect(updateQuery.update).toHaveBeenCalledWith({
      status: "CLEANING",
      note: "Sanitizing",
    });
    await expect(deleteAction()).rejects.toMatchObject({ statusCode: 400 });
  });

  test("reschedules a booked boarding appointment for its owner", async () => {
    // Arrange
    const checkIn = futureDate(8);
    const checkOut = futureDate(11);
    const boardingUpdate = createSupabaseQuery({ data: null, error: null });
    const appointmentUpdate = createSupabaseQuery({ data: null, error: null });
    supabase.from
      .mockReturnValueOnce(createSupabaseQuery({
        data: {
          id: boardingIds.boardingId,
          current_status: "BOOKED",
          appointments: {
            id: boardingIds.appointmentId,
            status: "PENDING",
            pets: { customers: { id: boardingIds.customerId } },
          },
        },
        error: null,
      }))
      .mockReturnValueOnce(boardingUpdate)
      .mockReturnValueOnce(appointmentUpdate);

    // Act
    await rescheduleBoardingBooking(boardingIds.appointmentId, boardingIds.customerId, {
      checkIn,
      checkOut,
    });

    // Assert
    expect(boardingUpdate.update).toHaveBeenCalledWith({
      check_in: new Date(checkIn).toISOString(),
      pickup_reminder_at: new Date(checkOut).toISOString(),
    });
    expect(appointmentUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) }),
    );
  });
});
