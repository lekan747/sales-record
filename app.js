const salesForm = document.getElementById("salesForm");
const salesTableBody = document.getElementById("salesTableBody");

let sales = JSON.parse(localStorage.getItem("salesRecords")) || [];

function formatNaira(amount) {
  return "₦" + amount.toLocaleString();
}

function saveSales() {
  localStorage.setItem("salesRecords", JSON.stringify(sales));
}

function renderSales() {
  salesTableBody.innerHTML = "";

  const filterDate = document.getElementById("filterDate").value;
  const filterPayment = document.getElementById("filterPayment").value;

  sales.forEach((sale, index) => {
    if (filterDate && sale.date !== filterDate) return;
    if (filterPayment && sale.paymentType !== filterPayment) return;

    const total = sale.quantity * sale.price;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${sale.date}</td>
      <td>${sale.product}</td>
      <td>${sale.quantity}</td>
      <td>${formatNaira(sale.price)}</td>
      <td>${formatNaira(total)}</td>
      <td>${sale.customer || "-"}</td>
      <td>${sale.paymentType}</td>
      <td>${sale.isCredit && !sale.isPaid ? "Owing" : "Paid"}</td>
      <td>
        ${sale.isCredit && !sale.isPaid ? `<button onclick="markAsPaid(${index})">Mark Paid</button>` : ""}
        <button onclick="editSale(${index})">Edit</button>
        <button onclick="deleteSale(${index})">Delete</button>
      </td>
    `;
    salesTableBody.appendChild(row);
  });

  calculateSummary();
  calculateCredit();
}

function calculateSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  let todayTotal = 0;
  let monthTotal = 0;

  sales.forEach(sale => {
    const total = sale.quantity * sale.price;
    if (sale.date === today) todayTotal += total;
    if (sale.date.startsWith(month)) monthTotal += total;
  });

  document.getElementById("todayTotal").textContent = formatNaira(todayTotal);
  document.getElementById("monthTotal").textContent = formatNaira(monthTotal);
}

function calculateCredit() {
  let creditMap = {};
  let totalCredit = 0;

  sales.forEach(sale => {
    if (sale.isCredit && !sale.isPaid) {
      const total = sale.quantity * sale.price;
      totalCredit += total;
      creditMap[sale.customer] = (creditMap[sale.customer] || 0) + total;
    }
  });

  document.getElementById("totalCredit").textContent = formatNaira(totalCredit);

  const list = document.getElementById("creditList");
  list.innerHTML = "";
  for (let customer in creditMap) {
    const li = document.createElement("li");
    li.textContent = `${customer} — ${formatNaira(creditMap[customer])}`;
    list.appendChild(li);
  }
}

function markAsPaid(index) {
  sales[index].isPaid = true;
  saveSales();
  renderSales();
}

salesForm.addEventListener("submit", e => {
  e.preventDefault();

  const isCredit = document.getElementById("isCredit").checked;
  const customer = document.getElementById("customer").value;

  sales.push({
    id: Date.now(),
    date: date.value,
    product: product.value,
    quantity: Number(quantity.value),
    price: Number(price.value),
    customer,
    paymentType: paymentType.value,
    notes: notes.value,
    isCredit: isCredit && customer !== "",
    isPaid: !isCredit
  });

  saveSales();
  renderSales();
  salesForm.reset();
});

function deleteSale(index) {
  if (confirm("Delete this sale?")) {
    sales.splice(index, 1);
    saveSales();
    renderSales();
  }
}

function editSale(index) {
  const sale = sales[index];
  date.value = sale.date;
  product.value = sale.product;
  quantity.value = sale.quantity;
  price.value = sale.price;
  customer.value = sale.customer;
  paymentType.value = sale.paymentType;
  notes.value = sale.notes;
  isCredit.checked = sale.isCredit;

  sales.splice(index, 1);
  saveSales();
  renderSales();
}

function exportData() {
  const blob = new Blob([JSON.stringify(sales)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sales-records.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    sales = JSON.parse(e.target.result);
    saveSales();
    renderSales();
  };
  reader.readAsText(file);
}

renderSales();
