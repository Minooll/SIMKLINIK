-- ============================================================
-- SEED DATA 3 KLINIK PERCONTOHAN KABUPATEN PURWOREJO
-- Standar: Permenkes No. 24/2022 & Platform Multi-Klinik Regional
-- ============================================================

insert into public.clinics (code, name, district, address, phone, operating_hours, facilities, latitude, longitude, is_active)
values
  (
    'KLN-PWR-01',
    'Klinik Pratama Sehat Mandiri Purworejo',
    'Purworejo',
    'Jl. Brigjen Katamso No. 42, Pangenrejo, Kec. Purworejo, Kab. Purworejo',
    '(0275) 321456',
    '08:00 - 21:00 WIB',
    array['Poli Umum', 'Poli Gigi', 'Farmasi'],
    -7.7144,
    110.0125,
    true
  ),
  (
    'KLN-PWR-02',
    'Klinik Pratama & Bersalin Kutoarjo Medika',
    'Kutoarjo',
    'Jl. Pangeran Diponegoro No. 18, Kutoarjo, Kec. Kutoarjo, Kab. Purworejo',
    '(0275) 641890',
    '24 Jam (UGD & Persalinan) / Poli: 08:00 - 20:00 WIB',
    array['Poli Umum', 'Poli KIA / Kebidanan', 'Farmasi', 'UGD 24 Jam'],
    -7.7198,
    109.9134,
    true
  ),
  (
    'KLN-PWR-03',
    'Klinik Pratama Keluarga Banyuurip',
    'Banyuurip',
    'Jl. Tentara Pelajar No. 88, Boro Kulon, Kec. Banyuurip, Kab. Purworejo',
    '(0275) 325112',
    '08:00 - 17:00 WIB',
    array['Poli Umum', 'Laboratorium Sederhana', 'Farmasi'],
    -7.7420,
    109.9985,
    true
  )
on conflict (code) do update set
  name = excluded.name,
  district = excluded.district,
  address = excluded.address,
  phone = excluded.phone,
  operating_hours = excluded.operating_hours,
  facilities = excluded.facilities,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  is_active = excluded.is_active;
