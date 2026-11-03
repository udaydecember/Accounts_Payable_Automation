import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.invoice import Invoice, InvoiceException
from backend.app.models.po_grn import PurchaseOrder, GoodsReceipt
from backend.app.models.matching import InvoicePOMatch

class MatchingEngine:
    def __init__(self, price_variance_tolerance: float = settings.PRICE_VARIANCE_TOLERANCE_PCT):
        self.price_variance_tolerance = Decimal(str(price_variance_tolerance))

    def perform_matching(self, db: Session, invoice: Invoice) -> Tuple[str, Dict[str, Any]]:
        # 1. Check if invoice has PO reference
        if not invoice.po_number or not invoice.po_number.strip():
            match_record = InvoicePOMatch(
                invoice_id=invoice.id,
                match_type='Two_Way',
                match_status='Missing_PO',
                header_variance_amount=invoice.total_amount,
                price_variance_pct=0.0,
                quantity_variance=0.0,
                discrepancy_details=json.dumps({'error': 'No PO reference provided in invoice.'}),
                is_resolved=False
            )
            db.add(match_record)
            invoice.status = 'Matching_Failed'
            db.commit()
            return 'Missing_PO', {'status': 'Missing_PO', 'message': 'No PO Reference found on invoice.'}

        # Find PO
        po = db.query(PurchaseOrder).filter(
            PurchaseOrder.po_number.ilike(invoice.po_number.strip())
        ).first()

        if not po:
            match_record = InvoicePOMatch(
                invoice_id=invoice.id,
                match_type='Two_Way',
                match_status='Missing_PO',
                header_variance_amount=invoice.total_amount,
                price_variance_pct=0.0,
                quantity_variance=0.0,
                discrepancy_details=json.dumps({'error': f'Purchase Order {invoice.po_number} not found in system.'}),
                is_resolved=False
            )
            db.add(match_record)
            invoice.status = 'Matching_Failed'
            db.commit()
            return 'Missing_PO', {'status': 'Missing_PO', 'message': f'Purchase Order {invoice.po_number} does not exist in master.'}

        # Check vendor match
        vendor_match = (invoice.vendor_id == po.vendor_id)
        discrepancies = []
        if not vendor_match:
            discrepancies.append({
                'type': 'Vendor Mismatch',
                'description': f'Invoice vendor ({invoice.vendor_id}) does not match PO vendor ({po.vendor_id}).'
            })

        # Find GRN (Goods Receipt) if available for 3-way matching
        grn = db.query(GoodsReceipt).filter(GoodsReceipt.po_id == po.id).order_by(GoodsReceipt.receipt_date.desc()).first()
        match_type = 'Three_Way' if grn else 'Two_Way'

        # Line item comparison
        line_comparison = []
        total_price_variance_pct = Decimal('0.0')
        total_quantity_variance = Decimal('0.0')

        po_lines_by_code = {item.material_code: item for item in po.line_items if item.material_code}
        po_lines_by_desc = {item.item_description.lower(): item for item in po.line_items}

        grn_lines_by_item = {}
        if grn:
            for g_item in grn.line_items:
                if g_item.material_code:
                    grn_lines_by_item[g_item.material_code] = g_item

        for inv_item in invoice.line_items:
            po_item = None
            if inv_item.material_code and inv_item.material_code in po_lines_by_code:
                po_item = po_lines_by_code[inv_item.material_code]
            elif inv_item.item_description.lower() in po_lines_by_desc:
                po_item = po_lines_by_desc[inv_item.item_description.lower()]
            elif po.line_items:
                # Fallback to first line item if single item
                po_item = po.line_items[0]

            if not po_item:
                discrepancies.append({
                    'type': 'Unmatched Item',
                    'description': f'Invoice item \"{inv_item.item_description}\" not found on PO {po.po_number}.'
                })
                line_comparison.append({
                    'item': inv_item.item_description,
                    'inv_qty': float(inv_item.quantity),
                    'po_qty': None,
                    'grn_qty': None,
                    'inv_price': float(inv_item.unit_price),
                    'po_price': None,
                    'status': 'Mismatched'
                })
                continue

            # Price comparison
            price_diff = abs(inv_item.unit_price - po_item.unit_price)
            price_var_pct = (price_diff / po_item.unit_price * Decimal('100.0')) if po_item.unit_price > 0 else Decimal('0.0')
            total_price_variance_pct = max(total_price_variance_pct, price_var_pct)

            if price_var_pct > self.price_variance_tolerance:
                discrepancies.append({
                    'type': 'Price Variance',
                    'description': f'Item \"{inv_item.item_description}\" unit price ({inv_item.unit_price}) exceeds PO price ({po_item.unit_price}) by {price_var_pct:.2f}% (Tolerance: {self.price_variance_tolerance}%).'
                })

            # Quantity comparison
            grn_item = grn_lines_by_item.get(inv_item.material_code) if (grn and inv_item.material_code) else None
            accepted_qty = grn_item.accepted_quantity if grn_item else po_item.received_quantity

            # If 3-Way match, compare against GRN accepted quantity
            qty_basis = accepted_qty if match_type == 'Three_Way' else po_item.quantity
            qty_diff = inv_item.quantity - qty_basis
            if qty_diff > 0:
                basis_label = "GRN received" if match_type == "Three_Way" else "PO ordered"
                discrepancies.append({
                    'type': 'Quantity Overage',
                    'description': f'Invoiced quantity ({inv_item.quantity}) exceeds {basis_label} quantity ({qty_basis}).'
                })
                total_quantity_variance += qty_diff

            line_status = 'Matched' if (price_var_pct <= self.price_variance_tolerance and qty_diff <= 0) else 'Mismatched'
            line_comparison.append({
                'item': inv_item.item_description,
                'inv_qty': float(inv_item.quantity),
                'po_qty': float(po_item.quantity),
                'grn_qty': float(accepted_qty) if grn else None,
                'inv_price': float(inv_item.unit_price),
                'po_price': float(po_item.unit_price),
                'price_variance_pct': float(price_var_pct),
                'status': line_status
            })

        # Header total variance
        header_diff = abs(invoice.total_amount - po.total_amount)
        if header_diff > Decimal('5.00') and not discrepancies:
            discrepancies.append({
                'type': 'Header Total Variance',
                'description': f'Total invoice amount ({invoice.total_amount}) deviates from PO total ({po.total_amount}) by {header_diff}.'
            })

        overall_status = 'Matched' if len(discrepancies) == 0 else 'Mismatched'

        # Persist match record
        existing_match = db.query(InvoicePOMatch).filter(InvoicePOMatch.invoice_id == invoice.id).first()
        if existing_match:
            db.delete(existing_match)

        match_record = InvoicePOMatch(
            invoice_id=invoice.id,
            po_id=po.id,
            grn_id=grn.id if grn else None,
            match_type=match_type,
            match_status=overall_status,
            header_variance_amount=header_diff,
            price_variance_pct=float(total_price_variance_pct),
            quantity_variance=float(total_quantity_variance),
            discrepancy_details=json.dumps({
                'discrepancies': discrepancies,
                'lines': line_comparison,
                'po_number': po.po_number,
                'grn_number': grn.grn_number if grn else None
            }),
            is_resolved=(overall_status == 'Matched')
        )
        db.add(match_record)

        if overall_status == 'Matched':
            invoice.status = 'Matching_Passed'
        else:
            invoice.status = 'Matching_Failed'
            # Add an invoice exception so it appears in Exception management
            exc = InvoiceException(
                invoice_id=invoice.id,
                rule_code='PO_GRN_MATCH_DISCREPANCY',
                severity='Critical',
                message=f'{match_type} match failed with {len(discrepancies)} discrepancy(ies).',
                suggested_action='Resolve variances in Matching module or obtain manager override.'
            )
            db.add(exc)

        db.commit()
        return overall_status, {
            'match_type': match_type,
            'match_status': overall_status,
            'discrepancies': discrepancies,
            'lines': line_comparison
        }

matching_engine = MatchingEngine()
