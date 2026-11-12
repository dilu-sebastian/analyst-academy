// Generates the sample SQLite datasets used by the SQL practice area and lessons.
// Deterministic: the same seed always produces the same data, so numbers quoted
// in lessons stay correct. Run with:  node scripts/generate-datasets.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'datasets')
mkdirSync(outDir, { recursive: true })

/* ---------- helpers ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
let rand = mulberry32(1)
const int = (a, b) => a + Math.floor(rand() * (b - a + 1))
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [v, w] of pairs) if ((r -= w) < 0) return v
  return pairs[pairs.length - 1][0]
}
const round2 = (n) => Math.round(n * 100) / 100
const DAY = 86400000
const d = (s) => new Date(s + 'T00:00:00Z').getTime()
const iso = (t) => new Date(t).toISOString().slice(0, 10)
const randDate = (from, to) => iso(d(from) + Math.floor(rand() * ((d(to) - d(from)) / DAY + 1)) * DAY)
const addDays = (s, n) => iso(d(s) + n * DAY)

const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)
function inserts(table, cols, rows, chunk = 200) {
  const out = []
  for (let i = 0; i < rows.length; i += chunk) {
    const values = rows.slice(i, i + chunk).map((r) => `(${r.map(q).join(', ')})`).join(',\n')
    out.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${values};`)
  }
  return out.join('\n')
}

const firstNames = ['Olivia','Amelia','Isla','Ava','Mia','Sophia','Grace','Lily','Freya','Emily','Ella','Poppy','Chloe','Aisha','Priya','Zara','Hannah','Lucy','Ruby','Niamh','Sarah','Fatima','Mei','Anna','Laura','Jack','Oliver','Harry','George','Noah','Leo','Arthur','Muhammad','Oscar','Charlie','Jacob','Thomas','James','William','Daniel','Ethan','Samuel','Arjun','Ravi','Liam','Conor','Sean','David','Michael','Adam','Ben','Kwame','Tomasz','Luca','Ahmed']
const lastNames = ['Smith','Jones','Taylor','Brown','Williams','Wilson','Johnson','Davies','Patel','Robinson','Wright','Thompson','Evans','Walker','White','Roberts','Green','Hall','Wood','Jackson','Clarke','Khan','Murphy','Kelly','Walsh','Byrne','Singh','Ali','Hughes','Edwards','Lewis','Hill','Moore','Martin','Cooper','Ward','Morris','King','Baker','Harris','Nowak','Okafor','Chen','Rossi','Shah']

/* =================================================================
   RETAIL: an online + in-store homeware and electronics retailer
   ================================================================= */
