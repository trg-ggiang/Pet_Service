# Business Requirements Document

## 1. Tong quan du an

Pet Service la mot ung dung/dich vu ho tro nguoi nuoi thu cung tim kiem, quan ly va su dung cac dich vu lien quan den thu cung. Du an huong den viec tao mot noi tap trung de nguoi dung co the xem dich vu, quan ly thong tin thu cung, tao yeu cau dat lich va theo doi trang thai xu ly.

O phien ban hien tai, brief moi o muc khoi dau. Cac noi dung trong BRD nay duoc viet theo huong MVP don gian, de team co co so thong nhat khi phat trien tiep.

## 2. Muc tieu san pham

- Giup nguoi nuoi thu cung de dang tim va dang ky cac dich vu phu hop.
- Giam viec trao doi roi rac qua nhieu kenh nhu dien thoai, tin nhan hoac ghi chu thu cong.
- Cho phep nguoi dung quan ly thong tin co ban cua thu cung tai mot noi.
- Cho phep ben cung cap dich vu tiep nhan va theo doi yeu cau tu khach hang.
- Tao nen tang ban dau de mo rong sang thanh toan, chat, danh gia, goi y dich vu va dashboard sau MVP.

## 3. Doi tuong nguoi dung

### Nguoi nuoi thu cung

Nguoi can tim dich vu cham soc, spa, kham suc khoe, trong giu, tu van hoac cac dich vu khac cho thu cung.

### Ben cung cap dich vu

Ca nhan hoac don vi cung cap dich vu cho thu cung. Nhom nay can quan ly thong tin dich vu, tiep nhan yeu cau va cap nhat trang thai xu ly.

### Quan tri vien he thong

Nguoi quan ly du lieu nen tang, kiem soat danh sach dich vu, nguoi dung va cac thong tin can thiet de he thong van hanh on dinh.

## 4. Danh sach role trong he thong

- Guest: nguoi chua dang nhap.
- Customer: nguoi nuoi thu cung.
- Service Provider: ben cung cap dich vu.
- Admin: quan tri vien he thong.

## 5. Chuc nang theo tung role

### Guest

- Xem trang chinh/gioi thieu san pham.
- Xem danh sach dich vu cong khai neu he thong cho phep.
- Dang ky tai khoan.
- Dang nhap vao he thong.

### Customer

- Quan ly thong tin ca nhan co ban.
- Them, sua, xoa hoac xem thong tin thu cung cua minh.
- Xem danh sach dich vu.
- Tim kiem hoac loc dich vu theo nhu cau co ban.
- Tao yeu cau dat lich/dang ky dich vu.
- Xem trang thai yeu cau dich vu.
- Huy yeu cau neu yeu cau chua duoc xu ly hoac theo business rule cho phep.

### Service Provider

- Quan ly thong tin nha cung cap co ban.
- Tao, sua, an/hien dich vu minh cung cap.
- Xem danh sach yeu cau dich vu cua khach hang.
- Cap nhat trang thai yeu cau: moi, da xac nhan, dang xu ly, hoan thanh, da huy.
- Xem thong tin can thiet cua khach hang va thu cung de phuc vu yeu cau.

### Admin

- Quan ly nguoi dung.
- Quan ly nha cung cap dich vu.
- Quan ly danh muc/danh sach dich vu.
- Kiem tra va dieu chinh du lieu bat thuong neu can.
- Theo doi cac yeu cau dich vu trong he thong o muc tong quan.

## 6. User flow chinh

### Customer dat dich vu

1. Customer vao he thong.
2. Customer dang ky/dang nhap.
3. Customer them thong tin thu cung neu chua co.
4. Customer xem hoac tim kiem dich vu.
5. Customer chon dich vu phu hop.
6. Customer tao yeu cau dat lich/dang ky dich vu.
7. He thong ghi nhan yeu cau voi trang thai ban dau.
8. Customer theo doi trang thai yeu cau.

### Service Provider xu ly yeu cau

