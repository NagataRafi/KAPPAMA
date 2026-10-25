export interface OrgLeader {
  id: string;
  position: 'pembina' | 'penasihat' | 'ketua' | 'wakil_ketua_umum';
  positionLabel: string;
  name: string;
  campusStudy: string;
  photoUrl: string;
  sortOrder: number;
}

export interface OrgPeriod {
  id: string;
  periodLabel: string;
  startYear: number;
  endYear: number;
  isCurrent: boolean;
  leaders: OrgLeader[];
}

export interface BylawsVersion {
  id: string;
  title: string;
  effectiveDate: string;
  fileUrl: string;
  fileSize: string;
  isActive: boolean;
}

export interface ProgramItem {
  id: string;
  title: string;
  slug: string;
  year: number;
  eventDate: string;
  location: string;
  summary: string;
  description: string;
  objectives: string[];
  targets: string;
  picName: string;
  coverImage: string;
  universityName?: string;
  photos: { url: string; caption: string }[];
  youtubeId?: string;
  status: 'published';
}

export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  year: number;
  eventDate: string;
  description: string;
  coverImage: string;
  photos: { url: string; caption: string }[];
  youtubeId?: string;
}

// 1. Data Organisasi & Profil
export const dummyOrgProfile = {
  aboutText:
    'KAPPAMA (Keluarga Pelajar Pacitan di Malang) adalah organisasi mahasiswa daerah yang mewadahi para pelajar dan mahasiswa asal Pacitan, Jawa Timur, yang sedang menempuh studi di Kota Malang.',
  historyText:
    '[Placeholder - Menunggu Teks Resmi Pengurus: Sejarah singkat berdirinya KAPPAMA di Kota Malang beserta momentum musyawarah besar dan perkembangannya].',
  vision:
    'Terwujudnya Keluarga Pelajar Pacitan di Malang yang solid, berkarakter, unggul secara akademik dan sosial, serta berkontribusi nyata bagi kemajuan Kabupaten Pacitan.',
  missions: [
    'Menjalin dan mempererat tali silaturahmi serta rasa kekeluargaan antarpelajar dan mahasiswa Pacitan di Malang.',
    'Mewadahi pengembangan potensi akademik, kepemimpinan, dan kreativitas anggota.',
    'Membangun sinergi jejaring antar-mahasiswa aktif dan alumni di berbagai perguruan tinggi dan sektor profesi.',
    'Melaksanakan program pengabdian masyarakat dan kontribusi pemikiran untuk pembangunan daerah Kabupaten Pacitan.',
  ],
  contact: {
    email: 'kappama.malang@gmail.com [Placeholder]',
    instagram: '@kappama_malang [Placeholder]',
    address: 'Sekretariat KAPPAMA: Kota Malang, Jawa Timur [Placeholder]',
  },
};

