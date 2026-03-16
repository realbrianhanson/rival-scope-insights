import { useEffect } from "react";
import { useAppSettings } from "./useAppSettings";

export function useDocumentTitle(pageTitle?: string) {
  const { data: settings } = useAppSettings();
  const appName = settings?.app_name || "RivalScope";

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | ${appName}` : appName;
    return () => { document.title = appName; };
  }, [pageTitle, appName]);

  return appName;
}
