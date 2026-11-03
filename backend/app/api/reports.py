import io
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
import pandas as pd

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user
from backend.app.models.auth import User
from backend.app.models.invoice import Invoice, InvoiceException
from backend.app.models.vendor import Vendor

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/aging")
def get_aging_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    invoices = db.query(Invoice).filter(Invoice.status != "Paid").all()
    records = []
    for inv in invoices:
        days = (today - inv.invoice_date).days
        bal = float(inv.total_amount - inv.amount_paid)
        records.append({
            "invoice_number": inv.invoice_number,
            "vendor_name": inv.vendor_name_raw or (inv.vendor.vendor_name if inv.vendor else "Unknown"),
            "invoice_date": str(inv.invoice_date),
            "due_date": str(inv.due_date or inv.invoice_date),
            "days_overdue": max(0, days - 30),
            "total_amount": float(inv.total_amount),
            "balance_due": bal,
            "bucket": "0-30 days" if days <= 30 else ("31-60 days" if days <= 60 else ("61-90 days" if days <= 90 else "90+ days"))
        })
    return records

@router.get("/tax")
def get_tax_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoices = db.query(Invoice).all()
    records = []
    for inv in invoices:
        records.append({
            "invoice_number": inv.invoice_number,
            "vendor_name": inv.vendor_name_raw or "Unknown",
            "gstin": inv.vendor_gstin or "N/A",
            "taxable_amount": float(inv.taxable_amount),
            "cgst": float(inv.cgst_amount),
            "sgst": float(inv.sgst_amount),
            "igst": float(inv.igst_amount),
            "total_tax": float(inv.total_tax_amount),
            "total_amount": float(inv.total_amount),
            "invoice_date": str(inv.invoice_date)
        })
    return records

@router.get("/exceptions")
def get_exceptions_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exceptions = db.query(InvoiceException).order_by(InvoiceException.created_at.desc()).all()
    records = []
    for exc in exceptions:
        inv = exc.invoice
        records.append({
            "exception_id": exc.id,
            "invoice_number": inv.invoice_number if inv else "N/A",
            "rule_code": exc.rule_code,
            "severity": exc.severity,
            "message": exc.message,
            "is_resolved": exc.is_resolved,
            "resolution_comments": exc.resolution_comments,
            "created_at": str(exc.created_at)
        })
    return records

@router.get("/export/{report_type}")
def export_report(
    report_type: str,
    format: str = Query("csv", pattern="^(csv|excel)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if report_type == "aging":
        data = get_aging_report(db, current_user)
        filename = f"ap_aging_report_{date.today().isoformat()}"
    elif report_type == "tax":
        data = get_tax_report(db, current_user)
        filename = f"gst_tax_report_{date.today().isoformat()}"
    elif report_type == "exceptions":
        data = get_exceptions_report(db, current_user)
        filename = f"ap_exceptions_report_{date.today().isoformat()}"
    else:
        # Default invoices status report
        invoices = db.query(Invoice).all()
        data = [
            {
                "Invoice Number": i.invoice_number,
                "Vendor": i.vendor_name_raw,
                "Date": str(i.invoice_date),
                "Total Amount": float(i.total_amount),
                "Paid Amount": float(i.amount_paid),
                "Status": i.status
            }
            for i in invoices
        ]
        filename = f"invoice_status_report_{date.today().isoformat()}"

    df = pd.DataFrame(data)

    if format == "csv":
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Report")
        excel_bytes = output.getvalue()
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
        )
