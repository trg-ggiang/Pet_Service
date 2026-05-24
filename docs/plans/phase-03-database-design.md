# Phase 03: Database Design

## 1. Muc tieu phase

Thiet ke schema du lieu nen tang cho User, Pet, Service Provider, Service va Service Request/Booking.

## 2. Pham vi cong viec

- Xac dinh entity chinh.
- Xac dinh quan he giua entity.
- Xac dinh truong bat buoc va trang thai nghiep vu.
- Xac dinh constraint va index co ban.
- Chuan bi migration/schema theo stack da chon.

## 3. Checklist chi tiet

- [ ] Xac dinh bang/model `User`.
- [ ] Xac dinh bang/model `Pet`.
- [ ] Xac dinh bang/model `ServiceProviderProfile`.
- [ ] Xac dinh bang/model `Service`.
- [ ] Xac dinh bang/model `Booking` hoac `ServiceRequest`.
- [ ] Xac dinh enum role: Customer, Service Provider, Admin.
- [ ] Xac dinh enum booking status.
- [ ] Xac dinh quan he 1-nhieu giua Customer va Pet.
- [ ] Xac dinh quan he giua Provider va Service.
- [ ] Xac dinh quan he giua Booking, Customer, Pet, Service va Provider.
- [ ] Xac dinh quy tac xoa mem/xoa cung neu can.
- [ ] Viet tai lieu schema hoac ERD neu can.

## 4. File/thu muc du kien bi anh huong

- `backend/`
- `backend/src/`
- `backend/prisma/` hoac thu muc migration tuong ung neu dung ORM
- `docs/BRD.md` neu can cap nhat data rules
- `docs/CHANGELOG.md` neu co thay doi schema quan trong

## 5. Ket qua mong doi

Co thiet ke du lieu du de implement authentication, quan ly thu cung, dich vu va booking/request.

## 6. Cach test manual

- Doc schema va doi chieu voi yeu cau du lieu trong BRD.
- Tao thu du lieu mau cho cac entity chinh neu da co database.
- Kiem tra moi booking co du Customer, Pet, Service va Provider.
- Kiem tra role va booking status khong bi mo ho.

## 7. Rui ro co the gap

- Thiet ke qua som khi scope chua ro.
- Thieu constraint dan den booking khong day du du lieu.
- Trang thai booking thiet ke khong phu hop flow thuc te.
- Quan he Admin/Provider/Customer bi lan lon.

## 8. Dieu kien Done

- Entity va quan he chinh da duoc thong nhat.
- Schema dap ung MVP.
- Cac status va role duoc dinh nghia ro.
- Neu co migration, migration chay duoc tren moi truong local.

