import type { DatasetId } from '@/content/datasets'
import type { Level } from '@/types/content'

export interface SqlChallenge {
  id: string
  dataset: DatasetId
  level: Level
  title: string
  prompt: string
  hint: string
  solution: string
  /** true when the expected answer has a required row order (ORDER BY). */
  ordered: boolean
  /** Lesson that teaches the skill, if any. */
  lessonId?: string
}

export const challenges: SqlChallenge[] = [
  /* ---------------- Retail ---------------- */
  {
    id: 'r-01', dataset: 'retail', level: 'beginner', title: 'Cheap products',
    prompt: 'List the `product_name` and `unit_price` of every product that costs less than £15, cheapest first.',
    hint: 'Use WHERE unit_price < 15 and ORDER BY unit_price.',
    solution: 'SELECT product_name, unit_price FROM products WHERE unit_price < 15 ORDER BY unit_price;',
    ordered: true, lessonId: 'da-04-03',
  },
  {
    id: 'r-02', dataset: 'retail', level: 'beginner', title: 'Customers in Dublin',
    prompt: 'Show the `first_name`, `last_name` and `signup_date` of customers who live in Dublin, ordered by signup date (oldest first).',
    hint: "Text values go in single quotes: city = 'Dublin'.",
    solution: "SELECT first_name, last_name, signup_date FROM customers WHERE city = 'Dublin' ORDER BY signup_date, last_name, first_name;",
    ordered: false, lessonId: 'da-04-03',
  },
  {
    id: 'r-03', dataset: 'retail', level: 'beginner', title: 'Missing emails',
    prompt: 'How many customers have no email address recorded? Return a single number.',
    hint: 'Missing values are NULL. Compare with IS NULL, never = NULL.',
    solution: 'SELECT COUNT(*) FROM customers WHERE email IS NULL;',
    ordered: false, lessonId: 'da-04-03',
  },
  {
    id: 'r-04', dataset: 'retail', level: 'beginner', title: 'Orders by channel',
    prompt: 'Count the orders per `channel`. Return channel and the count, largest first.',
    hint: 'GROUP BY channel, then ORDER BY the count DESC.',
    solution: 'SELECT channel, COUNT(*) AS orders FROM orders GROUP BY channel ORDER BY orders DESC;',
    ordered: true, lessonId: 'da-04-06',
  },
  {
    id: 'r-05', dataset: 'retail', level: 'intermediate', title: 'Revenue by category',
    prompt: 'Calculate net revenue per product `category` for **Completed** orders only. Net revenue for a line is `quantity * unit_price * (1 - discount)`. Return category and revenue rounded to 2 decimals, highest first.',
    hint: 'Join order_items to products and to orders, filter on status, then GROUP BY category.',
    solution: `SELECT p.category, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)), 2) AS revenue
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
JOIN orders o ON o.order_id = oi.order_id
WHERE o.status = 'Completed'
GROUP BY p.category
ORDER BY revenue DESC;`,
    ordered: true, lessonId: 'da-05-01',
  },
  {
    id: 'r-06', dataset: 'retail', level: 'intermediate', title: 'Monthly orders in 2024',
    prompt: 'For 2024, count orders per month. Return the month as `YYYY-MM` and the number of orders, in calendar order.',
    hint: "Dates are stored as text 'YYYY-MM-DD', so substr(order_date, 1, 7) gives the month.",
    solution: "SELECT substr(order_date, 1, 7) AS month, COUNT(*) AS orders FROM orders WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01' GROUP BY month ORDER BY month;",
    ordered: true, lessonId: 'da-04-06',
  },
  {
    id: 'r-07', dataset: 'retail', level: 'intermediate', title: 'Loyal customers',
    prompt: 'Find customers with **more than 15** orders (any status). Return `customer_id`, first name, last name and the number of orders, most orders first.',
    hint: 'GROUP BY the customer, then filter groups with HAVING.',
    solution: `SELECT c.customer_id, c.first_name, c.last_name, COUNT(*) AS orders
FROM orders o JOIN customers c ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name
HAVING COUNT(*) > 15
ORDER BY orders DESC, c.customer_id;`,
    ordered: true, lessonId: 'da-04-06',
  },
  {
    id: 'r-08', dataset: 'retail', level: 'intermediate', title: 'Customers who never ordered',
    prompt: 'List the `customer_id` and `signup_date` of customers who have never placed an order, ordered by customer_id.',
    hint: 'LEFT JOIN customers to orders and keep the rows where the order side IS NULL.',
    solution: 'SELECT c.customer_id, c.signup_date FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL ORDER BY c.customer_id;',
    ordered: true, lessonId: 'da-05-01',
  },
  {
    id: 'r-09', dataset: 'retail', level: 'advanced', title: 'Top product per category',
    prompt: 'For each category, find the single product with the most units sold (Completed orders). Return category, product_name and units, ordered by category.',
    hint: 'Aggregate units per product in a CTE, then use ROW_NUMBER() OVER (PARTITION BY category ORDER BY units DESC).',
    solution: `WITH units AS (
  SELECT p.category, p.product_name, SUM(oi.quantity) AS units
  FROM order_items oi
  JOIN products p ON p.product_id = oi.product_id
  JOIN orders o ON o.order_id = oi.order_id
  WHERE o.status = 'Completed'
  GROUP BY p.category, p.product_name
), ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY units DESC, product_name) AS rn FROM units
)
SELECT category, product_name, units FROM ranked WHERE rn = 1 ORDER BY category;`,
    ordered: true, lessonId: 'da-05-05',
  },
  {
    id: 'r-10', dataset: 'retail', level: 'advanced', title: 'Year-over-year revenue',
    prompt: 'Show net revenue (Completed orders) for each year and the percentage change versus the previous year. Return year, revenue (2 dp) and pct_change (1 dp, NULL for the first year).',
    hint: 'Aggregate per year in a CTE, then use LAG(revenue) OVER (ORDER BY year).',
    solution: `WITH yearly AS (
  SELECT substr(o.order_date, 1, 4) AS year, SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) AS revenue
  FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
  WHERE o.status = 'Completed'
  GROUP BY year
)
SELECT year, ROUND(revenue, 2) AS revenue,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY year)) / LAG(revenue) OVER (ORDER BY year), 1) AS pct_change
FROM yearly ORDER BY year;`,
    ordered: true, lessonId: 'da-05-05',
  },

  /* ---------------- HR ---------------- */
  {
    id: 'h-01', dataset: 'hr', level: 'beginner', title: 'Highest earners',
    prompt: 'List the 10 highest-paid employees: first_name, last_name, job_title and salary, highest salary first.',
    hint: 'ORDER BY salary DESC and LIMIT 10.',
    solution: 'SELECT first_name, last_name, job_title, salary FROM employees ORDER BY salary DESC, employee_id LIMIT 10;',
    ordered: false, lessonId: 'da-04-04',
  },
  {
    id: 'h-02', dataset: 'hr', level: 'beginner', title: 'Current headcount',
    prompt: 'How many employees are currently employed (no termination date)? Return a single number.',
    hint: 'termination_date IS NULL means still employed.',
    solution: 'SELECT COUNT(*) FROM employees WHERE termination_date IS NULL;',
    ordered: false, lessonId: 'da-04-03',
  },
  {
    id: 'h-03', dataset: 'hr', level: 'beginner', title: 'Average salary by department',
    prompt: 'Show each department_name with the average salary of its current employees, rounded to 0 decimals, highest first.',
    hint: 'Join employees to departments, filter current staff, GROUP BY department_name, ROUND(AVG(salary)).',
    solution: `SELECT d.department_name, ROUND(AVG(e.salary)) AS avg_salary
FROM employees e JOIN departments d ON d.department_id = e.department_id
WHERE e.termination_date IS NULL
GROUP BY d.department_name
ORDER BY avg_salary DESC;`,
    ordered: true, lessonId: 'da-05-01',
  },
  {
    id: 'h-04', dataset: 'hr', level: 'intermediate', title: 'Leavers by year',
    prompt: 'Count how many employees left in each year. Return the year (`YYYY`) and the number of leavers, in year order.',
    hint: 'Only rows with a termination_date. substr(termination_date, 1, 4) gives the year.',
    solution: 'SELECT substr(termination_date, 1, 4) AS year, COUNT(*) AS leavers FROM employees WHERE termination_date IS NOT NULL GROUP BY year ORDER BY year;',
    ordered: true, lessonId: 'da-04-06',
  },
  {
    id: 'h-05', dataset: 'hr', level: 'intermediate', title: 'Employees and their managers',
    prompt: "List every employee in the IT department (department_id 6) with their manager's full name. Return employee first_name, last_name and manager_name (first and last name separated by a space), ordered by employee last_name then first_name.",
    hint: 'Self-join: employees e JOIN employees m ON m.employee_id = e.manager_id. Concatenate with ||.',
    solution: `SELECT e.first_name, e.last_name, m.first_name || ' ' || m.last_name AS manager_name
FROM employees e JOIN employees m ON m.employee_id = e.manager_id
WHERE e.department_id = 6
ORDER BY e.last_name, e.first_name;`,
    ordered: false, lessonId: 'da-05-01',
  },
  {
    id: 'h-06', dataset: 'hr', level: 'intermediate', title: 'Average rating per department (2024)',
    prompt: 'For the 2024 reviews, show each department_name with the average rating (2 dp) and the number of reviews. Highest average first.',
    hint: 'Join performance_reviews → employees → departments and filter review_year = 2024.',
    solution: `SELECT d.department_name, ROUND(AVG(r.rating), 2) AS avg_rating, COUNT(*) AS reviews
FROM performance_reviews r
JOIN employees e ON e.employee_id = r.employee_id
JOIN departments d ON d.department_id = e.department_id
WHERE r.review_year = 2024
GROUP BY d.department_name
ORDER BY avg_rating DESC, d.department_name;`,
    ordered: true, lessonId: 'da-05-01',
  },
  {
    id: 'h-07', dataset: 'hr', level: 'advanced', title: 'Paid above department average',
    prompt: 'List current employees who earn more than the average salary of current employees **in their own department**. Return first_name, last_name, department_id and salary, ordered by department_id then salary descending.',
    hint: 'Use a correlated subquery, or a CTE with AVG(salary) OVER (PARTITION BY department_id).',
    solution: `WITH cur AS (
  SELECT *, AVG(salary) OVER (PARTITION BY department_id) AS dept_avg
  FROM employees WHERE termination_date IS NULL
)
SELECT first_name, last_name, department_id, salary FROM cur WHERE salary > dept_avg ORDER BY department_id, salary DESC;`,
    ordered: false, lessonId: 'da-05-02',
  },
  {
    id: 'h-08', dataset: 'hr', level: 'advanced', title: 'Salary rank within department',
    prompt: 'For current Sales employees (department_id 2), show first_name, last_name, salary and their salary rank within Sales (1 = highest) using DENSE_RANK. Order by rank.',
    hint: 'DENSE_RANK() OVER (ORDER BY salary DESC).',
    solution: `SELECT first_name, last_name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS salary_rank
FROM employees WHERE department_id = 2 AND termination_date IS NULL
ORDER BY salary_rank, last_name, first_name;`,
    ordered: false, lessonId: 'da-05-05',
  },

  /* ---------------- Inventory ---------------- */
  {
    id: 'i-01', dataset: 'inventory', level: 'beginner', title: 'Suppliers by lead time',
    prompt: 'List supplier_name, country and lead_time_days for all suppliers, longest lead time first.',
    hint: 'ORDER BY lead_time_days DESC.',
    solution: 'SELECT supplier_name, country, lead_time_days FROM suppliers ORDER BY lead_time_days DESC, supplier_name;',
    ordered: false, lessonId: 'da-04-04',
  },
  {
    id: 'i-02', dataset: 'inventory', level: 'beginner', title: 'Open purchase orders',
    prompt: 'How many purchase orders have not been received yet? Return a single number.',
    hint: 'An open order has received_date IS NULL.',
    solution: 'SELECT COUNT(*) FROM purchase_orders WHERE received_date IS NULL;',
    ordered: false, lessonId: 'da-04-03',
  },
  {
    id: 'i-03', dataset: 'inventory', level: 'beginner', title: 'Stock per warehouse',
    prompt: 'Total units on hand per warehouse_id. Return warehouse_id and total units, largest first.',
    hint: 'SUM(quantity_on_hand) with GROUP BY warehouse_id.',
    solution: 'SELECT warehouse_id, SUM(quantity_on_hand) AS units FROM stock_levels GROUP BY warehouse_id ORDER BY units DESC;',
    ordered: true, lessonId: 'da-04-06',
  },
  {
    id: 'i-04', dataset: 'inventory', level: 'intermediate', title: 'Stock value by category',
    prompt: 'Calculate the value of stock on hand (`quantity_on_hand * unit_cost`) per product category across all warehouses. Return category and value (2 dp), highest first.',
    hint: 'Join stock_levels to products, then GROUP BY category.',
    solution: `SELECT p.category, ROUND(SUM(s.quantity_on_hand * p.unit_cost), 2) AS stock_value
FROM stock_levels s JOIN products p ON p.product_id = s.product_id
GROUP BY p.category ORDER BY stock_value DESC;`,
    ordered: true, lessonId: 'da-05-01',
  },
  {
    id: 'i-05', dataset: 'inventory', level: 'intermediate', title: 'Late deliveries by supplier',
    prompt: 'For received purchase orders, count how many arrived **after** the expected date per supplier. Return supplier_name, received orders, late orders, and the late percentage (1 dp), worst percentage first.',
    hint: "Dates are 'YYYY-MM-DD' text, so received_date > expected_date works. SUM(CASE WHEN ... THEN 1 ELSE 0 END) counts the late ones.",
    solution: `SELECT s.supplier_name,
       COUNT(*) AS received,
       SUM(CASE WHEN po.received_date > po.expected_date THEN 1 ELSE 0 END) AS late,
       ROUND(100.0 * SUM(CASE WHEN po.received_date > po.expected_date THEN 1 ELSE 0 END) / COUNT(*), 1) AS late_pct
FROM purchase_orders po JOIN suppliers s ON s.supplier_id = po.supplier_id
WHERE po.received_date IS NOT NULL
GROUP BY s.supplier_name
ORDER BY late_pct DESC, s.supplier_name;`,
    ordered: true, lessonId: 'da-05-04',
  },
  {
    id: 'i-06', dataset: 'inventory', level: 'intermediate', title: 'Short deliveries',
    prompt: 'List purchase orders where fewer units were received than ordered. Return po_id, product_name, quantity_ordered, quantity_received and the shortfall, biggest shortfall first.',
    hint: 'Join to products; filter quantity_received < quantity_ordered.',
    solution: `SELECT po.po_id, p.product_name, po.quantity_ordered, po.quantity_received, po.quantity_ordered - po.quantity_received AS shortfall
FROM purchase_orders po JOIN products p ON p.product_id = po.product_id
WHERE po.quantity_received < po.quantity_ordered
ORDER BY shortfall DESC, po.po_id;`,
    ordered: true, lessonId: 'da-05-01',
  },
  {
    id: 'i-07', dataset: 'inventory', level: 'advanced', title: 'Shortages in several warehouses',
    prompt: 'Find products that are below their reorder point in **two or more** warehouses. Return product_name and the number of warehouses where it is short, most first, then by product_name.',
    hint: 'GROUP BY product and count only the short rows with SUM(CASE WHEN quantity_on_hand < reorder_point THEN 1 ELSE 0 END), then filter with HAVING.',
    solution: `SELECT p.product_name, SUM(CASE WHEN s.quantity_on_hand < s.reorder_point THEN 1 ELSE 0 END) AS short_warehouses
FROM stock_levels s JOIN products p ON p.product_id = s.product_id
GROUP BY p.product_name
HAVING short_warehouses >= 2
ORDER BY short_warehouses DESC, p.product_name;`,
    ordered: true, lessonId: 'da-05-04',
  },
  {
    id: 'i-08', dataset: 'inventory', level: 'advanced', title: 'Average delay in days',
    prompt: 'For received orders, calculate the average delivery delay in days (received minus expected; negative = early) per supplier. Return supplier_name and avg_delay_days (1 dp), largest delay first.',
    hint: 'julianday(received_date) - julianday(expected_date) gives the difference in days.',
    solution: `SELECT s.supplier_name, ROUND(AVG(julianday(po.received_date) - julianday(po.expected_date)), 1) AS avg_delay_days
FROM purchase_orders po JOIN suppliers s ON s.supplier_id = po.supplier_id
WHERE po.received_date IS NOT NULL
GROUP BY s.supplier_name
ORDER BY avg_delay_days DESC, s.supplier_name;`,
    ordered: true, lessonId: 'da-05-04',
  },
]
