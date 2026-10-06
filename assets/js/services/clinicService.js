/**
 * clinicService.js
 * Multi-Clinic Regional Aggregator Service for Kabupaten Purworejo
 * Standar: Permenkes No. 24/2022
 */

(function () {
  'use strict';

  const MOCK_PURWOREJO_CLINICS = [
    {
      id: 'clinic-pwr-01',
      code: 'KLN-PWR-01',
      name: 'Klinik Pratama Sehat Mandiri Purworejo',
      district: 'Purworejo',
      address: 'Jl. Brigjen Katamso No. 42, Pangenrejo, Kec. Purworejo',
      phone: '(0275) 321456',
      operating_hours: '08:00 - 21:00 WIB',
      facilities: ['Poli Umum', 'Poli Gigi', 'Farmasi'],
      latitude: -7.7144,
      longitude: 110.0125,
      is_active: true,
      description: 'Klinik Pratama rawat jalan terpadu di pusat kota Purworejo dengan dokter umum dan spesialis gigi.'
    },
    {
      id: 'clinic-pwr-02',
      code: 'KLN-PWR-02',
      name: 'Klinik Pratama & Bersalin Kutoarjo Medika',
      district: 'Kutoarjo',
      address: 'Jl. Pangeran Diponegoro No. 18, Kec. Kutoarjo',
      phone: '(0275) 641890',
      operating_hours: '24 Jam (UGD) / Poli: 08:00 - 20:00 WIB',
      facilities: ['Poli Umum', 'Poli KIA / Kebidanan', 'Farmasi', 'UGD 24 Jam'],
      latitude: -7.7198,
      longitude: 109.9134,
      is_active: true,
      description: 'Layanan kesehatan keluarga dan persalinan 24 jam melayani wilayah barat Purworejo (Kutoarjo & sekitarnya).'
    },
    {
      id: 'clinic-pwr-03',
      code: 'KLN-PWR-03',
      name: 'Klinik Pratama Keluarga Banyuurip',
      district: 'Banyuurip',
      address: 'Jl. Tentara Pelajar No. 88, Boro Kulon, Kec. Banyuurip',
      phone: '(0275) 325112',
      operating_hours: '08:00 - 17:00 WIB',
      facilities: ['Poli Umum', 'Laboratorium Sederhana', 'Farmasi'],
      latitude: -7.7420,
      longitude: 109.9985,
      is_active: true,
      description: 'Klinik keluarga dengan layanan cek darah cepat, kolesterol, asam urat, dan konsultasi dokter umum.'
    }
  ];

  class ClinicService {
    constructor() {
      this.clinics = [...MOCK_PURWOREJO_CLINICS];
    }

    getSupabase() {
      return (typeof window !== 'undefined' && window.supabaseClient) ? window.supabaseClient : null;
    }

    async getClinics() {
      const sb = this.getSupabase();
      if (sb) {
        try {
          const { data, error } = await sb
            .from('clinics')
            .select('*')
            .eq('is_active', true)
            .order('name');
          if (!error && data && data.length > 0) {
            return data;
          }
        } catch (_) {}
      }
      return [...this.clinics];
    }

    async getClinicsByDistrict(district) {
      const all = await this.getClinics();
      if (!district || district.toLowerCase() === 'all' || district.toLowerCase() === 'semua') {
        return all;
      }
      return all.filter(c => c.district.toLowerCase() === district.toLowerCase().trim());
    }

    async getClinicById(clinicId) {
      const all = await this.getClinics();
      return all.find(c => c.id === clinicId || c.code === clinicId) || all[0];
    }

    async getClinicQueueCount(clinicId) {
      const sb = this.getSupabase();
      if (sb && clinicId) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const { count, error } = await sb
            .from('queue_entries')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId)
            .in('status', ['Menunggu', 'Dipanggil']);
          if (!error && typeof count === 'number') {
            return count;
          }
        } catch (_) {}
      }
      // Demo deterministic estimate: 2-4 patients
      if (clinicId === 'clinic-pwr-01' || clinicId === 'KLN-PWR-01') return 3;
      if (clinicId === 'clinic-pwr-02' || clinicId === 'KLN-PWR-02') return 5;
      return 2;
    }

    calculateDistanceKm(lat1, lon1, lat2, lon2) {
      if (lat1 === lat2 && lon1 === lon2) return 0;
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 10) / 10;
    }

    async getClinicRecommendations(complaint = '', locationContext = {}) {
      const clinics = await this.getClinics();
      const lowerComplaint = String(complaint).toLowerCase();

      let userLat = locationContext.latitude;
      let userLon = locationContext.longitude;
      const districtName = (locationContext.district || '').toLowerCase();

      const DISTRICT_COORDS = {
        'purworejo': { lat: -7.7144, lon: 110.0125 },
        'kutoarjo': { lat: -7.7198, lon: 109.9134 },
        'banyuurip': { lat: -7.7420, lon: 109.9985 }
      };

      if (typeof userLat !== 'number' || typeof userLon !== 'number') {
        if (districtName && DISTRICT_COORDS[districtName]) {
          userLat = DISTRICT_COORDS[districtName].lat;
          userLon = DISTRICT_COORDS[districtName].lon;
        } else {
          userLat = DISTRICT_COORDS['purworejo'].lat;
          userLon = DISTRICT_COORDS['purworejo'].lon;
        }
      }

      const isDental = /gigi|geraham|gusi|tambal|cabut gigi|karang gigi/i.test(lowerComplaint);
      const isMaternalOrUgd = /hamil|kandungan|persalinan|melahirkan|kia|bidan|ugd 24|malam|tengah malam/i.test(lowerComplaint);
      const isLab = /darah|kolesterol|asam urat|lab|gula darah|tensi/i.test(lowerComplaint);

      const scoredClinics = [];

      for (const clinic of clinics) {
        const queueCount = await this.getClinicQueueCount(clinic.id);
        const waitMinsPerPatient = 12;
        const estimatedWaitMinutes = queueCount * waitMinsPerPatient;
        const distanceKm = this.calculateDistanceKm(userLat, userLon, clinic.latitude, clinic.longitude);

        let matchScore = 100;

        if (isDental) {
          if (clinic.facilities.some(f => /gigi/i.test(f))) {
            matchScore += 200;
          } else {
            matchScore -= 100;
          }
        } else if (isMaternalOrUgd) {
          if (clinic.facilities.some(f => /kia|kebidanan|ugd 24/i.test(f))) {
            matchScore += 200;
          }
        } else if (isLab) {
          if (clinic.facilities.some(f => /laboratorium|lab/i.test(f))) {
            matchScore += 150;
          }
        }

        matchScore -= (distanceKm * 5);
        matchScore -= (queueCount * 8);

        if (districtName && clinic.district.toLowerCase() === districtName) {
          matchScore += 50;
        }

        scoredClinics.push({
          clinic,
          queueCount,
          estimatedWaitMinutes,
          distanceKm,
          matchScore
        });
      }

      scoredClinics.sort((a, b) => b.matchScore - a.matchScore);
      return scoredClinics;
    }

    async getClinicServices(clinicId) {
      const clinic = await this.getClinicById(clinicId);
      return clinic ? clinic.facilities : ['Poli Umum', 'Farmasi'];
    }
  }

  const clinicService = new ClinicService();

  // Helper context generator for AI Chatbot
  async function getClinicsContextForAi() {
    const clinics = await clinicService.getClinics();
    const result = [];
    for (const c of clinics) {
      const queueCount = await clinicService.getClinicQueueCount(c.id);
      result.push({
        id: c.id,
        code: c.code,
        name: c.name,
        district: c.district,
        address: c.address,
        operating_hours: c.operating_hours,
        services: c.facilities,
        latitude: c.latitude,
        longitude: c.longitude,
        active_queue_count: queueCount,
        description: c.description || ''
      });
    }
    return result;
  }

  if (typeof window !== 'undefined') {
    window.clinicService = clinicService;
    window.getClinicsContextForAi = getClinicsContextForAi;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { clinicService, getClinicsContextForAi, MOCK_PURWOREJO_CLINICS };
  }
})();
