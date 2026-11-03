import re
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.invoice import Invoice, InvoiceValidation, InvoiceException
from backend.app.models.vendor import Vendor

class ValidationEngine:
    def __init__(self, tolerance: float = settings.AMOUNT_TOLERANCE):
        self.tolerance = Decimal(str(tolerance))

    def validate_invoice(self, db: Session, invoice: Invoice) -> Tuple[bool, List[Dict[str, Any]]]:
        exceptions = []
        passed_rules = []
        warnings = []

        # 1. Mandatory Fields Validation
        if not invoice.invoice_number or not invoice.invoice_number.strip():
            exceptions.append({
                'rule_code': 'MANDATORY_INVOICE_NUM_MISSING',
                'severity': 'Critical',
                'message': 'Invoice Number is missing or empty.',
                'suggested_action': 'Manually inspect original document and input the invoice number.'
            })
        else:
            passed_rules.append('MANDATORY_INVOICE_NUM_PRESENT')

        if not invoice.invoice_date:
            exceptions.append({
                'rule_code': 'MANDATORY_DATE_MISSING',
                'severity': 'Critical',
                'message': 'Invoice Date is missing.',
                'suggested_action': 'Enter the official invoice issue date.'
            })
        else:
            passed_rules.append('MANDATORY_DATE_PRESENT')

        if not invoice.total_amount or invoice.total_amount <= 0:
            exceptions.append({
                'rule_code': 'MANDATORY_AMOUNT_INVALID',
                'severity': 'Critical',
                'message': 'Total invoice amount must be greater than zero.',
                'suggested_action': 'Verify the extracted total amount against document totals.'
            })
        else:
            passed_rules.append('MANDATORY_AMOUNT_VALID')

        if not invoice.currency:
            exceptions.append({
                'rule_code': 'MANDATORY_CURRENCY_MISSING',
                'severity': 'Warning',
                'message': 'Currency is missing. Defaulting to USD.',
                'suggested_action': 'Confirm currency code matches vendor billing contract.'
            })
        else:
            passed_rules.append('MANDATORY_CURRENCY_PRESENT')

        # 2. Duplicate Detection Validation
        # Exact match check: Same vendor ID and invoice number on an existing record
        if invoice.vendor_id and invoice.invoice_number:
            exact_dup = db.query(Invoice).filter(
                Invoice.id != invoice.id,
                Invoice.vendor_id == invoice.vendor_id,
                Invoice.invoice_number.ilike(invoice.invoice_number.strip())
            ).first()
            if exact_dup:
                exceptions.append({
                    'rule_code': 'DUPLICATE_INVOICE_EXACT',
                    'severity': 'Critical',
                    'message': f'Exact duplicate invoice detected: Vendor already has invoice {invoice.invoice_number} (Record ID: {exact_dup.id}).',
                    'suggested_action': 'Reject this invoice or confirm if a revised credit/debit memo was issued.'
                })
            else:
                passed_rules.append('DUPLICATE_CHECK_EXACT_PASSED')

        # Fuzzy duplicate check: Same vendor + same amount + same invoice date
        if invoice.vendor_id and invoice.total_amount and invoice.invoice_date:
            fuzzy_dup = db.query(Invoice).filter(
                Invoice.id != invoice.id,
                Invoice.vendor_id == invoice.vendor_id,
                Invoice.total_amount == invoice.total_amount,
                Invoice.invoice_date == invoice.invoice_date
            ).first()
            if fuzzy_dup:
                exceptions.append({
                    'rule_code': 'DUPLICATE_INVOICE_FUZZY',
                    'severity': 'Warning',
                    'message': f'Potential duplicate: Same vendor, date, and amount ({invoice.total_amount}) matches invoice {fuzzy_dup.invoice_number}.',
                    'suggested_action': 'Review line items and document content to verify if this is a separate order.'
                })

        # 3. Vendor Master Validation
        if not invoice.vendor_id:
            exceptions.append({
                'rule_code': 'VENDOR_NOT_IDENTIFIED',
                'severity': 'Critical',
                'message': f'Vendor "{invoice.vendor_name_raw or "Unknown"}" could not be mapped to an approved vendor in Vendor Master.',
                'suggested_action': 'Onboard the vendor or link to an existing active vendor profile.'
            })
        else:
            vendor = db.query(Vendor).filter(Vendor.id == invoice.vendor_id).first()
            if not vendor:
                exceptions.append({
                    'rule_code': 'VENDOR_NOT_FOUND',
                    'severity': 'Critical',
                    'message': 'Linked vendor record does not exist in database.',
                    'suggested_action': 'Re-assign vendor.'
                })
            elif vendor.status != 'Active':
                exceptions.append({
                    'rule_code': 'VENDOR_INACTIVE',
                    'severity': 'Critical',
                    'message': f'Vendor {vendor.vendor_name} is currently "{vendor.status}". Invoices cannot be processed for inactive vendors.',
                    'suggested_action': 'Request Vendor Management to review compliance and activate vendor.'
                })
            else:
                passed_rules.append('VENDOR_MASTER_VALID')

                # Tax / GSTIN match against Vendor Master
                if vendor.gstin and invoice.vendor_gstin:
                    if vendor.gstin.strip().upper() != invoice.vendor_gstin.strip().upper():
                        exceptions.append({
                            'rule_code': 'GSTIN_VENDOR_MISMATCH',
                            'severity': 'Critical',
                            'message': f'Extracted GSTIN ({invoice.vendor_gstin}) does not match Vendor Master GSTIN ({vendor.gstin}).',
                            'suggested_action': 'Verify if vendor changed legal entities or updated tax registration.'
                        })
                    else:
                        passed_rules.append('GSTIN_VENDOR_MATCH_PASSED')

        # 4. GST Format & Tax Calculation Validation
        if invoice.vendor_gstin:
            gst_regex = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
            if not re.match(gst_regex, invoice.vendor_gstin.strip().upper()):
                exceptions.append({
                    'rule_code': 'GSTIN_FORMAT_INVALID',
                    'severity': 'Critical',
                    'message': f'GSTIN "{invoice.vendor_gstin}" is not a valid 15-character GSTIN format.',
                    'suggested_action': 'Correct the GSTIN number according to statutory format.'
                })
            else:
                passed_rules.append('GSTIN_FORMAT_VALID')

        # Tax Treatment: Intra-state vs Inter-state
        if invoice.igst_amount and invoice.igst_amount > 0:
            if (invoice.cgst_amount and invoice.cgst_amount > 0) or (invoice.sgst_amount and invoice.sgst_amount > 0):
                exceptions.append({
                    'rule_code': 'GST_TREATMENT_CONFLICT',
                    'severity': 'Critical',
                    'message': 'Cannot have both IGST (inter-state) and CGST/SGST (intra-state) applied on the same invoice.',
                    'suggested_action': 'Adjust tax split based on supplier and destination state.'
                })

        # 5. Amount & Math Validation
        # Mathematical integrity: subtotal - discount + taxes + round_off == total_amount
        calculated_total = (
            (invoice.subtotal or Decimal('0.00')) -
            (invoice.discount_amount or Decimal('0.00')) +
            (invoice.total_tax_amount or Decimal('0.00')) +
            (invoice.round_off_amount or Decimal('0.00'))
        )
        diff = abs(calculated_total - (invoice.total_amount or Decimal('0.00')))
        if diff > self.tolerance:
            exceptions.append({
                'rule_code': 'AMOUNT_CALCULATION_MISMATCH',
                'severity': 'Critical',
                'message': f'Calculated total ({calculated_total}) does not match invoice total ({invoice.total_amount}). Variance: {diff}.',
                'suggested_action': 'Review subtotal, line items, and tax breakdown.'
            })
        else:
            passed_rules.append('AMOUNT_MATH_INTEGRITY_PASSED')

        # Line items sum check
        if invoice.line_items:
            items_sum = sum((item.line_total or Decimal('0.00')) for item in invoice.line_items)
            line_diff = abs(items_sum - (invoice.total_amount or Decimal('0.00')))
            if line_diff > Decimal('1.00'):
                exceptions.append({
                    'rule_code': 'LINE_ITEMS_SUM_MISMATCH',
                    'severity': 'Warning',
                    'message': f'Sum of line item totals ({items_sum}) differs from total amount ({invoice.total_amount}) by {line_diff}.',
                    'suggested_action': 'Verify individual line item calculations and discounts.'
                })
            else:
                passed_rules.append('LINE_ITEMS_SUM_MATCH_PASSED')

        # Persist validation records & exceptions into database
        db.query(InvoiceException).filter(InvoiceException.invoice_id == invoice.id).delete()

        critical_count = 0
        warning_count = 0
        for exc in exceptions:
            if exc['severity'] == 'Critical':
                critical_count += 1
            else:
                warning_count += 1
            db_exc = InvoiceException(
                invoice_id=invoice.id,
                rule_code=exc['rule_code'],
                severity=exc['severity'],
                message=exc['message'],
                suggested_action=exc['suggested_action'],
                is_resolved=False
            )
            db.add(db_exc)

        val_status = 'Passed' if critical_count == 0 else 'Failed'
        if critical_count == 0 and warning_count > 0:
            val_status = 'Warnings'

        validation_record = InvoiceValidation(
            invoice_id=invoice.id,
            validation_status=val_status,
            passed_count=len(passed_rules),
            failed_count=critical_count,
            warning_count=warning_count,
            validated_at=datetime.now(timezone.utc)
        )
        db.add(validation_record)

        if critical_count > 0:
            invoice.status = 'Validation_Failed'
        else:
            invoice.status = 'Validation_Passed'

        db.commit()
        return (critical_count == 0), exceptions

validation_engine = ValidationEngine()
