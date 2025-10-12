// Debug Script: JavaScript Floating Point Issues
// Test various scenarios that could cause the 80,00€ → 79,98€ problem

console.log("=== JavaScript Floating Point Debug ===");
console.log("");

// Test 1: Direct parseFloat
console.log("Test 1: parseFloat Tests");
console.log("parseFloat('80.00'):", parseFloat('80.00'));
console.log("parseFloat('80'):", parseFloat('80'));
console.log("");

// Test 2: Step calculation issues
console.log("Test 2: Step/Input Validation");
const input80 = "80.00";
const parsed = parseFloat(input80) || 0;
console.log("Input:", input80, "→ parseFloat:", parsed);
console.log("");

// Test 3: Multiplication/Division operations
console.log("Test 3: Mathematical Operations");
const value = 80.00;
console.log("Original:", value);
console.log("* 100:", value * 100);
console.log("Math.round(value * 100):", Math.round(value * 100));
console.log("Math.round(value * 100) / 100:", Math.round(value * 100) / 100);
console.log("");

// Test 4: Quantity * UnitPrice calculation
console.log("Test 4: Total Calculation");
const quantity = 1;
const unitPrice = 80.00;
const total = quantity * unitPrice;
console.log(`${quantity} * ${unitPrice} = ${total}`);
console.log("total.toFixed(2):", total.toFixed(2));
console.log("");

// Test 5: Discount calculation scenarios
console.log("Test 5: Discount Calculator Simulation");
const lineItems = [{ quantity: 1, unitPrice: 80.00 }];
const subtotalBeforeDiscount = lineItems.reduce((sum, item) => {
  return sum + (item.quantity * item.unitPrice);
}, 0);
console.log("subtotalBeforeDiscount:", subtotalBeforeDiscount);
console.log("Math.round(subtotalBeforeDiscount * 100) / 100:", Math.round(subtotalBeforeDiscount * 100) / 100);
console.log("");

// Test 6: Potential rounding chain issues
console.log("Test 6: Multiple Rounding Chain");
let value6 = 80.00;
console.log("Original:", value6);
value6 = Math.round(value6 * 100) / 100; // First rounding
console.log("After first round:", value6);
value6 = Math.round(value6 * 100) / 100; // Second rounding
console.log("After second round:", value6);
console.log("");

// Test 7: Edge case with parseFloat precision
console.log("Test 7: parseFloat Edge Cases");
const testValues = ['80', '80.0', '80.00', '80.000'];
testValues.forEach(val => {
  const parsed = parseFloat(val) || 0;
  console.log(`'${val}' → parseFloat: ${parsed} → rounded: ${Math.round(parsed * 100) / 100}`);
});
console.log("");

// Test 8: Input event simulation
console.log("Test 8: Input Event Simulation");
const mockEvent = { target: { value: '80.00' } };
const inputValue = parseFloat(mockEvent.target.value) || 0;
console.log("Input value '80.00' → parseFloat:", inputValue);
console.log("Rounded:", Math.round(inputValue * 100) / 100);