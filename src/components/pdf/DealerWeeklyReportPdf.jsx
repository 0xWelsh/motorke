import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const ACCENT = "#ff5a2f";
const INK = "#0f172a";
const MUTED = "#64748b";
const BAND = "#1e293b";
const PANEL = "#f8fafc";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: INK,
  },
  topBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: ACCENT,
  },
  brandRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  brand: { fontSize: 7, letterSpacing: 1.4, color: MUTED, textTransform: "uppercase" },
  tag: {
    fontSize: 7,
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: 700,
  },
  h1: { fontSize: 20, fontWeight: 700, color: BAND, marginTop: 2, marginBottom: 2 },
  sub: { fontSize: 10, color: MUTED, marginBottom: 12 },
  dealer: { fontSize: 11, fontWeight: 700, color: INK, marginBottom: 2 },
  loc: { fontSize: 9, color: MUTED, marginBottom: 16 },

  kpiRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  kpi: {
    width: "31%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 10,
    backgroundColor: PANEL,
  },
  kpiVal: { fontSize: 18, fontWeight: 700, color: BAND, marginBottom: 2 },
  kpiLab: { fontSize: 7, textTransform: "uppercase", letterSpacing: 0.8, color: MUTED },
  kpiDelta: { fontSize: 8, color: ACCENT, marginTop: 4, fontWeight: 700 },

  callout: {
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    paddingLeft: 10,
    marginBottom: 12,
    paddingVertical: 4,
  },
  calloutTitle: { fontSize: 10, fontWeight: 700, color: BAND, marginBottom: 3 },
  calloutBody: { fontSize: 9, color: MUTED, lineHeight: 1.4 },

  section: { fontSize: 8, textTransform: "uppercase", letterSpacing: 1.2, color: ACCENT, marginBottom: 6, fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, marginBottom: 12 },
  th: {
    flexDirection: "row",
    backgroundColor: BAND,
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thc: { fontSize: 7, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingVertical: 5, paddingHorizontal: 8 },
  tc: { fontSize: 9, color: INK },
  tcMuted: { fontSize: 8, color: MUTED },
  trAlt: { backgroundColor: "#fafafa" },

  topTable: { marginBottom: 8 },
  foot: { fontSize: 7, color: MUTED, lineHeight: 1.35, marginTop: 6 },
  pageNum: { position: "absolute", bottom: 24, right: 40, fontSize: 7, color: MUTED },
  conf: { fontSize: 6, color: "#94a3b8", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
});

