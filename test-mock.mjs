const mockData = {};
const dbMock = {
  prepare: (sql) => ({
    run: () => ({ changes: 1 })
  }),
  transaction: (fn) => fn()
};

console.log('typeof dbMock.transaction:', typeof dbMock.transaction);
console.log('dbMock.transaction is function:', typeof dbMock.transaction === 'function');

try {
  const result = dbMock.transaction(() => {
    console.log('Inside transaction callback');
    return true;
  });
  console.log('Transaction result:', result);
} catch (e) {
  console.log('ERROR:', e.message);
}
