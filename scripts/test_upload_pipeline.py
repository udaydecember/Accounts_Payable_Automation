import sys
import os
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_pipeline():
    # 1. Login as Maker
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "maker@enterprise.com", "password": "Password@123"}
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload sample PDF
    with open("sample_invoices/invoice_acme_valve_po8801.pdf", "rb") as f:
        upload_resp = client.post(
            "/api/v1/invoices/upload",
            headers=headers,
            files={"files": ("invoice_acme_valve_po8801.pdf", f, "application/pdf")},
            data={"source": "Manual_Upload"}
        )
    assert upload_resp.status_code == 200
    invoices = upload_resp.json()
    assert len(invoices) == 1
    inv = invoices[0]
    print(f"Uploaded Invoice ID: {inv['id']}, Number: {inv['invoice_number']}, Status: {inv['status']}")
    print(f"Total Amount: {inv['total_amount']}, Currency: {inv['currency']}")

    # 3. Verify OCR Extraction details
    assert len(inv["extractions"]) > 0
    extraction = inv["extractions"][0]
    print(f"OCR Confidence: {extraction['overall_confidence']}")
    print(f"Extracted field count: {len(extraction['field_values'])}")

    # 4. Check 3-Way Matching result
    match_resp = client.get(f"/api/v1/matching/{inv['id']}", headers=headers)
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    if match_data:
        print(f"3-Way Match Status: {match_data['match_status']}, Type: {match_data['match_type']}")

    print("End-to-End Invoice Pipeline verification passed successfully!")

if __name__ == "__main__":
    test_pipeline()
