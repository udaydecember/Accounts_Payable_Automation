import os
import io
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.ocr_engine import ocr_engine

client = TestClient(app)

def test_ocr_extraction_sample_invoice():
    pdf_path = "sample_invoices/invoice_ABC-2026-TEST-001.pdf"
    if os.path.exists(pdf_path):
        extracted = ocr_engine.process_document(pdf_path, "invoice_ABC-2026-TEST-001.pdf")
        assert extracted["invoice_number"] == "ABC-2026-TEST-001"
        assert extracted["vendor_gstin"] == "29ABCDE1234F1Z5"
        assert extracted["po_number"] == "PO-1001"
        assert extracted["total_amount"] == 11800.00
        assert extracted["total_tax_amount"] == 1800.00
        assert len(extracted["line_items"]) >= 1

def test_invoice_upload_api():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "maker@enterprise.com", "password": "Password@123"}
    )
    token = login_resp.json()["access_token"]

    fake_pdf = b"%PDF-1.4 mock pdf content for testing validation"
    files = [("files", ("test_upload.pdf", io.BytesIO(fake_pdf), "application/pdf"))]
    resp = client.post(
        "/api/v1/invoices/upload",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "id" in data[0]

def test_invoice_upload_invalid_file_type():
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "maker@enterprise.com", "password": "Password@123"}
    )
    token = login_resp.json()["access_token"]

    files = [("files", ("malicious.exe", io.BytesIO(b"MZ executable"), "application/x-msdownload"))]
    resp = client.post(
        "/api/v1/invoices/upload",
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 400
