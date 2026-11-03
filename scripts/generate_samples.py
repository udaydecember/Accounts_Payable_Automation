import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw, ImageFont

def generate_pdf_invoice(filename, vendor_name, gstin, inv_number, po_number, item_desc, qty, unit_price, total_tax, total_amount, has_gst_conflict=False):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter

    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, vendor_name)
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 68, f"GSTIN / Tax ID: {gstin}")
    c.drawString(50, height - 82, "100 Industrial Parkway, Chicago, IL 60601")

    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(width - 50, height - 50, "TAX INVOICE")
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 50, height - 68, f"Invoice #: {inv_number}")
    c.drawRightString(width - 50, height - 82, "Date: 2026-11-01")
    c.drawRightString(width - 50, height - 96, f"PO Ref: {po_number}")

    # Divider
    c.setLineWidth(1)
    c.line(50, height - 115, width - 50, height - 115)

    # Table Header
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 135, "#")
    c.drawString(80, height - 135, "Item Description")
    c.drawString(300, height - 135, "Qty")
    c.drawString(360, height - 135, "Unit Price")
    c.drawString(440, height - 135, "Tax Rate")
    c.drawRightString(width - 50, height - 135, "Total Amount")

    c.line(50, height - 145, width - 50, height - 145)

    # Line Item
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 165, "1")
    c.drawString(80, height - 165, item_desc)
    c.drawString(300, height - 165, str(qty))
    c.drawString(360, height - 165, f"${unit_price:.2f}")
    c.drawString(440, height - 165, "18.00%")
    c.drawRightString(width - 50, height - 165, f"${total_amount:.2f}")

    # Totals
    c.line(50, height - 220, width - 50, height - 220)
    c.drawString(350, height - 240, "Taxable Subtotal:")
    c.drawRightString(width - 50, height - 240, f"${(total_amount - total_tax):.2f}")

    if has_gst_conflict:
        c.drawString(350, height - 255, "CGST (9%) + SGST (9%):")
        c.drawRightString(width - 50, height - 255, f"${total_tax:.2f}")
        c.drawString(350, height - 270, "IGST Conflict Applied:")
        c.drawRightString(width - 50, height - 270, "$500.00")
    else:
        c.drawString(350, height - 255, "Total Tax (GST 18%):")
        c.drawRightString(width - 50, height - 255, f"${total_tax:.2f}")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(350, height - 290, "Total Amount Payable:")
    c.drawRightString(width - 50, height - 290, f"${total_amount:.2f}")

    # Bank Details Footer
    c.setFont("Helvetica", 9)
    c.drawString(50, 80, "Bank Details: JPMorgan Chase Commercial • Account: 987654321012 • IFSC: CHASUS33XXX")
    c.drawString(50, 65, "Terms: Net 30 days. Payments via ACH/NEFT/RTGS.")

    c.showPage()
    c.save()
    print(f"Generated PDF: {filename}")

def generate_image_invoice(filename):
    img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Draw header text
    draw.text((40, 40), "APEX TECHNOLOGIES INC", fill=(15, 23, 42))
    draw.text((40, 65), "GSTIN: 29AAACA2100P1ZT", fill=(71, 85, 105))
    draw.text((40, 85), "500 Tech Boulevard, Austin, TX 78701", fill=(71, 85, 105))

    draw.text((550, 40), "INVOICE # INV-2026-IMG01", fill=(15, 23, 42))
    draw.text((550, 65), "Date: 2026-11-01", fill=(71, 85, 105))
    draw.text((550, 85), "PO Ref: PO-2026-9905", fill=(71, 85, 105))

    draw.line([(40, 120), (760, 120)], fill=(203, 213, 225), width=2)

    draw.text((40, 140), "Item: Cloud Compute Rack Module (x4)", fill=(15, 23, 42))
    draw.text((600, 140), "Total: $4800.00", fill=(15, 23, 42))

    draw.line([(40, 200), (760, 200)], fill=(203, 213, 225), width=2)
    draw.text((450, 230), "Taxable Subtotal: $4067.80", fill=(71, 85, 105))
    draw.text((450, 255), "Total GST: $732.20", fill=(71, 85, 105))
    draw.text((450, 285), "Total Amount: $4800.00", fill=(15, 23, 42))

    draw.text((40, 920), "Bank: HDFC Commercial Bank • A/C: 456789012345 • IFSC: HDFC0001234", fill=(100, 116, 139))
    img.save(filename)
    print(f"Generated Image: {filename}")

if __name__ == "__main__":
    out_dir = "sample_invoices"
    os.makedirs(out_dir, exist_ok=True)

    # 1. Standard Matching Invoice
    generate_pdf_invoice(
        f"{out_dir}/invoice_acme_valve_po8801.pdf",
        "Acme Global Industrial Supplies",
        "27AABCT3518Q1ZV",
        "INV-2026-8801A",
        "PO-2026-8801",
        "Precision Industrial Valve Unit",
        10,
        1059.32,
        1906.78,
        12500.00
    )

    # 2. Standard Invoice 2
    generate_pdf_invoice(
        f"{out_dir}/invoice_apex_cloud_po9905.pdf",
        "Apex Technologies Inc",
        "29AAACA2100P1ZT",
        "INV-2026-9905B",
        "PO-2026-9905",
        "Cloud Compute Rack Module",
        4,
        1016.95,
        732.20,
        4800.00
    )

    # 3. Price Mismatch Invoice (Higher Price)
    generate_pdf_invoice(
        f"{out_dir}/invoice_price_mismatch_exception.pdf",
        "Acme Global Industrial Supplies",
        "27AABCT3518Q1ZV",
        "INV-2026-MISMATCH",
        "PO-2026-8801",
        "Precision Industrial Valve Unit",
        10,
        1350.00,
        2430.00,
        15930.00
    )

    # 4. GST Conflict Invoice
    generate_pdf_invoice(
        f"{out_dir}/invoice_gst_conflict_exception.pdf",
        "Acme Global Industrial Supplies",
        "27AABCT3518Q1ZV",
        "INV-2026-CONFLICT",
        "PO-2026-8801",
        "Precision Industrial Valve Unit",
        10,
        1059.32,
        1906.78,
        12500.00,
        has_gst_conflict=True
    )

    # 5. Image Scanned PNG Invoice
    generate_image_invoice(f"{out_dir}/invoice_scanned_image.png")

    print("All sample invoice documents generated successfully!")
