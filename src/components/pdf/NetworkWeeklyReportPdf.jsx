import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const ACCENT = "#2F855A";
const INK = "#0f172a";
const MUTED = "#64748b";
const BAND = "#1e293b";
const PANEL = "#f8fafc";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 8,
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
  brand: { fontSize: 7, letterSpacing: 1.3, color: MUTED, textTransform: "uppercase" },
  tag: {
    fontSize: 7,
    color: ACCENT,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: 700,
  },
  h1: { fontSize: 18, fontWeight: 700, color: BAND, marginTop: 2, marginBottom: 2 },
  sub: { fontSize: 9, color: MUTED, marginBottom: 10 },

  kpiRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  kpi: {
    width: "23%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 8,
    backgroundColor: PANEL,
  },
  kpiVal: { fontSize: 14, fontWeight: 700, color: BAND, marginBottom: 2 },
  kpiLab: { fontSize: 6, textTransform: "uppercase", letterSpacing: 0.6, color: MUTED },
  kpiDelta: { fontSize: 7, color: ACCENT, marginTop: 3, fontWeight: 700 },

  callout: {
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    paddingLeft: 10,
    marginBottom: 10,
    paddingVertical: 4,
  },
  calloutTitle: { fontSize: 9, fontWeight: 700, color: BAND, marginBottom: 3 },
  calloutBody: { fontSize: 8, color: MUTED, lineHeight: 1.35 },

  section: { fontSize: 7, textTransform: "uppercase", letterSpacing: 1.1, color: ACCENT, marginBottom: 5, fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, marginBottom: 10 },
  th: {
    flexDirection: "row",
    backgroundColor: BAND,
    color: "#fff",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  thc: { fontSize: 6, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingVertical: 4, paddingHorizontal: 6 },
  tc: { fontSize: 8, color: INK },
  trAlt: { backgroundColor: "#fafafa" },

  foot: { fontSize: 6.5, color: MUTED, lineHeight: 1.35, marginTop: 4 },
  conf: { fontSize: 6, color: "#94a3b8", marginTop: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  pageNum: { position: "absolute", bottom: 22, right: 36, fontSize: 6, color: MUTED },
});

