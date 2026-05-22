/**
 * parserpdf.js
 *
 * Direct UPSERT PDF SPM Harian ke:
 * - spm_harian
 * - spm_harian_detail
 *
 * Pakai koneksi:
 * ./db/koneksi-lokal.js
 *
 * Install:
 * pnpm add pdf-parse mysql2 dotenv
 *
 * Jalankan 1 PDF:
 * pnpm exec node parserpdf.js --pdf=/uploads/spm/spm_904.pdf
 *
 * Jalankan 1 folder:
 * pnpm exec node parserpdf.js --dir=/uploads/spm
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');

let pdfParseLegacy = null;
let PDFParseClass = null;
let CanvasFactory = null;

try {
  const pdfParseModule = require('pdf-parse');

  if (typeof pdfParseModule === 'function') {
    pdfParseLegacy = pdfParseModule;
  } else if (typeof pdfParseModule.default === 'function') {
    pdfParseLegacy = pdfParseModule.default;
  } else if (pdfParseModule.PDFParse) {
    PDFParseClass = pdfParseModule.PDFParse;
  }
} catch (error) {
  throw new Error(`Gagal load pdf-parse: ${error.message}`);
}

try {
  const workerModule = require('pdf-parse/worker');
  CanvasFactory = workerModule.CanvasFactory || null;
} catch (error) {
  CanvasFactory = null;
}

const db2 = require('./db/connection-lokal');
const db = db2.promise();

/**
 * ============================================================
 * CONFIG
 * ============================================================
 */

const DEFAULT_DIR = path.join(process.cwd(), 'uploads', 'spm');

/**
 * Data lama kamu menyimpan pdf_path seperti:
 * spm_52.pdf
 *
 * Jadi default basename.
 */
const PDF_PATH_STYLE = process.env.SPM_PDF_PATH_STYLE || 'basename';

/**
 * Kalau existing:
 * - replace = update header + hapus detail lama + insert detail baru
 * - skip    = lewati kalau sudah ada
 */
const EXISTING_MODE = process.env.SPM_EXISTING_MODE || 'replace';

/**
 * Default false supaya kalau ada data existing yang sudah diverifikasi,
 * status verifikasinya tidak direset.
 *
 * Kalau mau reset saat import ulang:
 * SPM_RESET_VERIFICATION_ON_UPSERT=1
 */
const RESET_VERIFICATION =
  String(process.env.SPM_RESET_VERIFICATION_ON_UPSERT || '0') === '1';

/**
 * Default NULL karena data restore kamu bagian status_verifikasi kosong.
 */
const DEFAULT_STATUS_VERIFIKASI =
  process.env.SPM_DEFAULT_STATUS_VERIFIKASI !== undefined
    ? process.env.SPM_DEFAULT_STATUS_VERIFIKASI
    : null;

/**
 * ============================================================
 * CLI ARGUMENT
 * ============================================================
 */

function getArg(name, defaultValue = null) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));

  if (!found) return defaultValue;

  return found.slice(prefix.length);
}

/**
 * ============================================================
 * BASIC HELPER
 * ============================================================
 */

function normalizeBasic(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,:;'"`]/g, '')
    .trim();
}

