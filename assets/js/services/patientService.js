/**
 * SIMKLINIK - Patient Service
 * Handles patient profile, health details, search, and walk-in registration.
 */
(function (global) {
  'use strict';

  function getClient() {
    return global.supabaseClient || (typeof window !== 'undefined' ? window.supabaseClient : null);
  }

  const patientService = {
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
        return { success: true, data };
      } catch (err) {
        console.warn('[patientService.getPatientProfile]', err.message);
        return { success: false, error: err.message };
      }
    },

    /**
     * Update patient self-reported health profile
     */
    async updateHealthProfile(patientId, fields) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

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

        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        console.warn('[patientService.updateHealthProfile]', err.message);
        return { success: false, error: err.message };
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
              id, no_rm, nik, birth_date, gender, blood_type, allergies,
              profile:profiles!inner (full_name, phone, address)
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
            id, no_rm, nik, birth_date, gender, blood_type, allergies,
            profile:profiles!inner (full_name, phone, address)
          `)
          .or(`no_rm.ilike.%${trimmed}%,nik.ilike.%${trimmed}%`)
          .limit(20);

        if (error) throw error;
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[patientService.searchPatients]', err.message);
        return { success: false, error: err.message, data: [] };
      }
    },

    /**
     * Register a new walk-in patient (Petugas role)
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
        const { data: patient, error: patientErr } = await client
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

        if (patientErr) throw patientErr;
        return { success: true, data: patient };
      } catch (err) {
        console.warn('[patientService.registerPatient]', err.message);
        return { success: false, error: err.message };
      }
    }
  };

  global.patientService = patientService;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = patientService;
  }
})(typeof window !== 'undefined' ? window : this);
