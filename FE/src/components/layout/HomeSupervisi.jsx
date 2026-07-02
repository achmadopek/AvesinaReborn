import { useEffect, useState } from "react";
import { Card, Row, Col, Badge, Spinner, Table } from "react-bootstrap";

import { fetchDashboardSupervisi } from "../../api/wj_supervisi/DashboardSupervisi";

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

      setDashboard(res.data.data);
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

      <Card className="mb-3 shadow-sm">
        <Card.Header>Home Supervisi</Card.Header>
        <Card.Body>
          {/* ========================================= */}
          {/* RINGKASAN EKSEKUTIF */}
          {/* ========================================= */}

          <Card className="mb-3">
            <Card.Header>Ringkasan Eksekutif</Card.Header>

            <Card.Body>
              <div
                dangerouslySetInnerHTML={{
                  __html: eksekutif?.ringkasan_eksekutif || "-",
                }}
              />
            </Card.Body>
          </Card>

          <div className="row">
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
                            <th>{igd?.pasien_total}</th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr>
                            <td>Pasien Lama</td>
                            <td>{igd?.pasien_igd_lama}</td>
                          </tr>

                          <tr>
                            <td>Pasien Baru</td>
                            <td>{igd?.pasien_igd_baru}</td>
                          </tr>

                          <tr>
                            <td>Pasien Masuk Ranap</td>
                            <td>{igd?.pasien_rawat_inap}</td>
                          </tr>

                          <tr>
                            <td>Sisa Pasien IGD</td>
                            <td>{igd?.pasien_igd_sisa}</td>
                          </tr>

                          <tr>
                            <td>Kematian IGD &lt; 6 Jam</td>
                            <td>{igd?.kematian_igd_6_jam}</td>
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
                            <th>{ibs?.pasien_ibs_total}</th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr>
                            <td>Emergency</td>
                            <td>{ibs?.emergency}</td>
                          </tr>

                          <tr>
                            <td>Urgency</td>
                            <td>{ibs?.urgency}</td>
                          </tr>

                          <tr>
                            <td>Elektif</td>
                            <td>{ibs?.elektif}</td>
                          </tr>

                          <tr>
                            <td>Operasi Besar</td>
                            <td>{ibs?.operasi_besar}</td>
                          </tr>

                          <tr>
                            <td>Operasi Sedang</td>
                            <td>{ibs?.operasi_sedang}</td>
                          </tr>

                          <tr>
                            <td>Operasi Khusus</td>
                            <td>{ibs?.operasi_khusus}</td>
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
                            <th>{hd?.pasien_hd_total}</th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr>
                            <td>Pasien Reguler</td>
                            <td>{hd?.pasien_reguler}</td>
                          </tr>

                          <tr>
                            <td>Pasien Isolasi</td>
                            <td>{hd?.pasien_isolasi}</td>
                          </tr>

                          <tr>
                            <td>CAPD</td>
                            <td>{hd?.capd}</td>
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
                            <td>{mutu?.keluhan_pasien}</td>
                          </tr>

                          <tr>
                            <td>Insiden Keselamatan</td>
                            <td>{mutu?.insiden_keselamatan}</td>
                          </tr>

                          <tr>
                            <td>Kejadian Sentinel</td>
                            <td>{mutu?.kejadian_sentinel}</td>
                          </tr>

                          <tr>
                            <td>Infeksi Nosokomial</td>
                            <td>{mutu?.infeksi_nosokomial}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            <div className="col-md-9">
              <Col md={12}>
                {" "}
                {/* KENDALA */}
                <Card>
                  <Card.Header>Kebutuhan & Kendala Utama</Card.Header>

                  <Card.Body>
                    <h6>Kebutuhan</h6>

                    <div
                      dangerouslySetInnerHTML={{
                        __html: kendala?.kebutuhan_utama || "-",
                      }}
                    />

                    <hr />

                    <h6>Kendala</h6>

                    <div
                      dangerouslySetInnerHTML={{
                        __html: kendala?.kendala_utama || "-",
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>

              <Col md={12}>
                {/* FOKUS DIREKSI */}

                <Card className="mt-3">
                  <Card.Header>Fokus Perhatian Direksi Hari Ini</Card.Header>

                  <Card.Body>
                    {fokusDireksi?.map((item, idx) => (
                      <div key={idx} className="mb-2">
                        <Badge bg="danger">{item.prioritas}</Badge>

                        <span className="ms-2 fw-bold">{item.judul}</span>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>

              {/* RENCANA AKSI */}

              <Col md={12}>
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
                        {rencanaAksi?.map((item) => (
                          <tr key={item.direksi_plan_id}>
                            <td>{item.issue_judul}</td>
                            <td>{item.uraian_tindakan}</td>
                            <td>{item.pic}</td>
                            <td>{item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </div>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default HomeSupervisi;