function retail() {
  rand = mulberry32(2024)
  const cities = [
    ['London', 'United Kingdom', 30], ['Manchester', 'United Kingdom', 12], ['Birmingham', 'United Kingdom', 10],
    ['Leeds', 'United Kingdom', 7], ['Glasgow', 'United Kingdom', 7], ['Bristol', 'United Kingdom', 6],
    ['Liverpool', 'United Kingdom', 6], ['Edinburgh', 'United Kingdom', 5], ['Cardiff', 'United Kingdom', 4],
    ['Dublin', 'Ireland', 8], ['Cork', 'Ireland', 3],
  ]
  const customers = []
  for (let i = 1; i <= 250; i++) {
    const fn = pick(firstNames), ln = pick(lastNames)
    const [city, country] = weighted(cities.map((c) => [c, c[2]]))
    const email = rand() < 0.05 ? null : `${fn}.${ln}${i}@example.com`.toLowerCase()
    customers.push([i, fn, ln, email, rand() < 0.02 ? null : city, country, randDate('2022-01-01', '2024-10-31'), weighted([['Consumer', 70], ['Small Business', 20], ['Corporate', 10]])])
  }

  const products = [
    ['Wireless Earbuds', 'Electronics', 59.99, 31.0], ['Bluetooth Speaker', 'Electronics', 39.99, 19.5], ['USB-C Charger 65W', 'Electronics', 24.99, 9.8],
    ['Smart Watch', 'Electronics', 149.0, 88.0], ['Noise-Cancelling Headphones', 'Electronics', 199.0, 115.0], ['Phone Case', 'Electronics', 12.99, 3.1],
    ['Portable Power Bank', 'Electronics', 29.99, 13.4], ['4K Webcam', 'Electronics', 89.0, 47.0],
    ['Non-stick Frying Pan', 'Home & Kitchen', 27.5, 11.2], ['Chef Knife', 'Home & Kitchen', 34.0, 12.9], ['Coffee Grinder', 'Home & Kitchen', 45.0, 21.0],
    ['Glass Storage Set', 'Home & Kitchen', 22.0, 8.7], ['Electric Kettle', 'Home & Kitchen', 32.99, 15.1], ['Air Fryer', 'Home & Kitchen', 89.99, 52.0],
    ['Bath Towel Set', 'Home & Kitchen', 29.0, 10.5], ['Scented Candle', 'Home & Kitchen', 14.5, 4.2],
    ['Yoga Mat', 'Sports', 25.0, 9.0], ['Dumbbell Set 10kg', 'Sports', 49.0, 26.0], ['Running Water Bottle', 'Sports', 11.99, 3.4],
    ['Resistance Bands', 'Sports', 15.99, 4.9], ['Cycling Helmet', 'Sports', 54.0, 27.5], ['Fitness Tracker', 'Sports', 69.0, 38.0],
    ['Data Analysis Handbook', 'Books', 32.0, 14.0], ['Mystery Novel', 'Books', 9.99, 3.6], ['Cookbook: Quick Dinners', 'Books', 18.0, 7.1],
    ['Children\'s Picture Book', 'Books', 7.99, 2.6], ['Business Strategy Guide', 'Books', 24.0, 9.9],
    ['Face Moisturiser', 'Beauty', 19.5, 6.0], ['Shampoo & Conditioner', 'Beauty', 13.0, 4.1], ['Electric Toothbrush', 'Beauty', 59.0, 28.0],
    ['Hair Dryer', 'Beauty', 44.0, 21.5], ['Perfume 50ml', 'Beauty', 65.0, 24.0],
    ['Building Blocks Set', 'Toys', 39.0, 17.0], ['Remote Control Car', 'Toys', 49.99, 24.0], ['Board Game: Strategy', 'Toys', 29.99, 12.5],
    ['Plush Bear', 'Toys', 16.0, 5.5],
  ].map((p, i) => [i + 1, ...p])
  // popularity weights per product
  const pop = products.map((p) => [p, p[3] < 20 ? 6 : p[3] < 50 ? 4 : p[3] < 100 ? 2.5 : 1.2])

  const orders = [], items = []
  let itemId = 1
  const monthWeight = [8, 6, 7, 7, 8, 8, 8, 8, 8, 9, 13, 16]
  let orderId = 1001
  for (const year of [2023, 2024]) {
    const yearOrders = year === 2023 ? 950 : 1100
    for (let k = 0; k < yearOrders; k++) {
      const month = weighted(monthWeight.map((w, m) => [m, w]))
      const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(int(1, days)).padStart(2, '0')}`
      const eligible = customers.filter((c) => c[6] <= date)
      if (!eligible.length) continue
      // repeat customers: favour lower ids (older, loyal customers)
      const cust = rand() < 0.35 ? eligible[Math.floor(rand() * Math.min(40, eligible.length))] : pick(eligible)
      const channel = weighted([['Online', 50], ['In-store', 35], ['Mobile App', year === 2024 ? 20 : 12]])
      const status = weighted([['Completed', 88], ['Returned', 6], ['Cancelled', 6]])
      orders.push([orderId, cust[0], date, channel, status])
      const n = weighted([[1, 45], [2, 30], [3, 17], [4, 8]])
      const used = new Set()
      for (let j = 0; j < n; j++) {
        const p = weighted(pop)
        if (used.has(p[0])) continue
        used.add(p[0])
        const price = year === 2024 ? round2(p[3] * 1.05) : p[3]
        const discount = weighted([[0, 75], [0.1, 18], [0.2, 7]])
        items.push([itemId++, orderId, p[0], weighted([[1, 70], [2, 22], [3, 8]]), price, discount])
      }
      orderId++
    }
  }
  orders.sort((a, b) => (a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : a[0] - b[0]))

  return `-- Retail dataset: customers, products, orders and order lines (2023-2024)
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  city TEXT,
  country TEXT NOT NULL,
  signup_date TEXT NOT NULL,
  segment TEXT NOT NULL
);
CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_price REAL NOT NULL,
  unit_cost REAL NOT NULL
);
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  order_date TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE order_items (
  order_item_id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id),
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0
);
${inserts('customers', ['customer_id', 'first_name', 'last_name', 'email', 'city', 'country', 'signup_date', 'segment'], customers)}
${inserts('products', ['product_id', 'product_name', 'category', 'unit_price', 'unit_cost'], products)}
${inserts('orders', ['order_id', 'customer_id', 'order_date', 'channel', 'status'], orders)}
${inserts('order_items', ['order_item_id', 'order_id', 'product_id', 'quantity', 'unit_price', 'discount'], items)}
`
}

/* =================================================================
   HR: employees, departments and performance reviews
   ================================================================= */
function hr() {
  rand = mulberry32(77)
  const departments = [
    [1, 'Executive', 'London'], [2, 'Sales', 'London'], [3, 'Marketing', 'London'], [4, 'Finance', 'Manchester'],
    [5, 'Human Resources', 'Manchester'], [6, 'IT', 'Manchester'], [7, 'Operations', 'Birmingham'], [8, 'Customer Service', 'Glasgow'],
  ]
  const roles = {
    2: [['Sales Representative', 32000], ['Account Manager', 44000], ['Sales Manager', 62000]],
    3: [['Marketing Executive', 31000], ['Marketing Analyst', 40000], ['Marketing Manager', 58000]],
    4: [['Accounts Assistant', 27000], ['Financial Analyst', 45000], ['Finance Manager', 66000]],
    5: [['HR Assistant', 26000], ['HR Advisor', 36000], ['HR Manager', 55000]],
    6: [['IT Support Technician', 29000], ['Software Developer', 52000], ['IT Manager', 72000]],
    7: [['Warehouse Operative', 24000], ['Operations Analyst', 38000], ['Operations Manager', 57000]],
    8: [['Customer Service Advisor', 23500], ['Team Leader', 30000], ['Customer Service Manager', 45000]],
  }
  const headcount = { 2: 30, 3: 14, 4: 14, 5: 9, 6: 22, 7: 34, 8: 36 }
  const employees = []
  let id = 1
  const person = () => [pick(firstNames), pick(lastNames)]
  const gender = () => weighted([['Female', 48], ['Male', 49], ['Non-binary', 3]])
  const [cf, cl] = person()
  employees.push([id++, cf, cl, 1, 'Chief Executive Officer', null, '2012-03-01', 145000, gender(), null])
  for (const dep of [2, 3, 4, 5, 6, 7, 8]) {
    const [mgrTitle, mgrSal] = roles[dep][2]
    const [f, l] = person()
    const mgrId = id++
    employees.push([mgrId, f, l, dep, mgrTitle, 1, randDate('2012-06-01', '2018-12-31'), Math.round(mgrSal * (0.95 + rand() * 0.15) / 100) * 100, gender(), null])
    for (let k = 1; k < headcount[dep]; k++) {
      const level = weighted([[0, 65], [1, 35]])
      const [title, base] = roles[dep][level]
      const hire = randDate('2014-01-01', '2024-09-30')
      const years = (d('2024-12-31') - d(hire)) / (365 * DAY)
      const salary = Math.round((base * (0.92 + rand() * 0.16) * (1 + Math.min(years, 8) * 0.018)) / 100) * 100
      const term = rand() < 0.16 ? (() => { const t = addDays(hire, int(120, 2400)); return t < '2024-12-31' ? t : null })() : null
      const [f2, l2] = person()
      employees.push([id++, f2, l2, dep, title, mgrId, hire, salary, gender(), term])
    }
  }
  const reviews = []
  let rid = 1
  for (const year of [2021, 2022, 2023, 2024]) {
    for (const e of employees) {
      const hire = e[6], term = e[9]
      if (hire > `${year}-06-30`) continue
      if (term && term < `${year}-12-15`) continue
      const rating = weighted([[1, 4], [2, 12], [3, 46], [4, 28], [5, 10]])
      reviews.push([rid++, e[0], year, rating, `${year}-12-${String(int(1, 15)).padStart(2, '0')}`])
    }
  }
  return `-- HR dataset: departments, employees and yearly performance reviews
