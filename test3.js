import { formatCarPrice } from './src/lib/utils.js';

const car = {
  price: 1012500,
  year: 2019,
  dutyPaid: false,
  engineCC: 1500,
  fuelType: 'PETROL'
};

console.log(formatCarPrice(car));
