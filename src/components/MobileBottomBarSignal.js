import { useBottomActionBar } from "@/lib/use-bottom-action-bar";

// Renders nothing. Place it beside any page-level fixed bottom action bar so
// CompareSelector's floating tray backs off instead of overlapping it.
export default function MobileBottomBarSignal() {
  useBottomActionBar();
  return null;
}