CREATE TABLE departments (
  department_id INTEGER PRIMARY KEY,
  department_name TEXT NOT NULL,
  location TEXT NOT NULL
);
CREATE TABLE employees (
  employee_id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(department_id),
  job_title TEXT NOT NULL,
  manager_id INTEGER REFERENCES employees(employee_id),
  hire_date TEXT NOT NULL,
  salary INTEGER NOT NULL,
  gender TEXT NOT NULL,
  termination_date TEXT
);
CREATE TABLE performance_reviews (
  review_id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
  review_year INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_date TEXT NOT NULL
);
${inserts('departments', ['department_id', 'department_name', 'location'], departments)}
${inserts('employees', ['employee_id', 'first_name', 'last_name', 'department_id', 'job_title', 'manager_id', 'hire_date', 'salary', 'gender', 'termination_date'], employees)}
${inserts('performance_reviews', ['review_id', 'employee_id', 'review_year', 'rating', 'review_date'], reviews)}
`
}

/* =================================================================
   INVENTORY: warehouses, suppliers, stock and purchase orders
   ================================================================= */
function inventory() {
  rand = mulberry32(31337)
  const warehouses = [[1, 'London Central', 'London', 12000], [2, 'Manchester North', 'Manchester', 9000], [3, 'Bristol West', 'Bristol', 6000], [4, 'Glasgow Hub', 'Glasgow', 5000]]
  const suppliers = [
    [1, 'Northwind Electronics', 'China', 35], [2, 'Brightway Homeware', 'United Kingdom', 7], [3, 'Alpine Sports Supply', 'Germany', 14],
    [4, 'PageTurner Distribution', 'United Kingdom', 5], [5, 'Lumen Beauty Co', 'France', 12], [6, 'Playful Toys Ltd', 'China', 40],
    [7, 'Celtic Kitchen Goods', 'Ireland', 9], [8, 'Delta Components', 'Taiwan', 30],
  ]
  const catalogue = [
    ['Wireless Earbuds', 'Electronics', 1, 31.0], ['Bluetooth Speaker', 'Electronics', 1, 19.5], ['USB-C Charger 65W', 'Electronics', 8, 9.8],
    ['Smart Watch', 'Electronics', 8, 88.0], ['Phone Case', 'Electronics', 1, 3.1], ['Portable Power Bank', 'Electronics', 8, 13.4],
    ['Non-stick Frying Pan', 'Home & Kitchen', 7, 11.2], ['Chef Knife', 'Home & Kitchen', 7, 12.9], ['Electric Kettle', 'Home & Kitchen', 2, 15.1],
    ['Air Fryer', 'Home & Kitchen', 2, 52.0], ['Bath Towel Set', 'Home & Kitchen', 2, 10.5], ['Scented Candle', 'Home & Kitchen', 2, 4.2],
    ['Yoga Mat', 'Sports', 3, 9.0], ['Dumbbell Set 10kg', 'Sports', 3, 26.0], ['Running Water Bottle', 'Sports', 3, 3.4], ['Cycling Helmet', 'Sports', 3, 27.5],
    ['Data Analysis Handbook', 'Books', 4, 14.0], ['Mystery Novel', 'Books', 4, 3.6], ['Cookbook: Quick Dinners', 'Books', 4, 7.1],
    ['Face Moisturiser', 'Beauty', 5, 6.0], ['Electric Toothbrush', 'Beauty', 5, 28.0], ['Perfume 50ml', 'Beauty', 5, 24.0],
    ['Building Blocks Set', 'Toys', 6, 17.0], ['Remote Control Car', 'Toys', 6, 24.0], ['Board Game: Strategy', 'Toys', 6, 12.5], ['Plush Bear', 'Toys', 6, 5.5],
  ]
  const products = catalogue.map((p, i) => [i + 1, `SKU-${String(1000 + i * 7)}`, p[0], p[1], p[2], p[3], p[3] < 10 ? 120 : p[3] < 30 ? 60 : 25])
  const stock = []
  for (const w of warehouses) {
    for (const p of products) {
      if (w[0] === 4 && rand() < 0.25) continue // Glasgow does not stock everything
      const reorder = Math.round(p[6] * (w[3] / 12000))
      const qty = rand() < 0.18 ? int(0, Math.max(1, reorder - 1)) : int(reorder, reorder * 5)
      stock.push([w[0], p[0], qty, Math.max(reorder, 5), randDate('2024-11-01', '2024-12-20')])
    }
  }
  const pos = []
  for (let i = 1; i <= 420; i++) {
    const p = pick(products)
    const s = suppliers[p[4] - 1]
    const w = weighted(warehouses.map((x) => [x, x[3]]))
    const order = randDate('2023-01-01', '2024-12-15')
    const expected = addDays(order, s[3])
    const delay = weighted([[0, 50], [int(-3, -1), 15], [int(1, 7), 25], [int(8, 30), 10]])
    let received = addDays(expected, delay)
    if (received > '2024-12-31') received = null
    const qOrdered = Math.round(p[6] * (1 + rand() * 3) / 5) * 5
    const qReceived = received === null ? null : rand() < 0.08 ? qOrdered - int(1, Math.max(1, Math.floor(qOrdered / 5))) : qOrdered
    const cost = round2(p[5] * (order >= '2024-01-01' ? 1.04 : 1) * (0.97 + rand() * 0.06))
    pos.push([i, s[0], p[0], w[0], order, expected, received, qOrdered, qReceived, cost])
  }
  pos.sort((a, b) => (a[4] < b[4] ? -1 : a[4] > b[4] ? 1 : 0))
  pos.forEach((r, i) => (r[0] = 5001 + i))
  return `-- Inventory dataset: warehouses, suppliers, products, stock levels and purchase orders
