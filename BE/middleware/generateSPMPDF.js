const db = require("../db/connection-lokal");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const generateSPMPDF = async (
    harian,
    details,
    unit_id,
    created_by,
    unitName,
    username,
    clientIP,
    hostname,
    userAgent
) => {

    const logoKiri = path.join(__dirname, "../assets/logo-pemkab.png");
    const logoKanan = path.join(__dirname, "../assets/logo-rsud.png");

    const [rows] = await db.promise().query(`
        SELECT 
            ind.judul_indikator,
            ind.measurement,
            d.numerator_value,
            d.denominator_value,
            d.final_value,
            d.is_meet_standard,

            g.id as group_id,
            g.nama_group

            FROM spm_harian_detail d

            JOIN spm_indikator ind 
            ON ind.id = d.indikator_id

            JOIN spm_group_pelayanan g
            ON g.id = ind.group_pelayanan_id

            WHERE d.harian_id = ?
            ORDER BY g.id, ind.id
    `, [harian.id]);

    const grouped = {};

    rows.forEach(r => {
        if (!grouped[r.group_id]) {
            grouped[r.group_id] = {
                nama_group: r.nama_group,
                items: []
            };
        }

        grouped[r.group_id].items.push(r);
    });

    return new Promise(async (resolve, reject) => {

        const fileName = `spm_${harian.id}.pdf`;
        const filePath = path.join(__dirname, "../uploads/spm", fileName);

        const doc = new PDFDocument({ margin: 40 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        /* =========================
           HEADER
        ========================= */

        if (fs.existsSync(logoKiri)) {
            doc.image(logoKiri, 40, 30, { width: 60 });
        }

        if (fs.existsSync(logoKanan)) {
            doc.image(logoKanan, 500, 30, { width: 60 });
        }

        doc
            .fontSize(14)
            .text("UOBK RSUD WALUYO JATI KAB. PROBOLINGGO", 0, 40, {
                align: "center"
            });

        doc
            .fontSize(12)
            .text("LAPORAN SPM HARIAN UNIT", {
                align: "center"
            });

        doc.moveDown(2);

        /* =========================
           INFO UNIT
        ========================= */

        const infoY = doc.y + 40;

        doc.fontSize(10);

        doc.text(`Unit : ${unitName}`, 40, infoY);
        doc.text(`Tanggal : ${harian.tgl_input}`, 40, infoY + 15);
        doc.text(`Petugas : ${username}`, 40, infoY + 30);
        doc.text(`Waktu Input : ${new Date().toLocaleString()}`, 40, infoY + 45);

        doc.moveDown();

        /* =========================
           HEADER TABEL
        ========================= */

        const tableTop = doc.y + 10;

        const colNo = 40;
        const colInd = 70;
        const colNum = 360;
        const colDen = 410;
        const colSat = 460;
        const colStat = 510;

        doc.fontSize(9).font("Helvetica-Bold");

        doc.text("No", colNo, tableTop);
        doc.text("Indikator", colInd, tableTop);
        doc.text("Num", colNum, tableTop);
        doc.text("Den", colDen, tableTop);
        doc.text("Sat", colSat, tableTop);
        doc.text("Status", colStat, tableTop);

        doc.moveTo(40, tableTop + 12)
            .lineTo(550, tableTop + 12)
            .stroke();

        /* =========================
           ISI TABEL
        ========================= */

        let y = tableTop + 20;

        doc.font("Helvetica");

        let nomorGlobal = 1;

        Object.values(grouped).forEach((group, gIndex) => {

            // ======================
            // JUDUL GROUP
            // ======================
            if (y + 20 > 700) {
                doc.addPage();
                y = 60;
            }

            doc
                .font("Helvetica-Bold")
                .fontSize(11)
                .text(`${gIndex + 1}.   ${group.nama_group}`, 40, y);

            y += 20;

            doc.font("Helvetica");

            // ======================
            // ISI INDIKATOR
            // ======================
            group.items.forEach((r, i) => {

                const indikatorHeight = doc.heightOfString(r.judul_indikator, {
                    width: 270
                });

                const rowHeight = Math.max(indikatorHeight, 15);

                if (y + rowHeight > 700) {
                    doc.addPage();
                    y = 60;
                }

                doc.fillColor(r.is_meet_standard ? "black" : "red");

                doc.text(nomorGlobal++, colNo, y);

                doc.text(r.judul_indikator, colInd, y, {
                    width: 270
                });

                doc.text(Number(r.numerator_value), colNum, y);
                doc.text(Number(r.denominator_value), colDen, y);
                doc.text(r.measurement, colSat, y);

                doc.text(
                    r.is_meet_standard ? "Memenuhi" : "Belum",
                    colStat,
                    y
                );

                y += rowHeight + 5;

            });

            y += 10; // jarak antar group
        });

        /* =========================
           QR VALIDASI
        ========================= */

        const qrText = `${process.env.BASE_URL}/api/spm/EntriSPMHarian/download/${harian.id}`;
        const qrImage = await QRCode.toDataURL(qrText);

        const bottomY = Math.max(y + 20, 50);

        doc.image(qrImage, 35, bottomY, { width: 80 });
        doc.fontSize(8).text("QR Validasi", 40, bottomY + 85);

        /* =========================
           TANDA TANGAN
        ========================= */

        doc.fontSize(10);

        doc.text("Petugas Input", 420, bottomY + 10);

        doc.moveTo(420, bottomY + 55)
            .lineTo(550, bottomY + 55)
            .stroke();

        doc.text(username, 420, bottomY + 60);

        /* =========================
           FOOTER
        ========================= */

        const footerY = doc.page.height - doc.page.margins.bottom - 50;

        doc.fontSize(8)
            .text(
                "Dokumen ini dihasilkan otomatis oleh Sistem SPM Rumah Sakit",
                0,
                footerY,
                { align: "center" }
            );

        doc.end();

        stream.on("finish", () => resolve(fileName));
        stream.on("error", reject);

    });

};

module.exports = generateSPMPDF;