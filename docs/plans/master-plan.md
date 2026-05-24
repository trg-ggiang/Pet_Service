# Master Plan

## Current Focus

Hien tai project dang o giai doan khoi tao tai lieu va xac dinh pham vi MVP. Trong khi chua co y tuong san pham chi tiet hon, can tap trung lam ro business requirements, tech stack va kien truc nen tang truoc khi code chuc nang.

Trang thai hien tai: In Progress

## Roadmap

| Phase | Ten phase | Muc tieu | Trang thai | Ghi chu |
| --- | --- | --- | --- | --- |
| Phase 01 | Project setup | Xac nhan cau truc project, stack chinh, cach chay frontend/backend, quy uoc env va tai lieu setup. | Todo | Nen hoan thanh truoc khi code tinh nang. |
| Phase 02 | Product scope confirmation | Xac nhan mo hinh san pham, role, danh sach dich vu MVP va luong nghiep vu chinh. | Todo | Can lam ro cac muc trong `Can xac nhan them` cua BRD. |
| Phase 03 | Database design | Thiet ke schema cho user, pet, service provider, service va booking/request. | Todo | Can co ERD hoac mo ta quan he du lieu truoc khi implement API. |
| Phase 04 | Authentication and authorization | Xay dung dang ky, dang nhap, quan ly session/token va phan quyen theo role. | Todo | Role du kien: Guest, Customer, Service Provider, Admin. |
| Phase 05 | Customer core features | Cho phep Customer quan ly thong tin ca nhan, quan ly thu cung, xem dich vu va tao yeu cau dat lich. | Todo | Day la phan cot loi cua MVP. |
| Phase 06 | Service Provider features | Cho phep Service Provider quan ly dich vu va cap nhat trang thai yeu cau. | Todo | Can xac nhan Service Provider co tu quan ly trong MVP hay Admin quan ly thay. |
| Phase 07 | Admin basic management | Xay dung man hinh/chuc nang Admin co ban de quan ly user, provider, service va request. | Todo | Chi lam muc can thiet cho MVP, tranh dashboard nang cao. |
| Phase 08 | UI polish and responsive | Hoan thien giao dien tong quan, form, trang danh sach, trang chi tiet va responsive co ban. | Todo | Uu tien ro rang, de dung, khong them tinh nang ngoai scope. |
| Phase 09 | Testing and manual QA | Kiem tra flow chinh, role permission, validation, loi form va cac case trang thai booking. | Todo | Can co checklist manual test cho MVP. |
| Phase 10 | Deployment preparation | Chuan bi bien moi truong, build command, cau hinh deploy va checklist release. | Todo | Khong hard-code secret; can cap nhat setup guide. |
| Phase 11 | MVP release | Dong goi phien ban MVP co the demo va ghi nhan changelog. | Todo | Chi release khi flow Customer -> Booking -> Provider/Admin xu ly hoat dong on dinh. |

## Phase Details

### Phase 01: Project setup

- Muc tieu: xac dinh project chay nhu the nao, frontend/backend nam o dau, dung package manager nao, can database hay service ngoai nao.
- Trang thai: Todo
- Ghi chu: cap nhat `docs/setup-guide.md` sau khi xac nhan stack va lenh chay that.

### Phase 02: Product scope confirmation

- Muc tieu: lam ro cac gia dinh san pham trong `docs/brief.md` va `docs/BRD.md`.
- Trang thai: Todo
- Ghi chu: can xac nhan mo hinh marketplace hay he thong cho mot don vi dich vu duy nhat.

### Phase 03: Database design

- Muc tieu: thiet ke du lieu cho User, Pet, Service Provider, Service va Service Request/Booking.
- Trang thai: Todo
- Ghi chu: can thong nhat status cua booking va quan he giua Customer, Pet, Service, Provider.

### Phase 04: Authentication and authorization

- Muc tieu: co dang ky, dang nhap va phan quyen backend theo role.
- Trang thai: Todo
- Ghi chu: khong chi an/hien UI tren frontend; backend phai kiem tra quyen.

### Phase 05: Customer core features

- Muc tieu: Customer co the quan ly thu cung, xem dich vu va tao yeu cau dat lich.
- Trang thai: Todo
- Ghi chu: flow nay la trong tam cua MVP.

### Phase 06: Service Provider features

- Muc tieu: Service Provider co the quan ly dich vu cua minh va xu ly yeu cau khach hang.
- Trang thai: Todo
- Ghi chu: neu MVP chua co Service Provider rieng, co the chuyen mot phan sang Admin.

### Phase 07: Admin basic management

- Muc tieu: Admin co the quan ly du lieu nen tang can thiet de he thong van hanh.
- Trang thai: Todo
- Ghi chu: khong lam dashboard nang cao trong MVP.

### Phase 08: UI polish and responsive

- Muc tieu: lam giao dien ro rang, de dung tren desktop va mobile.
- Trang thai: Todo
- Ghi chu: uu tien form, danh sach, trang thai booking va thong bao loi.

### Phase 09: Testing and manual QA

- Muc tieu: xac minh cac flow chinh va business rules quan trong.
- Trang thai: Todo
- Ghi chu: moi role can co checklist test rieng.

### Phase 10: Deployment preparation

- Muc tieu: chuan bi cau hinh build, env, database, deployment va rollback co ban.
- Trang thai: Todo
- Ghi chu: secret phai nam trong bien moi truong hoac secret manager.

### Phase 11: MVP release

- Muc tieu: chot ban MVP co the demo, co changelog va huong dan test.
- Trang thai: Todo
- Ghi chu: sau release moi xem xet tinh nang sau MVP nhu thanh toan, chat, danh gia, AI.

## Next Steps

1. Xac nhan y tuong san pham chi tiet hon de cap nhat `docs/brief.md`.
2. Xac nhan cac muc trong `Can xac nhan them` cua `docs/BRD.md`.
3. Kiem tra stack va lenh chay that cua project de cap nhat `docs/setup-guide.md`.
4. Thiet ke database schema ban dau cho User, Pet, Service Provider, Service va Booking.
5. Lap plan chi tiet cho Phase 01 truoc khi code.

## Notes

- Chua code chuc nang trong buoc lap master plan nay.
- Cac phase co the thay doi sau khi business scope va tech stack duoc xac nhan.
- Khi mot phase bat dau, cap nhat trang thai thanh `In Progress`; khi xong va da test, cap nhat thanh `Done`.