1. Service Provider dang nhap.
2. Service Provider xem danh sach yeu cau moi.
3. Service Provider xem chi tiet yeu cau.
4. Service Provider xac nhan, tu choi hoac cap nhat trang thai.
5. He thong cap nhat trang thai de Customer co the theo doi.

### Admin quan ly du lieu co ban

1. Admin dang nhap.
2. Admin xem danh sach nguoi dung, nha cung cap, dich vu hoac yeu cau.
3. Admin tao, sua, khoa, an/hien hoac dieu chinh du lieu theo quyen.
4. He thong luu lai thay doi quan trong neu co co che audit/log.

## 7. Business rules quan trong

- Mot Customer co the co nhieu thu cung.
- Mot yeu cau dich vu nen gan voi mot Customer, mot thu cung va mot dich vu cu the.
- Trang thai yeu cau can co vong doi ro rang, vi du: moi -> da xac nhan -> dang xu ly -> hoan thanh.
- Yeu cau da hoan thanh khong nen duoc sua cac thong tin quan trong, tru khi Admin co quyen dac biet.
- Customer chi duoc xem va quan ly du lieu cua chinh minh.
- Service Provider chi duoc quan ly dich vu va yeu cau lien quan den minh.
- Admin co quyen quan ly toan he thong, nhung cac thao tac quan trong nen co log.
- Khong luu secret key, token, password hoac database URL that trong source code.
- Neu co gia dich vu, can xac dinh don vi tien te va cach hien thi thong nhat.
- Neu co lich hen, can xac dinh timezone va quy tac trung lich.

## 8. Yeu cau du lieu chinh

### User

- ID
- Ho ten
- Email hoac so dien thoai
- Mat khau da hash
- Role
- Trang thai tai khoan
- Thoi gian tao/cap nhat

### Pet

- ID
- Customer ID
- Ten thu cung
- Loai thu cung
- Giong neu co
- Tuoi hoac ngay sinh neu co
- Gioi tinh neu co
- Ghi chu suc khoe neu can

### Service Provider Profile

- ID
- User ID
- Ten don vi/ca nhan
- Mo ta ngan
- Thong tin lien he
- Dia chi neu can
- Trang thai hoat dong

### Service

- ID
- Service Provider ID
- Ten dich vu
- Mo ta
- Danh muc
- Gia hoac khoang gia neu co
- Thoi luong du kien neu co
- Trang thai hien thi

### Service Request / Booking

- ID
- Customer ID
- Pet ID
- Service ID
- Service Provider ID
- Thoi gian mong muon
- Ghi chu cua khach hang
- Trang thai
- Thoi gian tao/cap nhat

## 9. Yeu cau giao dien tong quan

- Giao dien can don gian, ro rang, de dung voi nguoi khong co nhieu kinh nghiem ky thuat.
- Man hinh chinh nen cho nguoi dung nhanh chong hieu san pham cung cap dich vu gi.
- Danh sach dich vu can de doc, co ten, mo ta ngan, gia neu co va nut thao tac ro rang.
- Form tao yeu cau dich vu can ngan gon, co validation de tranh thieu thong tin quan trong.
- Trang quan ly thu cung can hien thi cac thong tin co ban va thao tac them/sua/xoa ro rang.
- Trang theo doi yeu cau can hien thi trang thai noi bat, de nguoi dung biet viec dang o dau.
- Khu vuc Admin/Service Provider nen uu tien tinh thuc dung, bang danh sach de scan va thao tac nhanh.
- Thiet ke can ho tro responsive co ban cho desktop va mobile.

## 10. Yeu cau bao mat co ban

- Mat khau phai duoc hash, khong luu plain text.
- Phan quyen theo role phai duoc kiem tra o backend, khong chi dua vao frontend.
- Customer khong duoc truy cap du lieu cua Customer khac.
- Service Provider khong duoc truy cap yeu cau khong thuoc minh.
- Admin endpoint can duoc bao ve boi authentication va authorization.
- Validate input o ca frontend va backend.
- Khong hard-code secret key, token, credential hoac database URL vao source code.
- Su dung bien moi truong cho cau hinh nhay cam.
- Neu co upload anh trong tuong lai, can gioi han loai file, kich thuoc file va quet noi dung phu hop.

