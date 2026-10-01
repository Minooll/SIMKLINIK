const test = require('node:test');
const assert = require('node:assert');

// 1. Test Toast and Error Translation
const Toast = require('../assets/js/components/toast.js');
const humanize = Toast.humanizeErrorMessage;

test('humanizeErrorMessage translates missing address schema cache error', () => {
  const raw = "Could not find the 'address' column of 'patients' in the schema cache";
  const translated = humanize(raw);
  assert.strictEqual(
    translated,
    'Kolom alamat domisili belum terpasang di database, namun data telah berhasil diamankan di sesi lokal Anda.'
  );
});

test('humanizeErrorMessage translates generic missing column error', () => {
  const raw = "Could not find the 'phone_backup' column of 'patients' in the schema cache";
  const translated = humanize(raw);
  assert.match(translated, /Kolom data \(phone_backup\) belum disinkronkan di tabel database/i);
});

test('humanizeErrorMessage translates duplicate NIK constraint violation', () => {
  const raw = 'duplicate key value violates unique constraint "patients_nik_key"';
  const translated = humanize(raw);
  assert.match(translated, /Nomor Induk Kependudukan \(NIK\) ini sudah terdaftar/i);
});

test('humanizeErrorMessage translates duplicate Email constraint violation', () => {
  const raw = 'duplicate key value violates unique constraint "users_email_key"';
  const translated = humanize(raw);
  assert.match(translated, /Alamat email ini sudah terdaftar/i);
});

test('humanizeErrorMessage translates invalid login credentials', () => {
  const raw = 'Invalid login credentials';
  const translated = humanize(raw);
  assert.match(translated, /Email atau kata sandi yang Anda masukkan salah/i);
});

test('humanizeErrorMessage translates network connection errors', () => {
  const raw = 'Failed to fetch';
  const translated = humanize(raw);
  assert.match(translated, /Koneksi jaringan terputus atau server database tidak merespons/i);
});

test('humanizeErrorMessage translates AI model spike errors', () => {
  const raw = 'All models failed: This model is currently experiencing high demand';
  const translated = humanize(raw);
  assert.match(translated, /Layanan kecerdasan buatan \(AI\) sedang mengalami antrean tinggi/i);
});

// 2. Test patientService onboarding fallback when address column is absent in Supabase
const patientService = require('../assets/js/services/patientService.js');

test('completePatientOnboarding gracefully recovers when address column is missing in DB', async () => {
  let attempt = 0;
  const mockClient = {
    from(tableName) {
      if (tableName === 'profiles') {
        return {
          update() {
            return {
              eq() { return Promise.resolve({ error: null }); }
            };
          }
        };
      }
      if (tableName === 'patients') {
        return {
          select(fields) {
            return {
              eq() {
                return {
                  maybeSingle() {
                    return Promise.resolve({ data: { id: 'pt-123', no_rm: 'RM-000001' } });
                  }
                };
              }
            };
          },
          update(fields) {
            return {
              eq(col, val) {
                return {
                  select(selectFields) {
                    return {
                      single() {
                        attempt++;
                        if (attempt === 1 && fields.address) {
                          // First attempt with address fails with schema cache error
                          return Promise.resolve({
                            data: null,
                            error: {
                              message: "Could not find the 'address' column of 'patients' in the schema cache",
                              code: 'PGRST204'
                            }
                          });
                        }
                        // Second fallback attempt without address succeeds
                        return Promise.resolve({
                          data: {
                            id: 'pt-123',
                            no_rm: 'RM-000001',
                            nik: fields.nik,
                            birth_date: fields.birth_date,
                            gender: fields.gender,
                            phone: fields.phone
                          },
                          error: null
                        });
                      }
                    };
                  }
                };
              }
            };
          }
        };
      }
      throw new Error(`Unexpected table ${tableName}`);
    }
  };

  // Provide mock client into patientService
  patientService.setClient(mockClient);

  const result = await patientService.completePatientOnboarding('user-uuid-1', {
    full_name: 'Budi Santoso',
    nik: '3201234567890001',
    birth_date: '1990-01-01',
    gender: 'Laki-laki',
    phone: '081234567890',
    address: 'Jl. Melati No. 10, Jakarta'
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.data.address, 'Jl. Melati No. 10, Jakarta');
  assert.strictEqual(result.data.nik, '3201234567890001');
  assert.strictEqual(attempt, 2, 'Should have retried and succeeded on attempt 2 without address column');
});