function formatMom(n) {
  if (n === 0) return "flat vs prior 7d";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}% vs prior 7 days`;
}

function num(n) {
  return Number(n ?? 0);
}

export default function NetworkWeeklyReportPdf({ report }) {
  if (!report) return null;

  const { kpis, daily, dealerLeaderboard, topListings, narrative, usedEmptyTopListings } = report;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} fixed />

        <View style={styles.brandRow}>
          <Text style={styles.brand}>Welsh Motorhub · Admin</Text>
          <Text style={styles.tag}>Network intelligence</Text>
        </View>
        <Text style={styles.h1}>Marketplace pulse</Text>
        <Text style={styles.sub}>Full network · Rolling 7 days · {report.periodLabel}</Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{num(kpis.periodListingViews).toLocaleString("en-KE")}</Text>
            <Text style={styles.kpiLab}>Listing detail views</Text>
            <Text style={styles.kpiDelta}>{formatMom(kpis.viewsMom)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{num(kpis.periodLeads).toLocaleString("en-KE")}</Text>
            <Text style={styles.kpiLab}>Leads (all dealers)</Text>
            <Text style={styles.kpiDelta}>{formatMom(kpis.leadsMom)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{num(kpis.activeListings).toLocaleString("en-KE")}</Text>
            <Text style={styles.kpiLab}>Live listings</Text>
            <Text style={styles.kpiDelta}>{num(kpis.dealersWithStock)} dealers w/ stock</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiVal}>{num(kpis.totalDealers).toLocaleString("en-KE")}</Text>
            <Text style={styles.kpiLab}>Dealer accounts</Text>
            <Text style={styles.kpiDelta}>{num(kpis.lifetimeViews).toLocaleString("en-KE")} all-time views</Text>
          </View>
        </View>

        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{narrative.headline}</Text>
          <Text style={styles.calloutBody}>{narrative.sub}</Text>
        </View>

        <Text style={styles.section}>Network day-by-day</Text>
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.thc, { width: "34%" }]}>Day</Text>
            <Text style={[styles.thc, { width: "22%", textAlign: "right" }]}>Detail views</Text>
            <Text style={[styles.thc, { width: "22%", textAlign: "right" }]}>Leads</Text>
            <Text style={[styles.thc, { width: "22%", textAlign: "right" }]}>&nbsp;</Text>
          </View>
          {daily.map((row, i) => (
            <View key={row.dayLabel + i} style={[styles.tr, i % 2 === 1 ? styles.trAlt : {}]} wrap={false}>
              <Text style={[styles.tc, { width: "34%" }]}>{row.dayLabel}</Text>
              <Text style={[styles.tc, { width: "22%", textAlign: "right" }]}>{row.views}</Text>
              <Text style={[styles.tc, { width: "22%", textAlign: "right" }]}>{row.leads}</Text>
              <Text style={{ width: "22%" }} />
            </View>
          ))}
        </View>

        <Text style={styles.section}>Platform-wide engagement (lifetime counters)</Text>
        <Text style={styles.foot}>
          Sum of WhatsApp taps recorded on listings: {num(kpis.lifetimeWhatsapp).toLocaleString("en-KE")} · Print /
          share actions: {num(kpis.lifetimePrints).toLocaleString("en-KE")}. Pair with 7-day metrics when briefing
          dealers that buyer behaviour compounds beyond a single session.
        </Text>

        <Text style={styles.conf}>Generated {report.generatedAtLabel} · Welsh Motorhub admin · Confidential</Text>
        <Text style={styles.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} fixed />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} fixed />
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Welsh Motorhub · Admin</Text>
          <Text style={styles.tag}>Dealer scoreboard</Text>
        </View>
        <Text style={styles.h1}>Who drove traffic</Text>
        <Text style={styles.sub}>Sorted by listing detail views this window · Top {dealerLeaderboard.length} showrooms</Text>

        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.thc, { width: "34%" }]}>Dealer</Text>
            <Text style={[styles.thc, { width: "26%" }]}>Location</Text>
            <Text style={[styles.thc, { width: "12%", textAlign: "right" }]}>Live</Text>
            <Text style={[styles.thc, { width: "14%", textAlign: "right" }]}>Views</Text>
            <Text style={[styles.thc, { width: "14%", textAlign: "right" }]}>Leads</Text>
          </View>
          {dealerLeaderboard.map((row, i) => (
            <View key={`dealer-${i}`} style={[styles.tr, i % 2 === 1 ? styles.trAlt : {}]} wrap={false}>
              <Text style={[styles.tc, { width: "34%", fontWeight: 700 }]}>{row.name}</Text>
              <Text style={[styles.tc, { width: "26%", fontSize: 7, color: MUTED }]}>{row.location}</Text>
              <Text style={[styles.tc, { width: "12%", textAlign: "right" }]}>{row.activeListings}</Text>
              <Text style={[styles.tc, { width: "14%", textAlign: "right", fontWeight: 700 }]}>{row.periodViews}</Text>
              <Text style={[styles.tc, { width: "14%", textAlign: "right" }]}>{row.periodLeads}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Hottest listings (network-wide)</Text>
        {usedEmptyTopListings ? (
          <Text style={styles.foot}>No listing-level detail views in this window — spotlight dealers with outbound pushes next week.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.th}>
              <Text style={[styles.thc, { width: "28%" }]}>Dealer</Text>
              <Text style={[styles.thc, { width: "38%" }]}>Vehicle</Text>
              <Text style={[styles.thc, { width: "14%", textAlign: "right" }]}>Views</Text>
              <Text style={[styles.thc, { width: "20%", textAlign: "right" }]}>Ask</Text>
            </View>
            {topListings.map((row, i) => (
              <View key={row.title + i} style={[styles.tr, i % 2 === 1 ? styles.trAlt : {}]} wrap={false}>
                <Text style={[styles.tc, { width: "28%", fontSize: 7 }]}>{row.dealerName}</Text>
                <Text style={[styles.tc, { width: "38%" }]}>{row.title}</Text>
                <Text style={[styles.tc, { width: "14%", textAlign: "right", fontWeight: 700 }]}>{row.periodViews}</Text>
                <Text style={[styles.tc, { width: "20%", textAlign: "right", fontWeight: 700 }]}>{row.priceLabel}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.foot} wrap>
          Use this digest in investor updates or dealer QBRs: it ties marketplace liquidity (views/leads) to individual
          partner performance without exposing buyer PII.
        </Text>
        <Text style={styles.conf}>Welsh Motorhub · Network weekly · {report.periodLabel}</Text>
        <Text style={styles.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