function normalizeUnitName(value) {
  return normalizeBasic(value)
    .replace(/\bspesialis\b/g, '')
    .replace(/\bpoliklinik\b/g, 'poli')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Alias nama unit.
 *
 * KIRI  = nama yang mungkin muncul di PDF
 * KANAN = nama yang ada di tabel spm_unit
 */
const UNIT_NAME_ALIASES = {
    [normalizeUnitName('POLI SPESIALIS KEBIDANAN & KANDUNGAN')]: 'POLI OBGYN',
    [normalizeUnitName('POLI OBGYN')]: 'POLI OBGYN',
  
    [normalizeUnitName('POLI SPESIALIS PENYAKIT DALAM')]: 'POLI DALAM',
    [normalizeUnitName('POLI DALAM')]: 'POLI DALAM',
  
    [normalizeUnitName('POLI ORTHOPEDI (SPESIALIS BEDAH TULANG)')]: 'POLI ORTHOPEDI',
    [normalizeUnitName('POLI ORTHOPEDI')]: 'POLI ORTHOPEDI',
  
    [normalizeUnitName('INSTALASI REHABILITASI MEDIK')]: 'INST. REHABILITASI MEDIK',
    [normalizeUnitName('INST. REHABILITASI MEDIK')]: 'INST. REHABILITASI MEDIK',
    [normalizeUnitName('INST REHABILITASI MEDIK')]: 'INST. REHABILITASI MEDIK',
  };

function normalizeIndicatorName(value) {
  return normalizeBasic(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPdfText(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function parseNumber(value) {
  const number = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

function findOne(text, regex, label) {
  const match = text.match(regex);

  if (!match) {
    throw new Error(`Data "${label}" tidak ditemukan di PDF.`);
  }

  return match[1].trim();
}

function parsePdfDateTime(value) {
  if (!value) return null;

  const match = String(value).match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2})[.:](\d{1,2})[.:](\d{1,2})/
  );

  if (!match) return null;

  const [, d, m, y, h, i, s] = match;

  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} ${h.padStart(2, '0')}:${i.padStart(2, '0')}:${s.padStart(2, '0')}`;
}

function nowMysql() {
  const date = new Date();

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const i = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');

  return `${y}-${m}-${d} ${h}:${i}:${s}`;
}

function resolvePdfAbsolutePath(inputPath) {
  if (!inputPath) {
    throw new Error('Path PDF kosong.');
  }

  let finalPath = inputPath;

  if (inputPath.startsWith('/uploads/')) {
    finalPath = path.join(process.cwd(), inputPath.replace(/^\/+/, ''));
  } else if (inputPath.startsWith('uploads/')) {
    finalPath = path.join(process.cwd(), inputPath);
  } else if (!path.isAbsolute(inputPath)) {
    finalPath = path.resolve(process.cwd(), inputPath);
  }

  if (!fs.existsSync(finalPath)) {
    throw new Error(`File PDF tidak ditemukan: ${finalPath}`);
  }

  if (path.extname(finalPath).toLowerCase() !== '.pdf') {
    throw new Error(`File bukan PDF: ${finalPath}`);
  }

  return finalPath;
}

function resolveDir(inputDir) {
  let dir = inputDir || DEFAULT_DIR;

  if (dir.startsWith('/uploads/')) {
    dir = path.join(process.cwd(), dir.replace(/^\/+/, ''));
  } else if (dir.startsWith('uploads/')) {
    dir = path.join(process.cwd(), dir);
  } else if (!path.isAbsolute(dir)) {
    dir = path.resolve(process.cwd(), dir);
  }

  if (!fs.existsSync(dir)) {
    throw new Error(`Folder tidak ditemukan: ${dir}`);
  }

  return dir;
}

function getPdfFilesFromDir(inputDir) {
  const dir = resolveDir(inputDir);

  return fs
    .readdirSync(dir)
    .filter((file) => path.extname(file).toLowerCase() === '.pdf')
    .map((file) => path.join(dir, file))
    .sort((a, b) => {
      const statA = fs.statSync(a);
      const statB = fs.statSync(b);

      /**
       * Urut dari file lama ke baru.
       * Kalau ada PDF edit yang lebih baru untuk unit + tanggal sama,
       * file terbaru akan menimpa detail lama.
       */
      return statA.mtimeMs - statB.mtimeMs;
    });
}

function pdfPathForDb(absolutePath) {
  const fileName = path.basename(absolutePath);

  if (PDF_PATH_STYLE === 'full') {
    return `/uploads/spm/${fileName}`;
  }

  return fileName;
}

/**
 * ============================================================
 * PDF PARSER
 * ============================================================
 */

async function readPdfText(filePath) {
    const buffer = await fs.promises.readFile(filePath);
  
    /**
     * Support pdf-parse versi lama:
     * const pdfParse = require('pdf-parse');
     * await pdfParse(buffer)
     */
    if (pdfParseLegacy) {
      const result = await pdfParseLegacy(buffer);
      return cleanPdfText(result.text || '');
    }
  
    /**
     * Support pdf-parse versi baru:
     * const { PDFParse } = require('pdf-parse');
     * const parser = new PDFParse({ data: buffer });
     * const result = await parser.getText();
     */
    if (PDFParseClass) {
      const parserOptions = CanvasFactory
        ? { data: buffer, CanvasFactory }
        : { data: buffer };
  
      const parser = new PDFParseClass(parserOptions);
  
      try {
        const result = await parser.getText();
        return cleanPdfText(result.text || '');
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      }
    }
  
    throw new Error(
      'Format module pdf-parse tidak dikenali. Coba install versi lama: pnpm add pdf-parse@1.1.1'
    );
  }

function calculateFinalValue(numerator, denominator, satuan) {
  const num = Number(numerator);
  const den = Number(denominator);
  const sat = String(satuan || '').trim().toLowerCase();

  if (num === 0 && den === 0) {
    return null;
  }

  if (den === 0) {
    return null;
  }

  if (sat === '%') {
    return Number(((num / den) * 100).toFixed(2));
  }

  /**
   * Untuk satuan Menit, Jam, Hari, dll.
   * Contoh data lama:
   * 100 / 10 = 10.00
   */
  return Number((num / den).toFixed(2));
}

function parseIsMeetStandard(status, numerator, denominator) {
  if (Number(numerator) === 0 && Number(denominator) === 0) {
    return null;
  }

  const normalized = normalizeBasic(status);

  if (normalized === 'memenuhi') return 1;
  if (normalized === 'belum') return 0;
  if (normalized === 'tidak memenuhi') return 0;
  if (normalized === 'tidakmemenuhi') return 0;

  return null;
}

function parseSpmPdfText(text) {
  const cleanText = cleanPdfText(text);

  const unitName = findOne(cleanText, /^Unit\s*:\s*(.+)$/im, 'Unit');

  const tglInput = findOne(
    cleanText,
    /^Tanggal\s*:\s*(\d{4}-\d{2}-\d{2})$/im,
    'Tanggal'
  );

  const petugas =
    (cleanText.match(/^Petugas\s*:\s*(.+)$/im) || [])[1]?.trim() || null;

  const waktuInputRaw =
    (cleanText.match(/^Waktu\s*Input\s*:\s*(.+)$/im) || [])[1]?.trim() || null;

  const waktuInputMysql = parsePdfDateTime(waktuInputRaw);

  const lines = cleanText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let headerIndex = lines.findIndex((line) =>
    /^no\s+indikator\s+num\s+den\s+sat\s+status$/i.test(line)
  );

  if (headerIndex === -1) {
    headerIndex = lines.findIndex((line) => /^status$/i.test(line));
  }

  if (headerIndex === -1) {
    throw new Error('Header tabel indikator tidak ditemukan.');
  }

  let footerIndex = lines.findIndex((line) => /^QR\s+Validasi$/i.test(line));

  if (footerIndex === -1) {
    footerIndex = lines.findIndex((line) =>
      /Dokumen ini dihasilkan otomatis/i.test(line)
    );
  }

  const tableLines = lines
    .slice(headerIndex + 1, footerIndex === -1 ? lines.length : footerIndex)
    .filter((line) => {
      /**
       * Buang judul group:
       * 1. Pelayanan Rawat Jalan
       */
      return !/^\d+\.\s+/.test(line);
    });

  const tableText = tableLines.join(' ').replace(/\s+/g, ' ').trim();

  const details = [];

  const rowRegex =
    /(?:^|\s)(\d+)\s+(.+?)\s+(-?\d+(?:[.,]\d+)?)\s+(-?\d+(?:[.,]\d+)?)\s+([A-Za-z%/]+(?:\s+[A-Za-z%/]+)?)\s+(Tidak\s+Memenuhi|Memenuhi|Belum)(?=\s+\d+\s+|$)/gi;

  let match;

  while ((match = rowRegex.exec(tableText)) !== null) {
    const no = Number(match[1]);

    const judulIndikatorPdf = String(match[2] || '')
      .replace(/\s+/g, ' ')
      .trim();

    const numeratorValue = parseNumber(match[3]);
    const denominatorValue = parseNumber(match[4]);
    const satuan = String(match[5] || '').trim();
    const statusPdf = String(match[6] || '').trim();

    if (!judulIndikatorPdf || numeratorValue === null || denominatorValue === null) {
      continue;
    }

    details.push({
      no,
      judul_indikator_pdf: judulIndikatorPdf,
      numerator_value: numeratorValue,
      denominator_value: denominatorValue,
      satuan,
      status_pdf: statusPdf,
      final_value: calculateFinalValue(numeratorValue, denominatorValue, satuan),
      is_meet_standard: parseIsMeetStandard(
        statusPdf,
        numeratorValue,
        denominatorValue
      ),
    });
  }

  if (!details.length) {
    throw new Error('Detail indikator tidak berhasil dibaca dari PDF.');
  }

  return {
    unit_name: unitName,
    tgl_input: tglInput,
    petugas,
    waktu_input_raw: waktuInputRaw,
    waktu_input_mysql: waktuInputMysql,
    details,
  };
}

/**
 * ============================================================
 * DB RESOLVER
 * ============================================================
 */

async function resolveUnit(unitName) {
    /**
     * 1. Coba exact match nama dari PDF.
     */
    const [exactRows] = await db.query(
      `
        SELECT 
          id,
          instalasi_id,
          bidang_id,
          group_pelayanan_id,
          nama_unit,
          kode_unit,
          srvc_unit_id,
          kepala_unit,
          status,
          user_id,
          created_at,
          updated_at
        FROM spm_unit
        WHERE LOWER(TRIM(nama_unit)) = LOWER(TRIM(?))
        LIMIT 1
      `,
      [unitName]
    );
  
    if (exactRows.length) {
      return exactRows[0];
    }
  
    /**
     * 2. Coba pakai alias.
     * Contoh PDF: POLI SPESIALIS PENYAKIT DALAM
     * Dicari ke DB sebagai: POLI DALAM
     */
    const normalizedPdfUnit = normalizeUnitName(unitName);
    const aliasDbName = UNIT_NAME_ALIASES[normalizedPdfUnit];
  
    if (aliasDbName) {
      const [aliasRows] = await db.query(
        `
          SELECT 
            id,
            instalasi_id,
            bidang_id,
            group_pelayanan_id,
            nama_unit,
            kode_unit,
            srvc_unit_id,
            kepala_unit,
            status,
            user_id,
            created_at,
            updated_at
          FROM spm_unit
          WHERE LOWER(TRIM(nama_unit)) = LOWER(TRIM(?))
          LIMIT 1
        `,
        [aliasDbName]
      );
  
      if (aliasRows.length) {
        return aliasRows[0];
      }
  
      throw new Error(
        `Alias unit ditemukan "${unitName}" => "${aliasDbName}", tapi "${aliasDbName}" tidak ada di tabel spm_unit.`
      );
    }
  
    /**
     * 3. Fallback normalisasi semua unit.
     */
    const [units] = await db.query(
      `
        SELECT 
          id,
          instalasi_id,
          bidang_id,
          group_pelayanan_id,
          nama_unit,
          kode_unit,
          srvc_unit_id,
          kepala_unit,
          status,
          user_id,
          created_at,
          updated_at
        FROM spm_unit
      `
    );
  
    const found = units.find((unit) => {
      return normalizeUnitName(unit.nama_unit) === normalizedPdfUnit;
    });
  
    if (found) {
      return found;
    }
  
    /**
     * 4. Fallback mirip.
     */
    const similar = units
      .filter((unit) => {
        const dbName = normalizeUnitName(unit.nama_unit);
  
        return (
          dbName.includes(normalizedPdfUnit) ||
          normalizedPdfUnit.includes(dbName)
        );
      })
      .map((unit) => unit.nama_unit);
  
    throw new Error(
      [
        `Unit tidak ditemukan: "${unitName}".`,
        similar.length ? `Mirip: ${similar.join(', ')}` : null,
        'Kalau ini nama lama/baru, tambahkan ke UNIT_NAME_ALIASES.',
      ]
        .filter(Boolean)
        .join(' ')
    );
  }

async function resolveCreatedBy(createdByArg, petugasPdf, unit) {
  if (createdByArg) {
    return Number(createdByArg);
  }

  if (process.env.SPM_DEFAULT_CREATED_BY) {
    return Number(process.env.SPM_DEFAULT_CREATED_BY);
  }

  if (petugasPdf) {
    try {
      const [users] = await db.query(
        `
          SELECT id
          FROM users
          WHERE username = ?
             OR name = ?
             OR email = ?
          LIMIT 1
        `,
        [petugasPdf, petugasPdf, petugasPdf]
      );

      if (users.length) {
        return users[0].id;
      }
    } catch (error) {
      /**
       * Abaikan kalau struktur tabel users berbeda.
       */
    }
  }

  if (unit && unit.user_id) {
    return Number(unit.user_id);
  }

  return null;
}

async function resolveIndicator(detail, unit) {
  const judulPdf = detail.judul_indikator_pdf;

  const [exactRows] = await db.query(
    `
      SELECT
        id,
        group_pelayanan_id,
        judul_indikator,
        numerator,
        denominator,
        measurement,
        operator,
        standart,
        status,
        satuan_num,
        satuan_den,
        created_at,
        updated_at
      FROM spm_indikator
      WHERE group_pelayanan_id = ?
        AND LOWER(TRIM(judul_indikator)) = LOWER(TRIM(?))
      LIMIT 1
    `,
    [unit.group_pelayanan_id, judulPdf]
  );

  if (exactRows.length) {
    return exactRows[0];
  }

  const [sameGroupIndicators] = await db.query(
    `
      SELECT
        id,
        group_pelayanan_id,
        judul_indikator,
        numerator,
        denominator,
        measurement,
        operator,
        standart,
        status,
        satuan_num,
        satuan_den,
        created_at,
        updated_at
      FROM spm_indikator
      WHERE group_pelayanan_id = ?
    `,
    [unit.group_pelayanan_id]
  );

  const normalizedPdf = normalizeIndicatorName(judulPdf);

  const normalizedFound = sameGroupIndicators.find((indicator) => {
    return normalizeIndicatorName(indicator.judul_indikator) === normalizedPdf;
  });

  if (normalizedFound) {
    return normalizedFound;
  }

  const containsFound = sameGroupIndicators.find((indicator) => {
    const dbName = normalizeIndicatorName(indicator.judul_indikator);

    return dbName.includes(normalizedPdf) || normalizedPdf.includes(dbName);
  });

  if (containsFound) {
    return containsFound;
  }

  throw new Error(
    [
      `Indikator tidak ditemukan: "${judulPdf}".`,
      `Unit: ${unit.nama_unit}.`,
      `group_pelayanan_id: ${unit.group_pelayanan_id}.`,
    ].join(' ')
  );
}

/**
 * ============================================================
 * UPSERT
 * ============================================================
 */

async function upsertSpmHarian(parsed, absolutePath, createdByArg) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const unit = await resolveUnit(parsed.unit_name);
    const createdBy = await resolveCreatedBy(createdByArg, parsed.petugas, unit);

    const pdfPath = pdfPathForDb(absolutePath);
    const inputAt = parsed.waktu_input_mysql || nowMysql();

    const [existingRows] = await connection.query(
      `
        SELECT id, created_at
        FROM spm_harian
        WHERE unit_id = ?
          AND tgl_input = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      [unit.id, parsed.tgl_input]
    );

    let harianId;
    let mode;
    let detailCreatedAt;

    if (existingRows.length) {
      harianId = existingRows[0].id;

      if (EXISTING_MODE === 'skip') {
        await connection.rollback();

        return {
          skipped: true,
          mode: 'SKIP',
          harianId,
          unit,
          pdfPath,
          totalDetail: 0,
        };
      }

      mode = 'UPDATE';
      detailCreatedAt = existingRows[0].created_at || inputAt;

      if (RESET_VERIFICATION) {
        await connection.query(
          `
            UPDATE spm_harian
            SET
              status_verifikasi = ?,
              catatan_verifikasi = NULL,
              pdf_path = ?,
              verified_by = NULL,
              verified_at = NULL,
              updated_at = ?
            WHERE id = ?
          `,
          [DEFAULT_STATUS_VERIFIKASI, pdfPath, inputAt, harianId]
        );
      } else {
        await connection.query(
          `
            UPDATE spm_harian
            SET
              pdf_path = ?,
              updated_at = ?
            WHERE id = ?
          `,
          [pdfPath, inputAt, harianId]
        );
      }

      await connection.query(
        `
          DELETE FROM spm_harian_detail
          WHERE harian_id = ?
        `,
        [harianId]
      );
    } else {
      mode = 'INSERT';
      detailCreatedAt = inputAt;

      const [insertHeader] = await connection.query(
        `
          INSERT INTO spm_harian
          (
            unit_id,
            tgl_input,
            status_verifikasi,
            catatan_verifikasi,
            pdf_path,
            verified_by,
            verified_at,
            created_by,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, NULL, ?, NULL, NULL, ?, ?, NULL)
        `,
        [
          unit.id,
          parsed.tgl_input,
          DEFAULT_STATUS_VERIFIKASI,
          pdfPath,
          createdBy,
          inputAt,
        ]
      );

      harianId = insertHeader.insertId;
    }

    const detailRows = [];

    for (const detail of parsed.details) {
      const indikator = await resolveIndicator(detail, unit);

      detailRows.push([
        harianId,
        indikator.id,
        detail.numerator_value,
        detail.denominator_value,
        detail.final_value,
        detail.is_meet_standard,
        detailCreatedAt,
        inputAt,
      ]);
    }

    if (detailRows.length) {
      await connection.query(
        `
          INSERT INTO spm_harian_detail
          (
            harian_id,
            indikator_id,
            numerator_value,
            denominator_value,
            final_value,
            is_meet_standard,
            created_at,
            updated_at
          )
          VALUES ?
        `,
        [detailRows]
      );
    }

    await connection.commit();

    return {
      skipped: false,
      mode,
      harianId,
      unit,
      pdfPath,
      totalDetail: detailRows.length,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * ============================================================
 * PROCESS
 * ============================================================
 */

async function processPdf(filePath, createdByArg) {
  const absolutePath = resolvePdfAbsolutePath(filePath);

  const text = await readPdfText(absolutePath);
  const parsed = parseSpmPdfText(text);

  const result = await upsertSpmHarian(parsed, absolutePath, createdByArg);

  return {
    file: absolutePath,
    parsed,
    result,
  };
}

async function main() {
  const pdfArg = getArg('pdf');
  const dirArg = getArg('dir');
  const createdByArg = getArg('created-by');

  let files = [];

  if (pdfArg) {
    files = [pdfArg];
  } else if (dirArg) {
    files = getPdfFilesFromDir(dirArg);
  } else {
    throw new Error(
      [
        'File/folder belum diisi.',
        'Contoh 1 file:',
        'pnpm exec node parserpdf.js --pdf=/uploads/spm/spm_904.pdf',
        '',
        'Contoh 1 folder:',
        'pnpm exec node parserpdf.js --dir=/uploads/spm',
      ].join('\n')
    );
  }

  console.log('=======================================');
  console.log('UPSERT PDF SPM HARIAN');
  console.log('=======================================');
  console.log('Total file     :', files.length);
  console.log('Existing mode  :', EXISTING_MODE);
  console.log('Reset verif    :', RESET_VERIFICATION ? 'YA' : 'TIDAK');
  console.log('PDF path style :', PDF_PATH_STYLE);
  console.log('=======================================\n');

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const output = await processPdf(file, createdByArg);
      const { parsed, result } = output;

      if (result.skipped) {
        skipped++;

        console.log(
          `[SKIP] ${path.basename(output.file)} | ${parsed.tgl_input} | ${result.unit.nama_unit} | harian_id=${result.harianId}`
        );

        continue;
      }

      success++;

      console.log(
        `[${result.mode}] ${path.basename(output.file)} | ${parsed.tgl_input} | ${result.unit.nama_unit} | harian_id=${result.harianId} | detail=${result.totalDetail}`
      );
    } catch (error) {
      failed++;

      console.error(`[GAGAL] ${file}`);
      console.error(`        ${error.message}`);
    }
  }

  console.log('\n=======================================');
  console.log('SELESAI');
  console.log('Berhasil :', success);
  console.log('Skip     :', skipped);
  console.log('Gagal    :', failed);
  console.log('=======================================');

  await db.end();
}

main().catch(async (error) => {
  console.error('\nFATAL ERROR:');
  console.error(error.message);

  try {
    await db.end();
  } catch (closeError) {}

  process.exit(1);
});