import React, { memo } from "react";
import { VendorChecklistItem, VendorStatus, getVendorChecklistSummary } from "@/domain";

interface VendorChecklistViewProps {
  readonly checklist: readonly VendorChecklistItem[];
  readonly onUpdateStatus: (id: string, status: VendorStatus) => void;
  readonly onUpdateDetails: (id: string, patch: Partial<VendorChecklistItem>) => void;
}

const VendorRow = memo(function VendorRow({
  vendor,
  onUpdateStatus,
  onUpdateDetails,
}: {
  readonly vendor: VendorChecklistItem;
  readonly onUpdateStatus: (id: string, status: VendorStatus) => void;
  readonly onUpdateDetails: (id: string, patch: Partial<VendorChecklistItem>) => void;
}) {
  return (
    <article
      key={vendor.id}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1.25rem",
        alignItems: "center",
        padding: "1.25rem",
        background: "var(--bg-input)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "10px",
      }}
    >
      <div>
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: "600",
          }}
        >
          {vendor.category.replace(/_/g, " & ")}
        </span>
        <h3
          style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}
        >
          {vendor.title}
        </h3>
      </div>

      <div>
        <label
          htmlFor={`vendor-name-${vendor.id}`}
          className="form-label"
          style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}
        >
          Vendor / Business Name
        </label>
        <input
          id={`vendor-name-${vendor.id}`}
          type="text"
          placeholder="e.g. Skyline Studio"
          value={vendor.vendorName}
          onChange={(e) => onUpdateDetails(vendor.id, { vendorName: e.target.value })}
          className="form-input"
          style={{ minHeight: "44px", fontSize: "0.9rem" }}
        />
      </div>

      <div>
        <label
          htmlFor={`vendor-cost-${vendor.id}`}
          className="form-label"
          style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}
        >
          Contract / Est. Cost ($)
        </label>
        <input
          id={`vendor-cost-${vendor.id}`}
          type="number"
          min="0"
          step="50"
          value={vendor.estimatedCost === 0 ? "" : vendor.estimatedCost}
          placeholder="0"
          onChange={(e) =>
            onUpdateDetails(vendor.id, {
              estimatedCost: Math.max(0, parseFloat(e.target.value) || 0),
            })
          }
          className="form-input"
          style={{ minHeight: "44px", fontSize: "0.9rem" }}
        />
      </div>

      <div>
        <label
          htmlFor={`vendor-status-${vendor.id}`}
          className="form-label"
          style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}
        >
          Procurement Status
        </label>
        <select
          id={`vendor-status-${vendor.id}`}
          value={vendor.status}
          onChange={(e) => onUpdateStatus(vendor.id, e.target.value as VendorStatus)}
          className="form-select"
          style={{ minHeight: "44px", fontSize: "0.9rem" }}
        >
          <option value="researching">🔍 Researching</option>
          <option value="contacted">📞 Contacted</option>
          <option value="proposal_received">📄 Proposal Received</option>
          <option value="booked">🤝 Confirmed & Booked</option>
          <option value="declined">❌ Declined</option>
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <label
          htmlFor={`vendor-contract-${vendor.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.9rem",
            color: "var(--text-primary)",
            cursor: "pointer",
            minHeight: "44px",
          }}
        >
          <input
            id={`vendor-contract-${vendor.id}`}
            type="checkbox"
            checked={vendor.contractSigned}
            onChange={(e) =>
              onUpdateDetails(vendor.id, { contractSigned: e.target.checked })
            }
            style={{
              width: "20px",
              height: "20px",
              cursor: "pointer",
              accentColor: "var(--accent-purple)",
            }}
            aria-label={`Contract Signed status for ${vendor.title}`}
          />
          <span>
            Contract Signed {vendor.contractSigned ? "✅ (Yes)" : "⏳ (Pending)"}
          </span>
        </label>
      </div>
    </article>
  );
});

/**
 * Interactive Vendor Procurement checklist component with contract tracking,
 * status transitions, cost commitments, and accessible controls.
 */
export function VendorChecklistView({
  checklist,
  onUpdateStatus,
  onUpdateDetails,
}: VendorChecklistViewProps): React.JSX.Element {
  const summary = getVendorChecklistSummary(checklist);

  return (
    <div
      id="tabpanel-vendors"
      role="tabpanel"
      aria-labelledby="tab-vendors"
      tabIndex={0}
      style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
    >
      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
        role="region"
        aria-label="Vendor Procurement Metrics"
      >
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Total Vendors Needed
          </span>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              marginTop: "0.25rem",
              color: "var(--text-primary)",
            }}
          >
            {summary.totalVendors}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Confirmed / Booked
          </span>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              color: "var(--status-success-text)",
              marginTop: "0.25rem",
            }}
          >
            {summary.bookedCount}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Committed Costs
          </span>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              color: "var(--accent-purple)",
              marginTop: "0.25rem",
            }}
          >
            ${summary.totalCommittedCost.toLocaleString()}
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            Contract Compliance
          </span>
          <p
            style={{
              fontSize: "1.1rem",
              fontWeight: "700",
              color: summary.allContractsSigned
                ? "var(--status-success-text)"
                : "var(--status-warning-text)",
              marginTop: "0.5rem",
            }}
          >
            {summary.allContractsSigned ? "✅ All Booked Signed" : "⏳ Contracts Pending"}
          </p>
        </div>
      </div>

      {/* Vendor List */}
      <section className="glass-panel" aria-labelledby="vendor-list-heading">
        <h2
          id="vendor-list-heading"
          style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1rem" }}
        >
          Vendor Category Checklist & Procurement Status
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {checklist.map((vendor) => (
            <VendorRow
              key={vendor.id}
              vendor={vendor}
              onUpdateStatus={onUpdateStatus}
              onUpdateDetails={onUpdateDetails}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default VendorChecklistView;
