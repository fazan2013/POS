// ================================================
// src/utils/exportReportPDF.js
// PDF export utility using browser print API
// No extra packages needed!
// ================================================

export function exportReportPDF(data, activeRange) {
  const {
    orderSummary,
    partStats,
    lowStockParts,
    recentOrders,
    topParts,
    categoryBreakdown,
    customerStats,
    supplierStats,
  } = data

  const now       = new Date().toLocaleString()
  const rangeText = activeRange || 'This month'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>PartsPro Report — ${rangeText}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 12px;
      color: #1e293b;
      background: white;
      padding: 32px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 2px solid #0f172a;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 40px; height: 40px;
      background: #0f172a;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 18px; font-weight: bold;
    }
    .brand-name  { font-size: 20px; font-weight: 600; color: #0f172a; }
    .brand-sub   { font-size: 11px; color: #64748b; margin-top: 2px; }
    .report-meta { text-align: right; }
    .report-title{ font-size: 16px; font-weight: 600; color: #0f172a; }
    .report-date { font-size: 11px; color: #64748b; margin-top: 4px; }
    .report-range{
      display: inline-block;
      background: #f1f5f9; color: #475569;
      padding: 2px 10px; border-radius: 20px;
      font-size: 10px; margin-top: 6px;
    }

    /* ── Section ── */
    .section       { margin-bottom: 28px; }
    .section-title {
      font-size: 13px; font-weight: 600; color: #0f172a;
      margin-bottom: 12px; padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    /* ── KPI Grid ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }
    .kpi-label {
      font-size: 9px; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .kpi-value { font-size: 20px; font-weight: 600; color: #0f172a; }
    .kpi-sub   { font-size: 10px; color: #64748b; margin-top: 4px; }
    .kpi-blue   { border-left: 3px solid #3b82f6; }
    .kpi-green  { border-left: 3px solid #22c55e; }
    .kpi-amber  { border-left: 3px solid #f59e0b; }
    .kpi-purple { border-left: 3px solid #a855f7; }
    .kpi-red    { border-left: 3px solid #ef4444; }

    /* ── 2-col grid ── */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

    /* ── Stat box ── */
    .stat-box {
      border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 12px; text-align: center;
    }
    .stat-val   { font-size: 18px; font-weight: 600; color: #0f172a; }
    .stat-label { font-size: 10px; color: #64748b; margin-top: 4px; }
    .green { color: #16a34a; }
    .amber { color: #d97706; }
    .red   { color: #dc2626; }
    .blue  { color: #2563eb; }
    .purple{ color: #7c3aed; }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; padding: 8px 10px;
      font-size: 9px; font-weight: 600;
      color: #94a3b8; text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 8px 10px;
      font-size: 11px; color: #374151;
      border-bottom: 1px solid #f1f5f9;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fafc; }
    .table-wrap {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }
    .mono { font-family: monospace; font-size: 10px; color: #94a3b8; }
    .badge {
      display: inline-block; padding: 2px 8px;
      border-radius: 20px; font-size: 9px; font-weight: 600;
    }
    .badge-green  { background: #dcfce7; color: #166534; }
    .badge-amber  { background: #fef9c3; color: #854d0e; }
    .badge-red    { background: #fee2e2; color: #991b1b; }
    .badge-blue   { background: #dbeafe; color: #1e40af; }

    /* ── Progress bar ── */
    .progress-row { margin-bottom: 10px; }
    .progress-label {
      display: flex; justify-content: space-between;
      font-size: 11px; margin-bottom: 4px;
    }
    .progress-track {
      width: 100%; height: 6px;
      background: #f1f5f9; border-radius: 3px; overflow: hidden;
    }
    .progress-fill { height: 100%; border-radius: 3px; }

    /* ── Footer ── */
    .footer {
      margin-top: 32px; padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex; justify-content: space-between;
      font-size: 10px; color: #94a3b8;
    }

    /* ── Print ── */
    @media print {
      body { padding: 20px; }
      .no-break { page-break-inside: avoid; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>

  <!-- ── HEADER ── -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">P</div>
      <div>
        <div class="brand-name">PartsPro</div>
        <div class="brand-sub">Inventory & POS System</div>
      </div>
    </div>
    <div class="report-meta">
      <div class="report-title">Business Report</div>
      <div class="report-date">Generated: ${now}</div>
      <div class="report-range">${rangeText}</div>
    </div>
  </div>

  <!-- ── SECTION 1: KPI SUMMARY ── -->
  <div class="section no-break">
    <div class="section-title">📊 Key Performance Indicators</div>
    <div class="kpi-grid">
      <div class="kpi-card kpi-blue">
        <div class="kpi-label">Monthly Revenue</div>
        <div class="kpi-value blue">$${(orderSummary?.monthlyRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="kpi-sub">This month</div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label">Today's Revenue</div>
        <div class="kpi-value green">$${(orderSummary?.todayRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="kpi-sub">Today</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label">Total Orders</div>
        <div class="kpi-value purple">${orderSummary?.totalOrders ?? 0}</div>
        <div class="kpi-sub">All time</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label">Avg Order Value</div>
        <div class="kpi-value amber">$${(orderSummary?.averageOrderValue ?? 0).toFixed(2)}</div>
        <div class="kpi-sub">Per order</div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label">Total Parts</div>
        <div class="kpi-value green">${partStats?.totalParts ?? 0}</div>
        <div class="kpi-sub">In inventory</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label">Low Stock</div>
        <div class="kpi-value amber">${partStats?.lowStockCount ?? 0}</div>
        <div class="kpi-sub">Needs reorder</div>
      </div>
      <div class="kpi-card kpi-red">
        <div class="kpi-label">Out of Stock</div>
        <div class="kpi-value red">${partStats?.outOfStockCount ?? 0}</div>
        <div class="kpi-sub">Action required</div>
      </div>
      <div class="kpi-card kpi-blue">
        <div class="kpi-label">Inventory Value</div>
        <div class="kpi-value blue">$${(partStats?.inventoryValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="kpi-sub">Total stock value</div>
      </div>
    </div>
  </div>

  <!-- ── SECTION 2: ORDER BREAKDOWN ── -->
  <div class="section no-break">
    <div class="section-title">🛒 Order Status Breakdown</div>
    <div class="three-col">
      <div class="stat-box">
        <div class="stat-val green">${orderSummary?.completed ?? 0}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-box">
        <div class="stat-val blue">${orderSummary?.processing ?? 0}</div>
        <div class="stat-label">Processing</div>
      </div>
      <div class="stat-box">
        <div class="stat-val red">${orderSummary?.cancelled ?? 0}</div>
        <div class="stat-label">Cancelled</div>
      </div>
    </div>
  </div>

  <!-- ── SECTION 3: CATEGORY BREAKDOWN ── -->
  ${categoryBreakdown && categoryBreakdown.length > 0 ? `
  <div class="section no-break">
    <div class="section-title">📦 Inventory by Category</div>
    ${categoryBreakdown.map((c, i) => {
      const colors = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ef4444']
      const color  = colors[i % colors.length]
      const pctVal = categoryBreakdown[0].count > 0
        ? Math.round((c.count / categoryBreakdown[0].count) * 100) : 0
      return `
      <div class="progress-row">
        <div class="progress-label">
          <span>${c.category}</span>
          <span style="color:#64748b">${c.count} parts</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill"
               style="width:${pctVal}%; background:${color}"></div>
        </div>
      </div>`
    }).join('')}
  </div>
  ` : ''}

  <!-- ── SECTION 4: TOP PARTS ── -->
  ${topParts && topParts.length > 0 ? `
  <div class="section no-break">
    <div class="section-title">🏆 Top Parts (by sell price)</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Part name</th>
            <th>Code</th>
            <th>Category</th>
            <th>Sell price</th>
            <th>In stock</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${topParts.slice(0, 10).map((part, i) => `
          <tr>
            <td style="color:#94a3b8">${i + 1}</td>
            <td><strong>${part.name}</strong></td>
            <td class="mono">${part.partCode}</td>
            <td>${part.category}</td>
            <td><strong>$${part.sellPrice?.toFixed(2)}</strong></td>
            <td>${part.quantity} ${part.unit}</td>
            <td>
              <span class="badge ${
                part.stockStatus === 'Out of stock' ? 'badge-red'
                : part.stockStatus === 'Low stock'  ? 'badge-amber'
                : 'badge-green'
              }">
                ${part.stockStatus}
              </span>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  <!-- ── SECTION 5: LOW STOCK REPORT ── -->
  ${lowStockParts && lowStockParts.length > 0 ? `
  <div class="section no-break page-break">
    <div class="section-title">⚠️ Low Stock Report</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Part name</th>
            <th>Code</th>
            <th>Current stock</th>
            <th>Min stock</th>
            <th>Shortage</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${lowStockParts.map(part => `
          <tr>
            <td><strong>${part.name}</strong></td>
            <td class="mono">${part.partCode}</td>
            <td>${part.quantity}</td>
            <td>${part.minStock}</td>
            <td class="red"><strong>${part.minStock - part.quantity} needed</strong></td>
            <td>
              <span class="badge ${part.quantity === 0 ? 'badge-red' : 'badge-amber'}">
                ${part.quantity === 0 ? 'Out of stock' : 'Low stock'}
              </span>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : `
  <div class="section no-break">
    <div class="section-title">⚠️ Low Stock Report</div>
    <div style="text-align:center; padding: 20px; color: #22c55e; font-weight: 600;">
      ✅ All parts are well stocked!
    </div>
  </div>
  `}

  <!-- ── SECTION 6: RECENT ORDERS ── -->
  ${recentOrders && recentOrders.length > 0 ? `
  <div class="section no-break">
    <div class="section-title">📋 Recent Orders (Last 10)</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${recentOrders.map(order => `
          <tr>
            <td><span class="badge badge-blue">${order.orderNumber}</span></td>
            <td>${order.customerName}</td>
            <td>${order.paymentMethod}</td>
            <td>
              <span class="badge ${
                order.status === 'Completed'  ? 'badge-green'
                : order.status === 'Cancelled' ? 'badge-red'
                : 'badge-amber'
              }">
                ${order.status}
              </span>
            </td>
            <td><strong>$${order.total?.toFixed(2)}</strong></td>
            <td style="color:#94a3b8">${new Date(order.createdAt).toLocaleDateString()}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  <!-- ── SECTION 7: CUSTOMERS & SUPPLIERS ── -->
  <div class="section no-break">
    <div class="section-title">👥 Customers & Suppliers Summary</div>
    <div class="two-col">
      <div>
        <p style="font-size:11px; font-weight:600; color:#64748b; margin-bottom:10px">
          CUSTOMERS
        </p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
          ${customerStats ? [
            { label: 'Total',    value: customerStats.total,    color: 'color:#0f172a'   },
            { label: 'Active',   value: customerStats.active,   color: 'color:#16a34a'   },
            { label: 'VIP',      value: customerStats.vip,      color: 'color:#d97706'   },
            { label: 'Workshop', value: customerStats.workshop,  color: 'color:#2563eb'   },
          ].map(s => `
            <div class="stat-box">
              <div class="stat-val" style="${s.color}">${s.value}</div>
              <div class="stat-label">${s.label}</div>
            </div>
          `).join('') : '<p style="color:#94a3b8; font-size:11px">No data</p>'}
        </div>
      </div>
      <div>
        <p style="font-size:11px; font-weight:600; color:#64748b; margin-bottom:10px">
          SUPPLIERS
        </p>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px">
          ${supplierStats ? [
            { label: 'Total',    value: supplierStats.total,    color: 'color:#0f172a'  },
            { label: 'Active',   value: supplierStats.active,   color: 'color:#16a34a'  },
            { label: 'Inactive', value: supplierStats.inactive, color: 'color:#dc2626'  },
          ].map(s => `
            <div class="stat-box">
              <div class="stat-val" style="${s.color}">${s.value}</div>
              <div class="stat-label">${s.label}</div>
            </div>
          `).join('') : '<p style="color:#94a3b8; font-size:11px">No data</p>'}
        </div>
      </div>
    </div>
  </div>

  <!-- ── FOOTER ── -->
  <div class="footer">
    <span>PartsPro Inventory & POS System</span>
    <span>Report generated on ${now}</span>
    <span>Range: ${rangeText}</span>
  </div>

</body>
</html>
  `

  // ── Open print window ──────────────────────────
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    alert('Please allow popups to export PDF.')
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for content to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      // Close after print dialog is dismissed
      printWindow.onafterprint = () => printWindow.close()
    }, 500)
  }
}
