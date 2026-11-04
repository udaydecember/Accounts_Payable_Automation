import os
import sys
import sqlite3

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal
from backend.app.models.vendor import Vendor, VendorBankAccount
from backend.app.models.po_grn import PurchaseOrder, PurchaseOrderLineItem, GoodsReceipt, GoodsReceiptLineItem

def sync_data():
    s_conn = sqlite3.connect("ap_automation.db")
    s_conn.row_factory = sqlite3.Row
    s_cur = s_conn.cursor()

    pg_db: Session = SessionLocal()

    try:
        # Build mapping of SQLite PO id -> po_number
        s_cur.execute("SELECT id, po_number FROM purchase_orders")
        sqlite_po_map = {row["id"]: row["po_number"] for row in s_cur.fetchall()}

        # 1. Sync Vendors
        s_cur.execute("SELECT * FROM vendors")
        for v in s_cur.fetchall():
            existing = pg_db.query(Vendor).filter(
                (Vendor.id == v["id"]) | 
                (Vendor.vendor_code == v["vendor_code"]) |
                (Vendor.gstin == v["gstin"])
            ).first()
            if not existing:
                print(f"Adding vendor: {v['vendor_name']} ({v['gstin']})")
                new_v = Vendor(
                    id=v["id"],
                    vendor_name=v["vendor_name"],
                    vendor_code=v["vendor_code"],
                    vendor_type=v["vendor_type"] if "vendor_type" in v.keys() else "Standard",
                    contact_person=v["contact_person"] if "contact_person" in v.keys() else None,
                    email=v["email"] if "email" in v.keys() else None,
                    phone=v["phone"] if "phone" in v.keys() else None,
                    billing_address=v["billing_address"] if "billing_address" in v.keys() else None,
                    shipping_address=v["shipping_address"] if "shipping_address" in v.keys() else None,
                    gstin=v["gstin"] if "gstin" in v.keys() else None,
                    pan=v["pan"] if "pan" in v.keys() else None,
                    tin=v["tin"] if "tin" in v.keys() else None,
                    currency=v["currency"] if "currency" in v.keys() else "INR",
                    payment_terms=v["payment_terms"] if "payment_terms" in v.keys() else "Net 30",
                    status=v["status"] if "status" in v.keys() else "Active"
                )
                pg_db.add(new_v)
                pg_db.commit()
            else:
                print(f"Vendor exists: {existing.vendor_name}")

        # 2. Sync Purchase Orders
        s_cur.execute("SELECT * FROM purchase_orders")
        for po in s_cur.fetchall():
            # Find vendor in PG
            v_id = po["vendor_id"]
            v_in_pg = pg_db.query(Vendor).filter(Vendor.id == v_id).first()
            if not v_in_pg:
                s_cur.execute("SELECT * FROM vendors WHERE id = ?", (v_id,))
                v_data = s_cur.fetchone()
                if v_data:
                    v_in_pg = pg_db.query(Vendor).filter(Vendor.gstin == v_data["gstin"]).first()
                    if v_in_pg:
                        v_id = v_in_pg.id

            existing = pg_db.query(PurchaseOrder).filter(
                (PurchaseOrder.id == po["id"]) | 
                (PurchaseOrder.po_number == po["po_number"])
            ).first()
            if not existing:
                print(f"Adding PO: {po['po_number']}")
                new_po = PurchaseOrder(
                    id=po["id"],
                    po_number=po["po_number"],
                    vendor_id=v_id,
                    currency=po["currency"] if "currency" in po.keys() else "INR",
                    payment_terms=po["payment_terms"] if "payment_terms" in po.keys() else "Net 30",
                    status=po["status"] if "status" in po.keys() else "Open",
                    total_amount=po["total_amount"],
                    tax_amount=po["tax_amount"] if "tax_amount" in po.keys() else 0.00
                )
                pg_db.add(new_po)
                pg_db.commit()
            else:
                print(f"PO exists: {existing.po_number}")

        # Build mapping of po_number -> PG PO ID
        pg_pos = pg_db.query(PurchaseOrder).all()
        pg_po_by_num = {p.po_number: p.id for p in pg_pos}

        # 3. Sync PO Line Items
        s_cur.execute("SELECT * FROM purchase_order_line_items")
        for item in s_cur.fetchall():
            orig_po_num = sqlite_po_map.get(item["po_id"])
            pg_po_id = pg_po_by_num.get(orig_po_num, item["po_id"])

            existing = pg_db.query(PurchaseOrderLineItem).filter(
                (PurchaseOrderLineItem.id == item["id"]) |
                ((PurchaseOrderLineItem.po_id == pg_po_id) & (PurchaseOrderLineItem.line_number == item["line_number"]))
            ).first()
            if not existing:
                print(f"Adding PO line item: {item['item_description']} for {orig_po_num}")
                new_item = PurchaseOrderLineItem(
                    id=item["id"],
                    po_id=pg_po_id,
                    line_number=item["line_number"],
                    item_description=item["item_description"],
                    material_code=item["material_code"] if "material_code" in item.keys() else None,
                    quantity=item["quantity"],
                    received_quantity=item["received_quantity"] if "received_quantity" in item.keys() else 0,
                    invoiced_quantity=item["invoiced_quantity"] if "invoiced_quantity" in item.keys() else 0,
                    uom=item["uom"] if "uom" in item.keys() else "EA",
                    unit_price=item["unit_price"],
                    tax_rate=item["tax_rate"] if "tax_rate" in item.keys() else 0,
                    tax_amount=item["tax_amount"] if "tax_amount" in item.keys() else 0,
                    line_total=item["line_total"]
                )
                pg_db.add(new_item)
                pg_db.commit()

        # 4. Sync Goods Receipts (GRNs)
        s_cur.execute("SELECT * FROM goods_receipts")
        for grn in s_cur.fetchall():
            orig_po_num = sqlite_po_map.get(grn["po_id"])
            pg_po_id = pg_po_by_num.get(orig_po_num, grn["po_id"])

            existing = pg_db.query(GoodsReceipt).filter(
                (GoodsReceipt.id == grn["id"]) |
                (GoodsReceipt.grn_number == grn["grn_number"])
            ).first()
            if not existing:
                print(f"Adding GRN: {grn['grn_number']} for {orig_po_num}")
                new_grn = GoodsReceipt(
                    id=grn["id"],
                    grn_number=grn["grn_number"],
                    po_id=pg_po_id,
                    received_by=grn["received_by"] if "received_by" in grn.keys() else "Admin",
                    status=grn["status"] if "status" in grn.keys() else "Verified",
                    notes=grn["notes"] if "notes" in grn.keys() else None
                )
                pg_db.add(new_grn)
                pg_db.commit()

        # 5. Sync GRN Line Items
        s_cur.execute("SELECT * FROM goods_receipt_line_items")
        for g_item in s_cur.fetchall():
            existing = pg_db.query(GoodsReceiptLineItem).filter(GoodsReceiptLineItem.id == g_item["id"]).first()
            if not existing:
                print(f"Adding GRN line item: {g_item['item_description']}")
                new_g_item = GoodsReceiptLineItem(
                    id=g_item["id"],
                    grn_id=g_item["grn_id"],
                    po_line_item_id=g_item["po_line_item_id"] if "po_line_item_id" in g_item.keys() else None,
                    item_description=g_item["item_description"],
                    material_code=g_item["material_code"] if "material_code" in g_item.keys() else None,
                    received_quantity=g_item["received_quantity"],
                    accepted_quantity=g_item["accepted_quantity"],
                    rejected_quantity=g_item["rejected_quantity"] if "rejected_quantity" in g_item.keys() else 0,
                    uom=g_item["uom"] if "uom" in g_item.keys() else "EA"
                )
                pg_db.add(new_g_item)
                pg_db.commit()

        print("[+] Sync to PostgreSQL complete!")

    finally:
        s_conn.close()
        pg_db.close()

if __name__ == "__main__":
    sync_data()
