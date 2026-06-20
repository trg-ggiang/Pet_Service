import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockAuthSession } from "../tests/mocks/auth.mock";
import { mockCustomerPetDashboard } from "../tests/mocks/customerCore.mock";
import { writeStorage } from "../utils/authSession";
import {
  createCustomerPet,
  downloadCustomerInvoicePdf,
  downloadLatestCustomerInvoicePdf,
  downloadMatchingCustomerInvoicePdf,
  fetchCustomerPetDashboard,
  fetchPetDetail,
  updateCustomerPet,
} from "./customerPets";

function mockFetchJson(payload: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: vi.fn().mockResolvedValue(payload),
    }),
  );
}

function mockFetchPdf(options: {
  contentDisposition?: string | null;
  ok?: boolean;
  status?: number;
  errorPayload?: unknown;
} = {}) {
  const blob = new Blob(["pdf"], { type: "application/pdf" });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: options.ok ?? true,
      status: options.status ?? 200,
      blob: vi.fn().mockResolvedValue(blob),
      json: vi.fn().mockResolvedValue(options.errorPayload ?? {}),
      headers: {
        get: vi.fn((name: string) =>
          name.toLowerCase() === "content-disposition"
            ? (options.contentDisposition ?? null)
            : null,
        ),
      },
    }),
  );
  return blob;
}

describe("customerPets API", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    writeStorage(localStorage, mockAuthSession);
  });

  test("fetches the customer pet dashboard with auth headers", async () => {
    // Arrange
    mockFetchJson({ ok: true, ...mockCustomerPetDashboard });

    // Act
    const dashboard = await fetchCustomerPetDashboard();

    // Assert
    expect(dashboard).toEqual(mockCustomerPetDashboard);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/pets",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockAuthSession.token}`,
        }),
      }),
    );
  });

  test("fetches pet detail and preserves nested records", async () => {
    // Arrange
    const payload = {
      ok: true,
      pet: { id: 100, name: "Milo" },
      appointments: [{ id: 200 }],
      vaccinations: [],
      medicalVisits: [],
      groomingRecords: [],
      boardingRecords: [],
      invoices: [{ id: 400, items: [] }],
    };
    mockFetchJson(payload);

    // Act
    const detail = await fetchPetDetail(100);

    // Assert
    expect(detail).toEqual({
      pet: payload.pet,
      appointments: payload.appointments,
      vaccinations: [],
      medicalVisits: [],
      groomingRecords: [],
      boardingRecords: [],
      invoices: payload.invoices,
    });
  });

  test("creates a customer pet with camelCase and snake_case species compatibility", async () => {
    // Arrange
    mockFetchJson({ ok: true, pet: { id: 101 } });

    // Act
    const pet = await createCustomerPet({
      name: "Dau",
      speciesId: 1,
      breedId: 11,
      gender: "FEMALE",
      dob: "2024-01-01",
      weight: "3.5",
      color: null,
      imgUrl: null,
      allergies: null,
      chronicDiseases: null,
      specialNote: null,
    });

    // Assert
    expect(pet).toEqual({ id: 101 });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/pets",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"species_id":1'),
      }),
    );
  });

  test("updates a customer pet with PUT and auth headers", async () => {
    // Arrange
    mockFetchJson({ ok: true, pet: { id: 100 } });

    // Act
    const pet = await updateCustomerPet(100, {
      name: "Milo Updated",
      speciesId: 1,
      breedId: null,
      gender: "MALE",
      dob: null,
      weight: null,
      color: null,
      imgUrl: null,
      allergies: null,
      chronicDiseases: null,
      specialNote: null,
    });

    // Assert
    expect(pet).toEqual({ id: 100 });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/pets/100",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockAuthSession.token}`,
        }),
      }),
    );
  });

  test("downloads an invoice PDF using the UTF-8 filename from response headers", async () => {
    // Arrange
    const objectUrl = "blob:invoice-400";
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const createObjectUrl = vi.fn(() => objectUrl);
    const revokeObjectUrl = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    });
    const blob = mockFetchPdf({
      contentDisposition: "attachment; filename*=UTF-8''hoa-don-400.pdf",
    });

    // Act
    await downloadCustomerInvoicePdf(400);

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/invoices/400/pdf",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockAuthSession.token}`,
        }),
      }),
    );
    expect(createObjectUrl).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith(objectUrl);
  });

  test("downloads the latest invoice PDF with a fallback filename", async () => {
    // Arrange
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:latest-invoice"),
      revokeObjectURL: vi.fn(),
    });
    mockFetchPdf();

    // Act
    await downloadLatestCustomerInvoicePdf();

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/api/customer/invoices/latest/pdf",
      expect.any(Object),
    );
  });

  test("downloads a matching invoice PDF with encoded search params", async () => {
    // Arrange
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:matching-invoice"),
      revokeObjectURL: vi.fn(),
    });
    mockFetchPdf();

    // Act
    await downloadMatchingCustomerInvoicePdf({
      petName: "Milo",
      serviceName: "Khám tổng quát",
      serviceType: "Khám bệnh",
      date: "2026-06-15",
    });

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/customer/invoices/match/pdf?"),
      expect.any(Object),
    );
    expect(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain("petName=Milo");
    expect(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain("date=2026-06-15");
  });

  test("throws a readable error when invoice PDF download fails", async () => {
    // Arrange
    mockFetchPdf({
      ok: false,
      status: 404,
      errorPayload: { message: "Invoice not found" },
    });

    // Act
    const action = () => downloadCustomerInvoicePdf(999);

    // Assert
    await expect(action()).rejects.toThrow("Invoice not found");
  });
});