## 11. Tech stack de xuat

Tech stack can duoc xac nhan theo codebase thuc te. De xuat ban dau:

- Frontend: React hoac framework dang co trong project.
- Backend: Node.js voi Express/NestJS hoac framework dang co trong project.
- Database: PostgreSQL cho du lieu quan he nhu user, pet, service va booking.
- Authentication: JWT hoac session-based auth tuy theo kien truc.
- Styling: CSS/Tailwind/component library tuy theo huong UI cua project.
- API style: REST API cho MVP de don gian va de test.
- Deployment: tach frontend/backend neu can, dung bien moi truong cho cau hinh.

## 12. Pham vi MVP

- Trang chinh/gioi thieu san pham.
- Dang ky va dang nhap neu he thong can phan quyen.
- Quan ly thong tin nguoi dung co ban.
- Quan ly thong tin thu cung co ban.
- Danh sach dich vu co ban.
- Tim kiem/loc dich vu o muc don gian.
- Tao yeu cau dat lich/dang ky dich vu.
- Xem trang thai yeu cau dich vu.
- Service Provider xem va cap nhat trang thai yeu cau.
- Admin quan ly du lieu co ban neu can.
- Tai lieu setup va huong dan manual test toi thieu.

## 13. Nhung chuc nang de sau MVP

- Thanh toan online.
- Chat realtime giua Customer va Service Provider.
- Danh gia, binh luan va xep hang dich vu nang cao.
- Goi y dich vu bang AI.
- Ung dung mobile rieng.
- Tich hop ban do, dinh vi hoac giao hang.
- Dashboard thong ke nang cao.
- Voucher, loyalty program hoac tu dong hoa marketing.
- Upload va quan ly ho so suc khoe nang cao cho thu cung.
- Nhac lich tu dong qua email/SMS/push notification.

## 14. Do / Don't khi phat trien du an

### Do

- Doc `docs/brief.md`, `docs/BRD.md`, `docs/plans/master-plan.md` va `AGENTS.md` truoc khi lam task lon.
- Lap plan ngan truoc khi code cac thay doi co nhieu buoc.
- Giu thay doi dung scope duoc giao.
- Viet code ro rang, de bao tri va phu hop voi cau truc san co.
- Bao cao file da sua sau moi task.
- Huong dan manual test sau moi task.
- Cap nhat `docs/CHANGELOG.md` khi co thay doi quan trong.
- Su dung bien moi truong cho cau hinh nhay cam.

### Don't

- Khong tu y them tinh nang ngoai yeu cau.
- Khong refactor lon neu task khong yeu cau.
- Khong hard-code secret, token, password hoac database URL.
- Khong sua/xoa du lieu hoac file khong lien quan.
- Khong bo qua phan quyen backend cho cac thao tac nhay cam.
- Khong commit file build tam, log ca nhan hoac file chua secret.

## 15. Can xac nhan them

- Mo hinh san pham chinh la marketplace ket noi nhieu nha cung cap hay la he thong cho mot don vi dich vu duy nhat.
- Danh sach dich vu cu the trong giai doan MVP.
- Co can Service Provider dang nhap va tu quan ly dich vu trong MVP hay Admin quan ly thay.
- Co can thanh toan, dat coc hoac bao gia trong MVP khong.
- Co can lich hen theo khung gio thuc te va chong trung lich ngay trong MVP khong.
- Tech stack chinh thuc cua frontend, backend va database.
- Yeu cau ve ngon ngu giao dien, tien te, timezone va dia ban phuc vu.
- Co can upload anh thu cung, anh dich vu hoac tai lieu suc khoe trong MVP khong.

