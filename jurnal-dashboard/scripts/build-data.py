#!/usr/bin/env python3
"""
Mengubah "JURNAL HARIAN DINI SAFFANAH 2026.xlsx" (hasil gabungan, satu sheet
per bulan: TANGGAL|HARI|JAM MASUK|JAM PULANG|NO|DAILY WORK PLAN|CEKLIST|
TIME SCHEDULE|KETERANGAN|JUMLAH FOTO, header di baris 3, data mulai baris 4)
menjadi satu dataset JSON yang dikonsumsi dashboard (src/data/jurnal-data.json).

Jalankan ulang setiap kali ada bulan baru digabungkan:
    python3 scripts/build-data.py <path-ke-xlsx>
"""
import json
import sys
from datetime import datetime, date

import openpyxl

MONTH_LABEL_ID = {
    1: "Januari", 2: "Februari", 3: "Maret", 4: "April", 5: "Mei", 6: "Juni",
    7: "Juli", 8: "Agustus", 9: "September", 10: "Oktober", 11: "November", 12: "Desember",
}
MONTH_NAMES_UPPER = {v.upper() for v in MONTH_LABEL_ID.values()}
PLACEHOLDER_TASK = "(TIDAK ADA DATA)"


def parse_hhmm(s):
    if not s or not isinstance(s, str) or ":" not in s:
        return None
    try:
        h, m = s.split(":")
        return int(h) + int(m) / 60
    except ValueError:
        return None


def parse_month_sheet(ws):
    tasks = []
    r = 4
    while True:
        tgl = ws.cell(r, 1).value
        if tgl is None:
            break
        if isinstance(tgl, datetime):
            tgl_date = tgl.date()
        elif isinstance(tgl, date):
            tgl_date = tgl
        else:
            r += 1
            continue
        hari = ws.cell(r, 2).value
        jam_masuk = ws.cell(r, 3).value
        jam_pulang = ws.cell(r, 4).value
        no = ws.cell(r, 5).value
        plan = ws.cell(r, 6).value
        ceklist = ws.cell(r, 7).value
        jadwal = ws.cell(r, 8).value
        keterangan = ws.cell(r, 9).value
        jumlah_foto = ws.cell(r, 10).value
        tasks.append({
            "tanggal": tgl_date.isoformat(),
            "hari": hari,
            "jamMasuk": jam_masuk,
            "jamPulang": jam_pulang,
            "no": no,
            "tugas": plan,
            "selesai": ceklist is True,
            "jadwal": jadwal,
            "keterangan": keterangan,
            "jumlahFoto": int(jumlah_foto) if jumlah_foto else 0,
        })
        r += 1
    return tasks


def build_days(all_tasks):
    by_date = {}
    for t in all_tasks:
        by_date.setdefault(t["tanggal"], []).append(t)

    days = []
    for tgl, items in by_date.items():
        real_items = [t for t in items if t["tugas"] and str(t["tugas"]).strip().upper() != PLACEHOLDER_TASK]
        total = len(real_items)
        selesai = sum(1 for t in real_items if t["selesai"])
        jam_masuk_h = parse_hhmm(items[0]["jamMasuk"])
        jam_pulang_h = parse_hhmm(items[0]["jamPulang"])
        durasi = None
        if jam_masuk_h is not None and jam_pulang_h is not None and jam_pulang_h >= jam_masuk_h:
            durasi = round(jam_pulang_h - jam_masuk_h, 2)
        days.append({
            "tanggal": tgl,
            "hari": items[0]["hari"],
            "jamMasuk": items[0]["jamMasuk"],
            "jamPulang": items[0]["jamPulang"],
            "jamKerjaJam": durasi,
            "totalTugas": total,
            "selesai": selesai,
            "pctSelesai": round(selesai / total, 4) if total else None,
            "jumlahFoto": items[0]["jumlahFoto"],
        })
    days.sort(key=lambda d: d["tanggal"])
    return days


def build_months(days):
    by_month = {}
    for d in days:
        y, m, _ = d["tanggal"].split("-")
        code = f"{y}-{m}"
        by_month.setdefault(code, []).append(d)

    months = []
    for code in sorted(by_month.keys()):
        items = by_month[code]
        y, m = code.split("-")
        total_tugas = sum(d["totalTugas"] for d in items)
        selesai = sum(d["selesai"] for d in items)
        jam_list = [d["jamKerjaJam"] for d in items if d["jamKerjaJam"] is not None]
        months.append({
            "code": code,
            "label": f"{MONTH_LABEL_ID[int(m)]} {y}",
            "hariTercatat": len(items),
            "totalTugas": total_tugas,
            "selesai": selesai,
            "pctSelesai": round(selesai / total_tugas, 4) if total_tugas else None,
            "rataJamKerja": round(sum(jam_list) / len(jam_list), 2) if jam_list else None,
            "totalFoto": sum(d["jumlahFoto"] for d in items),
        })
    return months


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "JURNAL HARIAN DINI SAFFANAH 2026.xlsx"
    wb = openpyxl.load_workbook(src, data_only=True)

    all_tasks = []
    for sn in wb.sheetnames:
        base = sn.strip().upper()
        if base.endswith(" FOTO") or base not in MONTH_NAMES_UPPER:
            continue
        all_tasks.extend(parse_month_sheet(wb[sn]))

    real_tasks = [t for t in all_tasks if t["tugas"] and str(t["tugas"]).strip().upper() != PLACEHOLDER_TASK]
    days = build_days(all_tasks)
    months = build_months(days)

    total_tugas = len(real_tasks)
    total_selesai = sum(1 for t in real_tasks if t["selesai"])
    jam_list = [d["jamKerjaJam"] for d in days if d["jamKerjaJam"] is not None]
    tanggal_list = [d["tanggal"] for d in days]

    dataset = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "sourceFile": src.split("/")[-1],
        "months": months,
        "days": days,
        "tasks": real_tasks,
        "totalHariTercatat": len(days),
        "totalTugas": total_tugas,
        "totalSelesai": total_selesai,
        "pctSelesaiKeseluruhan": round(total_selesai / total_tugas, 4) if total_tugas else None,
        "totalFoto": sum(d["jumlahFoto"] for d in days),
        "rataJamKerjaKeseluruhan": round(sum(jam_list) / len(jam_list), 2) if jam_list else None,
        "rentangTanggal": {
            "mulai": min(tanggal_list) if tanggal_list else None,
            "akhir": max(tanggal_list) if tanggal_list else None,
        },
    }

    out_path = "src/data/jurnal-data.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"wrote {out_path}")
    print(f"  bulan: {len(months)}")
    print(f"  hari tercatat: {len(days)}")
    print(f"  total tugas: {total_tugas} (selesai {total_selesai})")


if __name__ == "__main__":
    main()
