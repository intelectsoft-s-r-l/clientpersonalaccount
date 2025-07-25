import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageNavigation } from "../context/PageNavigationContext";

const validTabs = [
  "monitor",
  "license",
  "assortement",
  "fiscal-devices",
  "banks",
  "transactionDkv",
];

export function useSyncPageFromQuery() {
  const [searchParams] = useSearchParams();
  const { setActivePage } = usePageNavigation();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && validTabs.includes(tab)) {
      setActivePage(tab);
    } else {
      setActivePage("monitor");
    }
  }, [searchParams, setActivePage]);
}
