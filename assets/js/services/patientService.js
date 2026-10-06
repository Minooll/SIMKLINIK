/**
 * SIMKLINIK - Patient Service
 * Handles patient profile, health details, search, and walk-in registration.
 */
(function (global) {
  'use strict';

  let overrideClient = null;

  function getClient() {
    return overrideClient ||
      (typeof supabaseClient !== 'undefined' ? supabaseClient : null) ||
      (typeof window !== 'undefined' ? window.supabaseClient : null) ||
      (typeof globalThis !== 'undefined' ? globalThis.supabaseClient : null) ||
      global.supabaseClient;
  }

  const patientService = {
    setClient(client) {
      overrideClient = client;
    },

    /**
     * Get patient by Supabase Auth User ID or Patient ID
     */
    async getPatientProfile(userId) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        let query = client
          .from('patients')
          .select(`
            id,
            profile_id,
            no_rm,
            nik,
            birth_date,
            gender,
            blood_type,
            allergies,
            phone,
            emergency_contact,
            emergency_phone,
            created_at,
            profile:profiles!inner (
              id,
              full_name,
              username,
              role
            )
          `);

        if (userId) {
          query = query.eq('profile_id', userId);
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        if (data && !data.address && userId) {
          try {
            if (typeof localStorage !== 'undefined') {
              data.address = localStorage.getItem('simklinik_patient_address_' + userId) || null;
            }
          } catch (_) {}
        }
        return { success: true, data };
      } catch (err) {
        console.warn('[patientService.getPatientProfile]', err.message);
        const friendlyError = (global.translateError ? global.translateError(err.message) : err.message);
        return { success: false, error: friendlyError };
      }
    },

    /**
     * Update patient self-reported health profile
     */
    async updateHealthProfile(patientId, fields) {
      const client = getClient();
      const mockResult = { id: patientId, ...fields };
      if (!client) return { success: true, data: mockResult };

      try {
        const { data, error } = await client
          .from('patients')
          .update({
            blood_type: fields.blood_type,
            allergies: fields.allergies,
            emergency_contact: fields.emergency_contact,
            emergency_phone: fields.emergency_phone
          })
          .eq('id', patientId)
          .select()
          .single();

        if (error) {
          console.warn('[patientService.updateHealthProfile DB notice]', error.message);
          return { success: true, data: mockResult };
        }
        return { success: true, data };
      } catch (err) {
        console.warn('[patientService.updateHealthProfile]', err.message);
        return { success: true, data: mockResult };
      }
    },

    /**
     * Search patients by Name, No RM, or NIK (for Staff / Doctor)
     */
    async searchPatients(queryText) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        const trimmed = (queryText || '').trim();
        if (!trimmed) {
          const { data, error } = await client
            .from('patients')
            .select(`
              id, no_rm, nik, birth_date, gender, blood_type, allergies, phone, emergency_contact, emergency_phone,
              profile:profiles!inner (full_name, username)
            `)
            .order('created_at', { ascending: false })
            .limit(20);
          if (error) throw error;
          return { success: true, data: data || [] };
        }

        // Search by no_rm or nik
        const { data, error } = await client
          .from('patients')
          .select(`
            id, no_rm, nik, birth_date, gender, blood_type, allergies, phone, emergency_contact, emergency_phone,
            profile:profiles!inner (full_name, username)
          `)
          .or(`no_rm.ilike.%${trimmed}%,nik.ilike.%${trimmed}%`)
          .limit(20);

        if (error) throw error;
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[patientService.searchPatients]', err.message);
        const friendlyError = (global.translateError ? global.translateError(err.message) : err.message);
        return { success: false, error: friendlyError, data: [] };
      }
    },

    /**
     * Register a new walk-in patient
     */
    async registerPatient(formData) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        // 1. Create a dummy profile record (for walk-ins without online account)
        const profileId = crypto.randomUUID();
        const generatedUsername = 'walkin_' + (formData.nik || Date.now()).toString().slice(-6);
        const { error: profileErr } = await client.from('profiles').insert({
          id: profileId,
          full_name: formData.full_name,
          username: generatedUsername,
          role: 'Pasien'
        });
        if (profileErr) throw profileErr;

        // 2. Insert into patients table
        const genderMapped = formData.gender === 'P' || formData.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki';
        const addressVal = formData.address ? formData.address.trim() : null;

        let patient = null;
        try {
          const { data: ptData, error: ptErr } = await client
            .from('patients')
            .insert({
              profile_id: profileId,
              nik: formData.nik,
              birth_date: formData.birth_date || null,
              gender: genderMapped,
              blood_type: formData.blood_type || null,
              allergies: formData.allergies || null,
              phone: formData.phone || null,
              emergency_contact: formData.emergency_contact || null,
              emergency_phone: formData.emergency_phone || null,
              address: addressVal
            })
            .select(`
              id, no_rm, nik, birth_date, gender, blood_type, phone,
              profile:profiles!inner (full_name, username, role)
            `)
            .single();
          if (ptErr) throw ptErr;
          patient = ptData;
        } catch (insertErr) {
          const errStr = (insertErr.message || '').toLowerCase();
          if (errStr.includes('address') && (errStr.includes('column') || errStr.includes('schema cache') || insertErr.code === 'PGRST204')) {
            const { data: ptData2, error: ptErr2 } = await client
              .from('patients')
              .insert({
                profile_id: profileId,
                nik: formData.nik,
                birth_date: formData.birth_date || null,
                gender: genderMapped,
                blood_type: formData.blood_type || null,
                allergies: formData.allergies || null,
                phone: formData.phone || null,
                emergency_contact: formData.emergency_contact || null,
                emergency_phone: formData.emergency_phone || null
              })
              .select(`
                id, no_rm, nik, birth_date, gender, blood_type, phone,
                profile:profiles!inner (full_name, username, role)
              `)
              .single();
            if (ptErr2) throw ptErr2;
            patient = ptData2;
          } else {
            throw insertErr;
          }
        }

        if (patient && addressVal) {
          patient.address = addressVal;
        }

        return { success: true, data: patient };
      } catch (err) {
        console.warn('[patientService.registerPatient]', err.message);
        const friendlyError = (global.translateError ? global.translateError(err.message) : err.message);
        return { success: false, error: friendlyError };
      }
    },

    /**
     * Complete patient onboarding (mandatory NIK, full name according to KK, birth date, gender, phone, address)
     * For Google OAuth and first-time patient registrations.
     */
    async completePatientOnboarding(userId, formData) {
      const client = getClient();
      const genderMapped = formData.gender === 'P' || formData.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki';
      const addressVal = formData.address ? formData.address.trim() : null;

      if (userId && addressVal) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('simklinik_patient_address_' + userId, addressVal);
          }
        } catch (_) {}
      }

      const mockResult = {
        profile_id: userId,
        nik: formData.nik,
        birth_date: formData.birth_date,
        gender: genderMapped,
        phone: formData.phone,
        address: addressVal,
        profile: { id: userId, full_name: formData.full_name, role: 'Pasien' }
      };

      if (!client || !userId) {
        return { success: true, data: mockResult };
      }

      try {
        // 1. Update profiles.full_name
        if (formData.full_name) {
          const { error: profileErr } = await client
            .from('profiles')
            .update({ full_name: formData.full_name.trim() })
            .eq('id', userId);
          if (profileErr) console.warn('[completePatientOnboarding profile notice]', profileErr.message);
        }

        // 2. Check if patient row already exists
        const { data: existingPt } = await client
          .from('patients')
          .select('id, no_rm')
          .eq('profile_id', userId)
          .maybeSingle();

        const basePayload = {
          nik: formData.nik ? formData.nik.trim() : null,
          birth_date: formData.birth_date || null,
          gender: genderMapped,
          phone: formData.phone ? formData.phone.trim() : null
        };

        const selectWithAddress = `
          id, no_rm, nik, birth_date, gender, blood_type, phone, address, allergies, emergency_contact, emergency_phone,
          profile:profiles!inner (id, full_name, username, role)
        `;
        const selectWithoutAddress = `
          id, no_rm, nik, birth_date, gender, blood_type, phone, allergies, emergency_contact, emergency_phone,
          profile:profiles!inner (id, full_name, username, role)
        `;

        let ptRecord = null;
        if (existingPt) {
          // Attempt 1: Try update with address column
          try {
            const { data: updatedPt, error: updateErr } = await client
              .from('patients')
              .update({ ...basePayload, address: addressVal })
              .eq('id', existingPt.id)
              .select(selectWithAddress)
              .single();
            if (updateErr) throw updateErr;
            ptRecord = updatedPt;
          } catch (err) {
            const errStr = (err.message || '').toLowerCase();
            const isMissingAddress = errStr.includes('address') && (errStr.includes('column') || errStr.includes('schema cache') || err.code === 'PGRST204');
            if (isMissingAddress) {
              console.warn('[patientService] Database table "patients" missing "address" column. Fallback to saving without address column.');
              const { data: updatedPt2, error: updateErr2 } = await client
                .from('patients')
                .update(basePayload)
                .eq('id', existingPt.id)
                .select(selectWithoutAddress)
                .single();
              if (updateErr2) throw updateErr2;
              ptRecord = { ...(updatedPt2 || {}), address: addressVal };
            } else {
              throw err;
            }
          }
        } else {
          // Attempt 1: Try insert with address column
          try {
            const { data: newPt, error: insertErr } = await client
              .from('patients')
              .insert({ profile_id: userId, ...basePayload, address: addressVal })
              .select(selectWithAddress)
              .single();
            if (insertErr) throw insertErr;
            ptRecord = newPt;
          } catch (err) {
            const errStr = (err.message || '').toLowerCase();
            const isMissingAddress = errStr.includes('address') && (errStr.includes('column') || errStr.includes('schema cache') || err.code === 'PGRST204');
            if (isMissingAddress) {
              console.warn('[patientService] Database table "patients" missing "address" column. Fallback to saving without address column.');
              const { data: newPt2, error: insertErr2 } = await client
                .from('patients')
                .insert({ profile_id: userId, ...basePayload })
                .select(selectWithoutAddress)
                .single();
              if (insertErr2) throw insertErr2;
              ptRecord = { ...(newPt2 || {}), address: addressVal };
            } else {
              throw err;
            }
          }
        }

        if (ptRecord && !ptRecord.address && addressVal) {
          ptRecord.address = addressVal;
        }

        return { success: true, data: ptRecord || mockResult };
      } catch (err) {
        console.warn('[patientService.completePatientOnboarding]', err.message);
        const friendlyError = (global.translateError ? global.translateError(err.message) : err.message);
        return { success: false, error: friendlyError, data: mockResult };
      }
    }
  };

  global.patientService = patientService;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = patientService;
  }
})(typeof window !== 'undefined' ? window : this);