// 2. Data Struktur Organisasi Per Periode
export const dummyOrgPeriods: OrgPeriod[] = [
  {
    id: 'period-2026-2027',
    periodLabel: '2026/2027 (Periode Aktif)',
    startYear: 2026,
    endYear: 2027,
    isCurrent: true,
    leaders: [
      {
        id: 'l-1',
        position: 'pembina',
        positionLabel: 'Pembina',
        name: '[Placeholder - Nama Pembina]',
        campusStudy: 'Alumni KAPPAMA / Dosen Universitas Brawijaya',
        photoUrl: '',
        sortOrder: 1,
      },
      {
        id: 'l-2',
        position: 'penasihat',
        positionLabel: 'Penasihat',
        name: '[Placeholder - Nama Penasihat]',
        campusStudy: 'Alumni KAPPAMA / Tokoh Masyarakat Pacitan di Malang',
        photoUrl: '',
        sortOrder: 2,
      },
      {
        id: 'l-3',
        position: 'ketua',
        positionLabel: 'Ketua Umum',
        name: '[Placeholder - Nama Ketua Umum]',
        campusStudy: 'Universitas Brawijaya · Ilmu Hukum 2023',
        photoUrl: '',
        sortOrder: 3,
      },
      {
        id: 'l-4',
        position: 'wakil_ketua_umum',
        positionLabel: 'Wakil Ketua Umum',
        name: '[Placeholder - Nama Wakil Ketua Umum]',
        campusStudy: 'Universitas Negeri Malang · Pendidikan Teknik Informatika 2023',
        photoUrl: '',
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'period-2025-2026',
    periodLabel: '2025/2026',
    startYear: 2025,
    endYear: 2026,
    isCurrent: false,
    leaders: [
      {
        id: 'l-5',
        position: 'pembina',
        positionLabel: 'Pembina',
        name: '[Placeholder - Nama Pembina Demisioner]',
        campusStudy: 'Alumni KAPPAMA',
        photoUrl: '',
        sortOrder: 1,
      },
      {
        id: 'l-6',
        position: 'penasihat',
        positionLabel: 'Penasihat',
        name: '[Placeholder - Nama Penasihat Demisioner]',
        campusStudy: 'Alumni KAPPAMA',
        photoUrl: '',
        sortOrder: 2,
      },
      {
        id: 'l-7',
        position: 'ketua',
        positionLabel: 'Ketua Umum',
        name: '[Placeholder - Nama Ketua Umum 2025]',
        campusStudy: 'Politeknik Negeri Malang · Teknik Sipil 2022',
        photoUrl: '',
        sortOrder: 3,
      },
      {
        id: 'l-8',
        position: 'wakil_ketua_umum',
        positionLabel: 'Wakil Ketua Umum',
        name: '[Placeholder - Nama Wakil Ketua 2025]',
        campusStudy: 'UIN Maulana Malik Ibrahim · Manajemen 2022',
        photoUrl: '',
        sortOrder: 4,
      },
    ],
  },
];

// 3. Data AD/ART
export const dummyBylaws: BylawsVersion[] = [
  {
    id: 'bylaws-v7',
    title: 'Anggaran Dasar & Anggaran Rumah Tangga (AD/ART) KAPPAMA — Hasil Mubes VII',
    effectiveDate: '15 Desember 2025',
    fileUrl: '/docs/ad-art-kappama-sample.pdf',
    fileSize: '1.4 MB',
    isActive: true,
  },
  {
    id: 'bylaws-v6',
    title: 'AD/ART KAPPAMA — Hasil Mubes VI (Periode Sebelumnya)',
    effectiveDate: '10 Desember 2023',
    fileUrl: '/docs/ad-art-kappama-v6.pdf',
    fileSize: '1.2 MB',
    isActive: false,
  },
];

// 4. Data Program Kerja
export const dummyPrograms: ProgramItem[] = [
  {
    id: 'p-1',
    title: 'Penyambutan & Makrab Mahasiswa Baru Pacitan (Makrab KAPPAMA 2026)',
    slug: 'makrab-kappama-2026',
    year: 2026,
    eventDate: '24–25 Oktober 2026',
    location: 'Batu, Jawa Timur',
    summary:
      'Malam keakraban tahunan untuk menyambut mahasiswa baru asal Pacitan di perguruan tinggi Malang guna mempererat tali silaturahmi.',
    description:
      'Makrab KAPPAMA 2026 merupakan agenda tahunan terbesar bidang pengembangan organisasi. Acara ini dirancang untuk memperkenalkan kehidupan kampus di Kota Malang, saling mengenal antarmahasiswa lintas universitas asal 12 kecamatan Pacitan, serta membagikan tips adaptasi perkuliahan.',
    objectives: [
      'Mengenalkan nilai-nilai persaudaraan KAPPAMA kepada mahasiswa baru.',
      'Membantu adaptasi perkuliahan dan kehidupan perantauan di Malang.',
      'Membangun jejaring kolaborasi akademik antarkampus.',
    ],
    targets: 'Seluruh mahasiswa baru asal Pacitan angkatan 2026 di Malang',
    picName: '[Placeholder - Panitia Makrab]',
    coverImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
    universityName: 'Universitas Brawijaya',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
        caption: 'Sesi perkenalan mahasiswa baru lintas kecamatan',
      },
      {
        url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
        caption: 'Diskusi kelompok dan ramah tamah malam keakraban',
      },
    ],
    youtubeId: 'M7lc1UVf-VE', // Sample valid YouTube embed
    status: 'published',
  },
  {
    id: 'p-2',
    title: 'KAPPAMA Goes to School: Sosialisasi Kampus Malang di SMA/SMK Pacitan',
    slug: 'kappama-goes-to-school-2026',
    year: 2026,
    eventDate: '10–15 Januari 2026',
    location: 'SMA / SMK / MA se-Kabupaten Pacitan',
    summary:
      'Roadshow sosialisasi jalur masuk perguruan tinggi negeri dan swasta di Malang, beasiswa, dan tips perkuliahan bagi siswa kelas 12 di Pacitan.',
    description:
      'Program kerja pengabdian daerah yang dilaksanakan secara serentak di berbagai sekolah menengah di 12 kecamatan Pacitan. Anggota KAPPAMA membagikan panduan seleksi SNBP, SNBT, jalur mandiri, dan tips hidup mandiri di perantauan.',
    objectives: [
      'Meningkatkan angka partisipasi kuliah bagi pelajar asal Pacitan.',
      'Memberikan edukasi peluang beasiswa seperti KIP-Kuliah.',
      'Mengenalkan profil berbagai perguruan tinggi di Malang.',
    ],
    targets: 'Siswa kelas 12 SMA/SMK se-Kabupaten Pacitan',
    picName: '[Placeholder - Divisi Hubungan Daerah]',
    coverImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    universityName: 'Universitas Negeri Malang',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
        caption: 'Presentasi jalur seleksi PTN di aula sekolah',
      },
    ],
    status: 'published',
  },
  {
    id: 'p-3',
    title: 'Futsal & Olahraga Bersama KAPPAMA Cup',
    slug: 'kappama-cup-2025',
    year: 2025,
    eventDate: '12 November 2025',
    location: 'Champion Futsal Malang',
    summary: 'Turnamen olahraga persahabatan antar-komisariat kampus dan alumni KAPPAMA.',
    description:
      'Ajang silaturahmi non-formal melalui kompetisi olahraga futsal dan badminton untuk menjaga kebugaran jasmani dan keakraban anggota.',
    objectives: ['Mempererat komunikasi santai antar-mahasiswa dan alumni.'],
    targets: 'Mahasiswa aktif dan alumni KAPPAMA',
    picName: '[Placeholder - Divisi Minat & Bakat]',
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    universityName: 'Politeknik Negeri Malang',
    photos: [],
    status: 'published',
  },
];