function formatMom(n) {
  if (n === 0) return "flat vs prior 7d";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}% vs prior 7 days`;
}

export default function DealerWeeklyReportPdf({ report }) {
  if (!report) return null;

  const { kpis, daily, topVehicles, narrative, usedLifetimeFallback } = report;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} fixed />

        <View style={styles.brandRow}>
          <Text style={styles.brand}>Welsh Motorhub</Text>
          <Text style={styles.tag}>Dealer proof pack</Text>
        </View>
        <Text style={styles.h1}>Showroom pulse</Text>
        <Text style={styles.sub}>Rolling 7-day performance · {report.periodLabel}</Text>

        <Text style={styles.dealer}>{report.dealerName}</Text>
        <Text style={styles.loc}>
          {report.dealerLocation}
          {report.dealerCounty ? ` · ${report.dealerCounty}` : ""}
        </Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{kpis.periodListingViews.toLocaleString("en-KE")}</Text>
            <Text style={styles.kpiLab}>Listing detail views (7d)</Text>
            <Text style={styles.kpiDelta}>{formatMom(kpis.viewsMom)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{kpis.periodLeads.toLocaleString("en-KE")}</Text>
            <Text style={styles.kpiLab}>Leads captured (7d)</Text>
            <Text style={styles.kpiDelta}>{formatMom(kpis.leadsMom)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{kpis.activeListings.toLocaleString("en-KE")}</Text>
            <Text style={styles.kpiLab}>Active listings (now)</Text>
            <Text style={styles.kpiDelta}>{kpis.lifetimeViews.toLocaleString("en-KE")} all-time views</Text>
          </View>
        </View>

        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{narrative.headline}</Text>
          <Text style={styles.calloutBody}>{narrative.sub}</Text>
        </View>

        <Text style={styles.section}>Day-by-day pulse</Text>
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.thc, { width: "32%" }]}>Day</Text>
            <Text style={[styles.thc, { width: "24%", textAlign: "right" }]}>Detail views</Text>
            <Text style={[styles.thc, { width: "24%", textAlign: "right" }]}>Leads</Text>
            <Text style={[styles.thc, { width: "20%", textAlign: "right" }]}> </Text>
          </View>
          {daily.map((row, i) => (
            <View
              key={row.dayLabel + i}
              style={[styles.tr, i % 2 === 1 ? styles.trAlt : {}]}
              wrap={false}
            >
              <Text style={[styles.tc, { width: "32%" }]}>{row.dayLabel}</Text>
              <Text style={[styles.tc, { width: "24%", textAlign: "right" }]}>{row.views}</Text>
              <Text style={[styles.tc, { width: "24%", textAlign: "right" }]}>{row.leads}</Text>
              <Text style={{ width: "20%" }} />
            </View>
          ))}
        </View>

        <Text style={styles.section}>Engagement (all-time totals on your inventory)</Text>
        <Text style={styles.foot}>
          WhatsApp tap events recorded on listings: {kpis.lifetimeWhatsapp.toLocaleString("en-KE")} · Print / share
          actions: {kpis.lifetimePrints.toLocaleString("en-KE")}. Use these with 7-day views above when showing dealers
          that buyers are interacting, not just browsing once.
        </Text>

        {usedLifetimeFallback ? (
          <Text style={[styles.foot, { marginTop: 6, fontStyle: "italic" }]}>
            No per-listing detail views in the last 7 days — top table ranks by all-time views instead. Push fresh
            stock photos and share deep links to wake up the chart next week.
          </Text>
        ) : null}

        <Text style={styles.conf}>Generated {report.generatedAtLabel} · Welsh Motorhub dealer portal</Text>
        <Text style={styles.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} fixed />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} fixed />
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Welsh Motorhub</Text>
          <Text style={styles.tag}>Top attention</Text>
        </View>
        <Text style={styles.h1}>Where buyers looked</Text>
        <Text style={styles.sub}>{report.dealerName}</Text>

        <Text style={styles.section}>Hot listings {usedLifetimeFallback ? "(all-time rank)" : "(this week)"}</Text>
        <View style={[styles.table, styles.topTable]}>
          <View style={styles.th}>
            <Text style={[styles.thc, { width: "46%" }]}>Vehicle</Text>
            <Text style={[styles.thc, { width: "18%", textAlign: "right" }]}>Views</Text>
            <Text style={[styles.thc, { width: "36%", textAlign: "right" }]}>Ask</Text>
          </View>
          {topVehicles.map((row, i) => (
            <View key={row.title + i} style={[styles.tr, i % 2 === 1 ? styles.trAlt : {}]} wrap={false}>
              <Text style={[styles.tc, { width: "46%" }]}>{row.title}</Text>
              <Text style={[styles.tc, { width: "18%", textAlign: "right" }]}>
                {row.periodViews > 0 ? row.periodViews : "—"}
              </Text>
              <Text style={[styles.tc, { width: "36%", textAlign: "right", fontWeight: 700 }]}>{row.priceLabel}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Why this PDF exists</Text>
        <Text style={styles.foot}>
          Share this export with your dealer principal or finance partner: it connects marketplace activity (detail views
          and leads in the window) to inventory volume. Pair weekly exports with your outbound WhatsApp pushes so partners
          see cause → effect.
        </Text>

        <Text style={styles.conf}>Welsh Motorhub · Confidential showroom analytics · {report.periodLabel}</Text>
        <Text style={styles.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
