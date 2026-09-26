/**
 * SIMKLINIK - Queue Service
 * Manages daily clinic queues, status transitions, and patient wait time metrics.
 */
(function (global) {
  'use strict';

  function getClient() {
    return global.supabaseClient || (typeof window !== 'undefined' ? window.supabaseClient : null);
  }

  const queueService = {
    /**
     * Get queue list for today
     */
    async getTodayQueue(serviceId = null) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        let query = client
          .from('queue_entries')
          .select(`
            id,
            queue_number,
            status,
            queue_date,
            created_at,
            called_at,
            served_at,
            completed_at,
            service:services (id, code, name),
            patient:patients!inner (
              id,
              no_rm,
              profile:profiles!inner (full_name, phone)
            ),
            doctor:doctors (
              id,
              specialization,
              profile:profiles (full_name)
            )
          `)
          .eq('queue_date', todayStr)
          .order('queue_number', { ascending: true });

        if (serviceId) {
          query = query.eq('service_id', serviceId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data: data || [] };
      } catch (err) {
        console.warn('[queueService.getTodayQueue]', err.message);
        return { success: false, error: err.message, data: [] };
      }
    },

    /**
     * Update queue status (CALLED, SERVING, COMPLETED, CANCELLED)
     */
    async updateQueueStatus(queueId, newStatus) {
      const client = getClient();
      if (!client) return { success: false, error: 'Database client not initialized' };

      try {
        const STATUS_MAP = {
          'WAITING': 'Menunggu',
          'CALLED': 'Dipanggil',
          'SERVING': 'Dilayani',
          'COMPLETED': 'Selesai',
          'CANCELLED': 'Batal',
          'Menunggu': 'Menunggu',
          'Dipanggil': 'Dipanggil',
          'Dilayani': 'Dilayani',
          'Selesai': 'Selesai',
          'Batal': 'Batal'
        };

        const dbStatus = STATUS_MAP[newStatus] || newStatus;
        const updatePayload = { status: dbStatus };
        const nowIso = new Date().toISOString();

        if (dbStatus === 'Dipanggil') {
          updatePayload.called_at = nowIso;
        }

        const { data, error } = await client
          .from('queue_entries')
          .update(updatePayload)
          .eq('id', queueId)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        console.warn('[queueService.updateQueueStatus]', err.message);
        return { success: false, error: err.message };
      }
    },

    /**
     * Get patient's active queue entry today
     */
    async getPatientActiveQueue(patientId) {
      const client = getClient();
      if (!client) return { success: false, data: null };

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await client
          .from('queue_entries')
          .select(`
            id,
            queue_number,
            status,
            service:services (name),
            doctor:doctors (
              profile:profiles (full_name)
            )
          `)
          .eq('patient_id', patientId)
          .eq('queue_date', todayStr)
          .in('status', ['WAITING', 'CALLED', 'SERVING'])
          .order('queue_number', { ascending: true })
          .maybeSingle();

        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        console.warn('[queueService.getPatientActiveQueue]', err.message);
        return { success: false, error: err.message, data: null };
      }
    }
  };

  global.queueService = queueService;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = queueService;
  }
})(typeof window !== 'undefined' ? window : this);
