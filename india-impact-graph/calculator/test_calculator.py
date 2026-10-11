import unittest
from decimal import Decimal
from core_calculator import HouseholdImpactCalculator, Receipt, PassThroughData

class TestHouseholdImpactCalculator(unittest.TestCase):
    def setUp(self):
        self.calc = HouseholdImpactCalculator()
        self.dummy_receipt = Receipt(
            source_title="Synthetic Test Data",
            verification_status="[VERIFIED]",
            assumptions_limitations="For testing arithmetic only."
        )
        self.dummy_pt = PassThroughData(
            item_id="diesel",
            low_factor=Decimal('0.40'),
            high_factor=Decimal('0.60'),
            receipt=self.dummy_receipt
        )

    # 1. Valid positive price shock
    def test_valid_positive_shock(self):
        # Baseline = 1000, Share = 10%, Shock = +10%
        # Affected baseline = 100
        # Impact low = 100 * 0.1 * 0.40 = 4.00
        # Impact high = 100 * 0.1 * 0.60 = 6.00
        result = self.calc.calculate_item_impact("diesel", 1000, 10, 10, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result.status, "Success")
        self.assertEqual(result.low_impact, Decimal('4.00'))
        self.assertEqual(result.high_impact, Decimal('6.00'))

    # 2. Low-high interval correctly ordered
    def test_interval_ordering(self):
        result = self.calc.calculate_item_impact("diesel", 1000, 10, 10, self.dummy_pt, self.dummy_receipt)
        self.assertTrue(result.low_impact <= result.high_impact)

    # 3. Negative price shock ordering
    def test_negative_shock_ordering(self):
        # Shock = -10%
        # Impact low = 100 * -0.1 * 0.60 = -6.00 (min value)
        # Impact high = 100 * -0.1 * 0.40 = -4.00 (max value)
        result = self.calc.calculate_item_impact("diesel", 1000, 10, -10, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result.status, "Success")
        self.assertEqual(result.low_impact, Decimal('-6.00'))
        self.assertEqual(result.high_impact, Decimal('-4.00'))
        self.assertTrue(result.low_impact <= result.high_impact)

    # 4. Zero shock
    def test_zero_shock(self):
        result = self.calc.calculate_item_impact("diesel", 1000, 10, 0, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result.status, "Success")
        self.assertEqual(result.low_impact, Decimal('0.00'))
        self.assertEqual(result.high_impact, Decimal('0.00'))

    # 5. Missing baseline
    def test_missing_baseline(self):
        result = self.calc.calculate_item_impact("diesel", None, 10, 10, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result.status, "Data not available")
        self.assertIsNone(result.low_impact)

    # 6. Missing item share
    def test_missing_item_share(self):
        result = self.calc.calculate_item_impact("diesel", 1000, None, 10, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result.status, "Data not available")

    # 7. Missing pass-through factors
    def test_missing_pass_through(self):
        result = self.calc.calculate_item_impact("diesel", 1000, 10, 10, None, self.dummy_receipt)
        self.assertEqual(result.status, "Data not available")
        self.assertIsNone(result.low_impact)

    # 8. Invalid item share
    def test_invalid_item_share(self):
        result = self.calc.calculate_item_impact("diesel", 1000, 105, 10, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result.status, "Invalid input")
        result_neg = self.calc.calculate_item_impact("diesel", 1000, -5, 10, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result_neg.status, "Invalid input")

    # 9. Invalid pass-through factors (low > high)
    def test_invalid_pass_through_range(self):
        bad_pt = PassThroughData("diesel", Decimal('0.80'), Decimal('0.20'), self.dummy_receipt)
        result = self.calc.calculate_item_impact("diesel", 1000, 10, 10, bad_pt, self.dummy_receipt)
        self.assertEqual(result.status, "Invalid input")

    # 10. Invalid numeric inputs (NaN)
    def test_invalid_numeric_inputs(self):
        result = self.calc.calculate_item_impact("diesel", float('nan'), 10, 10, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result.status, "Invalid input")
        result_inf = self.calc.calculate_item_impact("diesel", 1000, float('inf'), 10, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result_inf.status, "Invalid input")
        result_type = self.calc.calculate_item_impact("diesel", "invalid_string", 10, 10, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result_type.status, "Invalid input")

    # 11. Per-capita vs household basis output
    def test_calculation_basis_label(self):
        # Per capita (default / size = None)
        res1 = self.calc.calculate_item_impact("diesel", 1000, 10, 10, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(res1.calculation_basis, "INR/person/month")

        # Household total (size = 4)
        res2 = self.calc.calculate_item_impact("diesel", 1000, 10, 10, self.dummy_pt, self.dummy_receipt, household_size=4)
        self.assertEqual(res2.calculation_basis, "INR/household/month")
        self.assertEqual(res2.low_impact, Decimal('16.00')) # 4x the per capita impact

        # Household total (explicit size = 1)
        res3 = self.calc.calculate_item_impact("diesel", 1000, 10, 10, self.dummy_pt, self.dummy_receipt, household_size=1)
        self.assertEqual(res3.calculation_basis, "INR/household/month")
        self.assertEqual(res3.low_impact, Decimal('4.00'))

    # 12. Receipt integrity
    def test_receipt_integrity(self):
        result = self.calc.calculate_item_impact("diesel", 1000, 10, 10, self.dummy_pt, self.dummy_receipt)
        self.assertIn("baseline", result.receipts)
        self.assertIn("pass_through", result.receipts)
        self.assertEqual(result.receipts["baseline"].source_title, "Synthetic Test Data")

        # Missing baseline receipt
        res_missing_rec = self.calc.calculate_item_impact("diesel", 1000, 10, 10, self.dummy_pt, None)
        self.assertEqual(res_missing_rec.status, "Data not available")
        self.assertIsNone(res_missing_rec.low_impact)

    # 13. Determinism
    def test_determinism(self):
        result1 = self.calc.calculate_item_impact("diesel", 2500, 5.5, 12, self.dummy_pt, self.dummy_receipt)
        result2 = self.calc.calculate_item_impact("diesel", 2500, 5.5, 12, self.dummy_pt, self.dummy_receipt)
        self.assertEqual(result1.low_impact, result2.low_impact)
        self.assertEqual(result1.high_impact, result2.high_impact)

    # 14. Rounding and units
    def test_rounding_and_units(self):
        # Baseline = 1000, Share = 10%, Shock = 10.555%, PT = 0.40
        # Affected = 100
        # Impact = 100 * 0.10555 * 0.4 = 4.222
        # Rounded = 4.22
        pt = PassThroughData("diesel", Decimal('0.40'), Decimal('0.40'), self.dummy_receipt)
        result = self.calc.calculate_item_impact("diesel", 1000, 10, 10.555, pt, self.dummy_receipt)
        self.assertEqual(result.low_impact, Decimal('4.22'))
        self.assertEqual(result.currency, "INR")

if __name__ == '__main__':
    unittest.main()
