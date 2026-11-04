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
from backend.app.models.po_grn import GoodsReceipt, GoodsReceiptLineItem, PurchaseOrder, PurchaseOrderLineItem

def sync_grn_lines():
    s_conn = sqlite3.connect("ap_automation.db")
    s_conn.row_factory = sqlite3.Row
    s_cur = s_conn.cursor()

    pg_db: Session = SessionLocal()

    try:
        # Map SQLite grn id -> grn_number
        s_cur.execute("SELECT id, grn_number FROM goods_receipts")
        sqlite_grn_map = {row["id"]: row["grn_number"] for row in s_cur.fetchall()}

        # Map PG grn_number -> PG grn id
        pg_grns = pg_db.query(GoodsReceipt).all()
        pg_grn_by_num = {g.grn_number: g.id for g in pg_grns}

        # Map PG PO line items by description
        pg_po_lines = pg_db.query(PurchaseOrderLineItem).all()
        pg_po_line_by_desc = {line.item_description: line.id for line in pg_po_lines}

        s_cur.execute("SELECT * FROM goods_receipt_line_items")
        for g_item in s_cur.fetchall():
            orig_grn_num = sqlite_grn_map.get(g_item["grn_id"])
            pg_grn_id = pg_grn_by_num.get(orig_grn_num)

            if not pg_grn_id:
                continue

            existing = pg_db.query(GoodsReceiptLineItem).filter(
                (GoodsReceiptLineItem.id == g_item["id"]) |
                (GoodsReceiptLineItem.grn_id == pg_grn_id)
            ).first()

            if not existing:
                po_line_id = pg_po_line_by_desc.get(g_item["item_description"])
                print(f"Adding GRN line item: {g_item['item_description']} to {orig_grn_num}")
                new_item = GoodsReceiptLineItem(
                    id=g_item["id"],
                    grn_id=pg_grn_id,
                    po_line_item_id=po_line_id,
                    item_description=g_item["item_description"],
                    material_code=g_item["material_code"] if "material_code" in g_item.keys() else None,
                    received_quantity=g_item["received_quantity"],
                    accepted_quantity=g_item["accepted_quantity"],
                    rejected_quantity=g_item["rejected_quantity"] if "rejected_quantity" in g_item.keys() else 0,
                    uom=g_item["uom"] if "uom" in g_item.keys() else "EA"
                )
                pg_db.add(new_item)
                pg_db.commit()

        print("[+] GRN line items synced successfully!")
    finally:
        s_conn.close()
        pg_db.close()

if __name__ == "__main__":
    sync_grn_lines()
