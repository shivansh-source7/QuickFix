
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Invoice.css";

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function readSavedInvoice() {
  try {
    return JSON.parse(localStorage.getItem("invoiceData") || "null");
  } catch {
    return null;
  }
}

function Invoice() {
  const location = useLocation();
  const navigate = useNavigate();

  const invoice =
    location.state?.invoice ||
    location.state ||
    readSavedInvoice();

  if (!invoice || !Object.keys(invoice).length) {
    return (
      <main className="inv-page">
        <section className="inv-empty">
          <div className="inv-empty-icon">🧾</div>
          <h1>No invoice available</h1>
          <p>
            An invoice will appear here when your garage has created one.
          </p>
          <button
            className="inv-primary-btn"
            onClick={() => navigate("/request")}
          >
            Go to Service Request
          </button>
        </section>
      </main>
    );
  }

  const customer = invoice.customer || {};
  const garage = invoice.garage || {};

  const rawItems =
    invoice.items ||
    invoice.services ||
    invoice.lineItems ||
    [];

  const items = Array.isArray(rawItems)
    ? rawItems.map((item, index) => ({
        id: item.id || item._id || index,
        name: item.name || item.description || item.serviceName || "Service",
        quantity: Math.max(1, Number(item.quantity) || 1),
        price: Number(
          item.price ?? item.rate ?? item.amount ?? item.cost ?? 0
        ),
      }))
    : [];

  const itemSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const subtotal = Number(
    invoice.subtotal ?? invoice.subTotal ?? itemSubtotal
  );

  const taxRate = Number(invoice.taxRate ?? 18);
  const tax = Number(
    invoice.tax ?? invoice.gstAmount ?? (subtotal * taxRate) / 100
  );

  const discount = Number(invoice.discount || 0);

  const total = Number(
    invoice.total ??
      invoice.totalAmount ??
      invoice.grandTotal ??
      subtotal + tax - discount
  );

  const invoiceNumber =
    invoice.invoiceNumber ||
    invoice.invoiceNo ||
    invoice._id ||
    invoice.id ||
    "Pending";

  const invoiceDate = invoice.createdAt || invoice.date;
  const formattedDate = invoiceDate
    ? new Date(invoiceDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not provided";

  const paymentStatus = String(
    invoice.paymentStatus || invoice.payment_status || "Pending"
  );

  const customerName =
    customer.name ||
    invoice.customerName ||
    invoice.userName ||
    "Customer";

  const garageName =
    garage.name ||
    invoice.garageName ||
    invoice.workshopName ||
    "QuickFix Service Garage";

  const handlePrint = () => window.print();

  return (
    <main className="inv-page">
      <div className="inv-container">
        <div className="inv-toolbar">
          <button
            className="inv-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <button className="inv-primary-btn" onClick={handlePrint}>
            ⎙ Print / Save as PDF
          </button>
        </div>

        <article className="inv-paper">
          <header className="inv-header">
            <div className="inv-brand">
              <div className="inv-logo">Q</div>
              <div>
                <h1>QuickFix</h1>
                <p>Vehicle Service & Repair</p>
              </div>
            </div>

            <div className="inv-title-block">
              <span>PAYMENT DOCUMENT</span>
              <h2>INVOICE</h2>
              <p>
                Invoice No: <strong>{String(invoiceNumber)}</strong>
              </p>
            </div>
          </header>

          <div className="inv-blue-line" />

          <section className="inv-info-grid">
            <div className="inv-info-block">
              <span className="inv-label">BILLED TO</span>
              <h3>{customerName}</h3>
              {customer.phone || invoice.customerPhone ? (
                <p>{customer.phone || invoice.customerPhone}</p>
              ) : null}
              {customer.email || invoice.customerEmail ? (
                <p>{customer.email || invoice.customerEmail}</p>
              ) : null}
              {customer.address || invoice.customerAddress ? (
                <p>{customer.address || invoice.customerAddress}</p>
              ) : null}
            </div>

            <div className="inv-info-block">
              <span className="inv-label">SERVICE PROVIDER</span>
              <h3>{garageName}</h3>
              {garage.phone || invoice.garagePhone ? (
                <p>{garage.phone || invoice.garagePhone}</p>
              ) : null}
              {garage.address || invoice.garageAddress ? (
                <p>{garage.address || invoice.garageAddress}</p>
              ) : null}
            </div>

            <div className="inv-meta">
              <div>
                <span>Invoice Date</span>
                <strong>{formattedDate}</strong>
              </div>
              <div>
                <span>Payment Status</span>
                <strong
                  className={`inv-payment-status ${
                    paymentStatus.toLowerCase() === "paid"
                      ? "paid"
                      : "unpaid"
                  }`}
                >
                  {paymentStatus}
                </strong>
              </div>
              {invoice.vehicleNumber || invoice.vehicle?.number ? (
                <div>
                  <span>Vehicle Number</span>
                  <strong>
                    {invoice.vehicleNumber || invoice.vehicle?.number}
                  </strong>
                </div>
              ) : null}
            </div>
          </section>

          {invoice.problem || invoice.description ? (
            <section className="inv-problem">
              <span className="inv-label">SERVICE ISSUE</span>
              <p>{invoice.problem || invoice.description}</p>
            </section>
          ) : null}

          <section className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>DESCRIPTION</th>
                  <th className="inv-number">QTY</th>
                  <th className="inv-number">RATE</th>
                  <th className="inv-number">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="inv-number">{item.quantity}</td>
                      <td className="inv-number">
                        {formatINR(item.price)}
                      </td>
                      <td className="inv-number">
                        {formatINR(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="inv-no-items">
                      No itemized service charges were provided.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="inv-summary">
            <div className="inv-note">
              <span className="inv-label">THANK YOU</span>
              <h3>Thank you for choosing QuickFix!</h3>
              <p>
                We appreciate your trust in our vehicle service platform.
              </p>
              {invoice.notes ? <p>{invoice.notes}</p> : null}
            </div>

            <div className="inv-totals">
              <div>
                <span>Subtotal</span>
                <strong>{formatINR(subtotal)}</strong>
              </div>
              <div>
                <span>
                  Tax / GST {invoice.taxRate != null ? `(${taxRate}%)` : ""}
                </span>
                <strong>{formatINR(tax)}</strong>
              </div>
              {discount > 0 && (
                <div>
                  <span>Discount</span>
                  <strong>-{formatINR(discount)}</strong>
                </div>
              )}
              <div className="inv-grand-total">
                <span>Total Amount</span>
                <strong>{formatINR(total)}</strong>
              </div>
              <p className="inv-currency-note">
                All amounts are in Indian Rupees (INR).
              </p>
            </div>
          </section>

          <footer className="inv-footer">
            <p>QuickFix · Vehicle Service & Repair</p>
            <span>This invoice reflects the details provided by the garage.</span>
          </footer>
        </article>
      </div>
    </main>
  );
}

export default Invoice;
