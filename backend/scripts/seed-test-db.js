const { LocalStorage } = require('node-localstorage');
const { v4: uuidv4 } = require('uuid');
const localStorage = new LocalStorage('./storage');

const orders = [
  {
    id: uuidv4(),
    name: 'Test User 1',
    email: 'test1@example.com',
    serviceType: 'Deep Clean',
    amount: 7500,
    status: 'Pending',
    paymentIntentId: 'pi_test_1',
    date: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Test User 2',
    email: 'test2@example.com',
    serviceType: 'Move-out Clean',
    amount: 12000,
    status: 'Pending',
    paymentIntentId: 'pi_test_2',
    date: new Date().toISOString()
  }
];

localStorage.setItem('orders', JSON.stringify(orders, null, 2));
console.log('Seeded test DB to ./storage/orders');