CREATE TABLE warehouses (
  warehouse_id INTEGER PRIMARY KEY,
  warehouse_name TEXT NOT NULL,
  city TEXT NOT NULL,
  capacity_units INTEGER NOT NULL
);
CREATE TABLE suppliers (
  supplier_id INTEGER PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  country TEXT NOT NULL,
  lead_time_days INTEGER NOT NULL
);
CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(supplier_id),
  unit_cost REAL NOT NULL,
  reorder_level INTEGER NOT NULL
);
CREATE TABLE stock_levels (
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id),
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  quantity_on_hand INTEGER NOT NULL,
  reorder_point INTEGER NOT NULL,
  last_counted TEXT NOT NULL,
  PRIMARY KEY (warehouse_id, product_id)
);
CREATE TABLE purchase_orders (
  po_id INTEGER PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(supplier_id),
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id),
  order_date TEXT NOT NULL,
  expected_date TEXT NOT NULL,
  received_date TEXT,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER,
  unit_cost REAL NOT NULL
);
${inserts('warehouses', ['warehouse_id', 'warehouse_name', 'city', 'capacity_units'], warehouses)}
${inserts('suppliers', ['supplier_id', 'supplier_name', 'country', 'lead_time_days'], suppliers)}
${inserts('products', ['product_id', 'sku', 'product_name', 'category', 'supplier_id', 'unit_cost', 'reorder_level'], products.map((p) => [p[0], p[1], p[2], p[3], p[4], p[5], p[6]]))}
${inserts('stock_levels', ['warehouse_id', 'product_id', 'quantity_on_hand', 'reorder_point', 'last_counted'], stock)}
${inserts('purchase_orders', ['po_id', 'supplier_id', 'product_id', 'warehouse_id', 'order_date', 'expected_date', 'received_date', 'quantity_ordered', 'quantity_received', 'unit_cost'], pos)}
`
}

for (const [name, fn] of [['retail', retail], ['hr', hr], ['inventory', inventory]]) {
  const sql = fn()
  writeFileSync(join(outDir, `${name}.sql`), sql)
  console.log(`${name}.sql  ${(sql.length / 1024).toFixed(0)} KB`)
}