// 5. Data Galeri Album
export const dummyAlbums: GalleryAlbum[] = [
  {
    id: 'a-1',
    title: 'Dokumentasi Malam Keakraban (Makrab) KAPPAMA 2026',
    slug: 'album-makrab-2026',
    year: 2026,
    eventDate: 'Oktober 2026',
    description: 'Kumpulan foto dan video keceriaan seluruh mahasiswa baru dan pengurus KAPPAMA.',
    coverImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
        caption: 'Foto bersama pembukaan Makrab 2026',
      },
      {
        url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
        caption: 'Malam api unggun dan pentas seni kedaerahan',
      },
      {
        url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
        caption: 'Senam pagi dan games persaudaraan',
      },
    ],
    youtubeId: 'M7lc1UVf-VE',
  },
  {
    id: 'a-2',
    title: 'Dokumentasi KAPPAMA Goes to School Pacitan 2026',
    slug: 'album-goes-to-school-2026',
    year: 2026,
    eventDate: 'Januari 2026',
    description: 'Dokumentasi kunjungan delegasi mahasiswa KAPPAMA ke berbagai SMA di Pacitan.',
    coverImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
        caption: 'Sesi tanya jawab bersama adik-adik pelajar',
      },
    ],
  },
];

// 6. Data Master Universitas untuk Filter
export const dummyUniversities = [
  'Universitas Brawijaya',
  'Universitas Negeri Malang',
  'UIN Maulana Malik Ibrahim',
  'Politeknik Negeri Malang',
  'Universitas Muhammadiyah Malang',
  'Universitas Islam Malang',
  'Lainnya',
];
