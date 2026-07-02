import { useEffect, useState } from "react";
import { Card, Row, Col, Badge, Spinner, Table } from "react-bootstrap";

import { fetchDashboardSupervisi } from "../../../api/wj_supervisi/DashboardSupervisi";

const HomeSupervisi = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const res = await fetchDashboardSupervisi();

      console.log("DATA", res);

      setDashboard(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        {" "}
        <Spinner />{" "}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <Card.Body>Belum ada data supervisi.</Card.Body>{" "}
      </Card>
    );
  }

  const {
    supervisi,
    kpi,
    igd,
    hd,
    ibs,
    mutu,
    kendala,
    eksekutif,
    applicareSummary,
    applicareList,
    kunjunganRajal,
    kunjunganIGD,
    pasienRawatInap,
    ttTersedia,
    distribusiTT,
    rajalMJKN,
    rajalOnsite,
    igdMRS,
    igdSisa,
    inapAdmisi,
    inapKRS,
    fokusDireksi,
    rencanaAksi,
  } = dashboard;

  const formatNumber = (value, decimals = 0) => {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "0";
    }
    return decimals > 0 ? number.toFixed(decimals) : String(Math.round(number));
  };

  const getBorStatus = (borValue) => {
    if (borValue >= 100) {
      return { label: "Over Capacity", variant: "dark" };
    }
    if (borValue >= 90) {
      return { label: "Kritis", variant: "danger" };
    }
    if (borValue >= 80) {
      return { label: "Waspada", variant: "warning" };
    }
    return { label: "Aman", variant: "success" };
  };

  const color_status = (bor_status) => {
    if (bor_status === "Aman") {
      return "success";
    }
    if (bor_status === "Waspada") {
      return "warning";
    }
    if (bor_status === "Kritis") {
      return "danger";
    }
    return "dark";
  };

  const borValue = Number(applicareSummary?.bor || 0);
  const borStatus = getBorStatus(borValue);

  const cardValue = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  return (
    <>
      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <Card
        className="mb-3 text-center border-0"
        style={{
          fontFamily: '"Arial Narrow", Arial, sans-serif',
          backgroundColor: "#fdfbf7",
        }}
      >
        <Card.Body className="border-0 pt-0 pb-1">
          <div className="container-fluid">
            <div className="row align-items-center">
              {/* 1. KIRI: LOGO PEMKAB & LOGO RS BERDAMPINGAN */}
              <div className="col-2 d-flex align-items-center justify-content-center gap-3">
                {/* Logo Pemkab Probolinggo */}
                <div className="text-center" style={{ minWidth: "85px" }}>
                  <img
                    src="../../../../public/logo-pemkab.png"
                    alt="Logo Pemkab Probolinggo"
                    style={{ maxHeight: "100px", width: "auto" }}
                    className="img-fluid"
                  />
                  <div
                    className="fw-bold mt-1 text-uppercase"
                    style={{
                      fontSize: "0.75rem",
                      color: "#111",
                      lineHeight: "1.2",
                    }}
                  >
                    Pemerintah
                    <br />
                    Kabupaten Probolinggo
                  </div>
                </div>
              </div>

              {/* 2. TENGAH: TEKS JUDUL UTAMA */}
              <div className="col-5 text-center">
                {/* Baris 1: HOSPITAL LEADER'S... */}
                <h3
                  className="fw-bold mb-1"
                  style={{
                    fontSize: "1.9rem",
                    letterSpacing: "0.5px",
                    color: "#111",
                    lineHeight: "0.9",
                  }}
                >
                  HOSPITAL LEADER'S DAILY PLAYBOOK
                </h3>

                {/* Baris 2: RSUD WALUYO JATI */}
                <h1
                  className="fw-black mb-2"
                  style={{
                    fontSize: "3.6rem",
                    fontWeight: "900",
                    color: "#133825",
                    transform: "scaleX(0.95)",
                    letterSpacing: "-1px",
                    lineHeight: "0.9",
                  }}
                >
                  RSUD WALUYO JATI
                </h1>

                {/* Baris 3: WJ SMART BUGARR... */}
                <h4
                  className="fw-normal mb-3"
                  style={{
                    color: "#b86200",
                    fontSize: "1.25rem",
                    lineHeight: "0.9",
                  }}
                >
                  WJ SMART BUGARR – Hospital Command Center
                </h4>

                {/* Baris 4: Satu Data... */}
                <p
                  className="fw-bold text-muted mb-0"
                  style={{
                    fontSize: "0.95rem",
                    color: "#222",
                    lineHeight: "1.4",
                  }}
                >
                  Satu Data • Satu Dashboard • Satu Aksi untuk Pelayanan yang
                  Lebih Baik
                </p>
              </div>

              {/* 3. PALING KANAN: FOTO DIREKTUR */}
              <div className="col-4 text-start ">
                {/* Logo RSUD Waluyo Jati */}
                <div className="text-start">
                  <img
                    src="../../../../public/logo-rsud.png"
                    alt="Logo RSUD Waluyo Jati"
                    style={{
                      maxHeight: "120px",
                      width: "auto",
                      marginLeft: "40px",
                    }}
                    className="img-fluid"
                  />
                </div>

                <div
                  className="text-center"
                  style={{
                    position: "absolute",
                    top: "0px",
                    bottom: "0px",
                    padding: "0px",
                    margin: "0px",
                    right: "10px",
                    width: "auto",
                    height: "330px",
                    border: "3px solid #fff",
                    zIndex: 2,
                  }}
                >
                  <img
                    src="../../../../public/yessy.png"
                    alt="Foto Direktur"
                    style={{
                      maxHeight: "100%",
                      width: "auto",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    className="fw-bold mt-1 text-center"
                    style={{
                      fontSize: "0.8rem",
                      color: "#111",
                      lineHeight: "1.2",
                    }}
                  >
                    Direktur
                    <br />
                    Dr. dr. H. Yessy Rahmawati, Sp.OG(K), M.H., M.Kes., FISQua,
                    FCHMC
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ========================================= */}
      {/* BEDGE RINGKASAN */}
      {/* ========================================= */}

      <Row className="g-3 mb-3">
        <Col md={3}>
          <Card className="h-100">
            <Card.Header className="text-center">
              BED OCCUPANCY RATE (BOR)
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <h1 style={{ fontSize: "4rem" }}>
                  {formatNumber(borValue, 2)}
                </h1>
                %
              </div>
            </Card.Body>
            <Card.Footer className="text-center">
              <Badge
                bg={borStatus.variant}
                text={borStatus.variant === "warning" ? "dark" : "light"}
              >
                Status : {borStatus.label}
              </Badge>
            </Card.Footer>
          </Card>
        </Col>

        <Col md={1}>
          <Card className="h-100">
            <Card.Header className="text-center">KUNJUNGAN RAJAL</Card.Header>
            <Card.Body>
              <div className="text-center">
                <h1>{cardValue(kunjunganRajal)}</h1>
                <div>Pasien</div>
              </div>
            </Card.Body>
            <Card.Footer className="text-center">
              <Badge bg="secondary">
                {cardValue(rajalMJKN)} MJKN | {cardValue(rajalOnsite)} Onsite
              </Badge>
            </Card.Footer>
          </Card>
        </Col>

        <Col md={1}>
          <Card className="h-100">
            <Card.Header className="text-center">KUNJUNGAN IGD</Card.Header>
            <Card.Body>
              <div className="text-center">
                <h1>{cardValue(kunjunganIGD)}</h1>
                <div>Pasien</div>
              </div>
            </Card.Body>
            <Card.Footer className="text-center">
              <Badge bg="danger">
                {cardValue(igdMRS)} MRS | {cardValue(igdSisa)} Sisa
              </Badge>
            </Card.Footer>
          </Card>
        </Col>

        <Col md={1}>
          <Card className="h-100">
            <Card.Header className="text-center">PASIEN RAWAT INAP</Card.Header>
            <Card.Body>
              <div className="text-center">
                <h1>{cardValue(pasienRawatInap)}</h1>
                <div>Pasien</div>
              </div>
            </Card.Body>
            <Card.Footer className="text-center">
              <Badge bg="success">
                {cardValue(inapAdmisi)} Admisi | {cardValue(inapKRS)} KRS
              </Badge>
            </Card.Footer>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100">
            <Card.Header className="text-center">
              TEMPAT TIDUR TERSEDIA
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <h1 style={{ fontSize: "4rem" }}>{cardValue(ttTersedia)}</h1>Bed
              </div>
            </Card.Body>
            <Card.Footer className="text-center">
              <Badge bg="success">
                Distribusi TT : {cardValue(distribusiTT)}
              </Badge>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* ========================================= */}
      {/* RINGKASAN EKSEKUTIF */}
      {/* ========================================= */}

      <Card className="mb-3">
        <Card.Header>Ringkasan Eksekutif</Card.Header>

        <Card.Body>
          {eksekutif?.detail?.length > 0 ? (
            eksekutif.detail.map((item, idx) => (
              <div
                key={idx}
                className="mb-2"
                style={{ whiteSpace: "pre-line" }}
              >
                {item.uraian}
              </div>
            ))
          ) : (
            <span className="text-muted">Belum ada ringkasan eksekutif</span>
          )}
        </Card.Body>
      </Card>

      <div className="row">
        <div className="col-md-9">
          {/* ========================================= */}
          {/* APPLICARE TABEL */}
          {/* ========================================= */}
          <Card className="mb-3">
            <Card.Header>Detail Applicare / Ketersediaan Kamar</Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table size="sm" bordered>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ruang</th>
                      <th className="text-center">Kapasitas</th>
                      <th className="text-center">Terisi</th>
                      <th className="text-center">Tersedia</th>
                      <th className="text-center">BOR</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(applicareList) &&
                    applicareList.length > 0 ? (
                      applicareList.map((item, index) => (
                        <tr key={`${item.koderuang || index}-${index}`}>
                          <td>{index + 1}</td>
                          <td>{item.namaruang}</td>
                          <td className="text-center">{item.kapasitas}</td>
                          <td className="text-center">{item.terisi}</td>
                          <td className="text-center">{item.tersedia}</td>
                          <td className="text-center">{item.bor}</td>
                          <td className="text-center">
                            <Badge bg={color_status(item.bor_status)}>
                              {item.bor_status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          Tidak ada data applicare.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="text-muted text-end px-3 py-3">
              <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                <div>
                  <Badge bg="success">HIJAU</Badge>
                  <small className="ms-2">Kurang dari 80% Aman</small>
                </div>
                <div>
                  <Badge bg="warning">KUNING</Badge>
                  <small className="ms-2">80-90% Waspada</small>
                </div>
                <div>
                  <Badge bg="danger">MERAH</Badge>
                  <small className="ms-2">Diatas 90% Kritis</small>
                </div>
                <div>
                  <Badge bg="dark">OVER</Badge>
                  <small className="ms-2">100%+ Over Capacity</small>
                </div>
              </div>

              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-center">
                <div>
                  <strong>Total Kapasitas:</strong>{" "}
                  {cardValue(applicareSummary?.total_kapasitas)} TT
                </div>
                <div>
                  <strong>Terisi:</strong>{" "}
                  {cardValue(applicareSummary?.total_terisi)} TT
                </div>
                <div>
                  <strong>Sisa:</strong>{" "}
                  {cardValue(applicareSummary?.total_tersedia)} TT
                </div>
                <div>
                  <strong>Distribusi TT:</strong> xxx
                </div>
              </div>
            </Card.Footer>
          </Card>
        </div>

        <div className="col-md-3">
          <Row className="g-3">
            {/* ========================================= */}
            {/* IGD */}
            {/* ========================================= */}
            <Col md={12}>
              <Card>
                <Card.Header>A. IGD & Rawat Inap</Card.Header>

                <Card.Body>
                  <Table size="sm" bordered>
                    <thead>
                      <tr>
                        <th>Total Pasien IGD</th>
                        <th width="50" className="text-center">
                          {igd?.pasien_total}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td>Pasien Lama</td>
                        <td className="text-center">{igd?.pasien_igd_lama}</td>
                      </tr>

                      <tr>
                        <td>Pasien Baru</td>
                        <td className="text-center">{igd?.pasien_igd_baru}</td>
                      </tr>

                      <tr>
                        <td>Pasien Masuk Ranap</td>
                        <td className="text-center">
                          {igd?.pasien_rawat_inap}
                        </td>
                      </tr>

                      <tr>
                        <td>Sisa Pasien IGD</td>
                        <td className="text-center">{igd?.pasien_igd_sisa}</td>
                      </tr>

                      <tr>
                        <td>Kematian IGD &lt; 6 Jam</td>
                        <td className="text-center">
                          {igd?.kematian_igd_6_jam}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* IBS */}

            <Col md={12}>
              <Card>
                <Card.Header>B. Instalasi Bedah Sentral</Card.Header>

                <Card.Body>
                  <Table size="sm" bordered>
                    <thead>
                      <tr>
                        <th>Total Pasien IBS</th>
                        <th width="50" className="text-center">
                          {ibs?.pasien_ibs_total}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td>Emergency</td>
                        <td className="text-center">{ibs?.emergency}</td>
                      </tr>

                      <tr>
                        <td>Urgency</td>
                        <td className="text-center">{ibs?.urgency}</td>
                      </tr>

                      <tr>
                        <td>Elektif</td>
                        <td className="text-center">{ibs?.elektif}</td>
                      </tr>

                      <tr>
                        <td>Operasi Besar</td>
                        <td className="text-center">{ibs?.operasi_besar}</td>
                      </tr>

                      <tr>
                        <td>Operasi Sedang</td>
                        <td className="text-center">{ibs?.operasi_sedang}</td>
                      </tr>

                      <tr>
                        <td>Operasi Khusus</td>
                        <td className="text-center">{ibs?.operasi_khusus}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* HD */}

            <Col md={12}>
              <Card>
                <Card.Header>C. Hemodialisa</Card.Header>

                <Card.Body>
                  <Table size="sm" bordered>
                    <thead>
                      <tr>
                        <th>Total Pasien HD</th>
                        <th width="50" className="text-center">
                          {hd?.pasien_hd_total}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td>Pasien Reguler</td>
                        <td className="text-center">{hd?.pasien_reguler}</td>
                      </tr>

                      <tr>
                        <td>Pasien Isolasi</td>
                        <td className="text-center">{hd?.pasien_isolasi}</td>
                      </tr>

                      <tr>
                        <td>CAPD</td>
                        <td className="text-center">{hd?.capd}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* MUTU */}

            <Col md={12}>
              <Card>
                <Card.Header>D. Data Mutu & Keselamatan Pasien</Card.Header>

                <Card.Body>
                  <Table size="sm" bordered>
                    <tbody>
                      <tr>
                        <td>Keluhan Pasien</td>
                        <td width="50" className="text-center">
                          {mutu?.keluhan_pasien}
                        </td>
                      </tr>

                      <tr>
                        <td>Insiden Keselamatan</td>
                        <td className="text-center">
                          {mutu?.insiden_keselamatan}
                        </td>
                      </tr>

                      <tr>
                        <td>Kejadian Sentinel</td>
                        <td className="text-center">
                          {mutu?.kejadian_sentinel}
                        </td>
                      </tr>

                      <tr>
                        <td>Infeksi Nosokomial</td>
                        <td className="text-center">
                          {mutu?.infeksi_nosokomial}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4">
          {" "}
          {/* KENDALA */}
          <Card className="mt-3">
            <Card.Header>Kebutuhan & Kendala Utama</Card.Header>

            <Card.Body>
              <h6>Kebutuhan</h6>

              {kendala?.kebutuhan_detail?.length > 0 ? (
                <ul className="mb-0 ps-3">
                  {kendala.kebutuhan_detail.map((item, idx) => (
                    <li key={idx} style={{ whiteSpace: "pre-line" }}>
                      {item.uraian}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted">Belum ada kebutuhan</span>
              )}

              <hr />

              <h6>Kendala</h6>

              {kendala?.kendala_detail?.length > 0 ? (
                <ul className="mb-0 ps-3">
                  {kendala.kendala_detail.map((item, idx) => (
                    <li key={idx} style={{ whiteSpace: "pre-line" }}>
                      {item.uraian}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted">Belum ada kendala</span>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-4">
          {/* FOKUS DIREKSI */}

          <Card className="mt-3">
            <Card.Header>Fokus Perhatian Direksi Hari Ini</Card.Header>

            <Card.Body>
              {fokusDireksi?.length > 0 ? (
                fokusDireksi.map((item, idx) => (
                  <div key={idx} className="mb-2">
                    <Badge bg="danger">{item.prioritas}</Badge>

                    <span className="ms-2 fw-bold">{item.judul}</span>

                    {item.uraian && (
                      <div
                        className="small text-muted mt-1"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {item.uraian}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-muted">
                  Tidak ada fokus direksi hari ini
                </span>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* RENCANA AKSI */}

        <div className="col-md-4">
          <Card className="mt-3 mb-4">
            <Card.Header>Rencana Aksi Cepat</Card.Header>

            <Card.Body>
              <Table bordered hover>
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Tindakan</th>
                    <th>PIC</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {rencanaAksi?.length > 0 ? (
                    rencanaAksi.map((item) => (
                      <tr key={item.direksi_plan_id}>
                        <td>{item.issue_judul}</td>
                        <td>{item.uraian_tindakan}</td>
                        <td>{item.pic}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        Belum ada rencana aksi
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </div>
      </div>
    </>
  );
};

export default HomeSupervisi;
