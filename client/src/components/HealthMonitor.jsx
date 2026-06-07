import { useEffect, useRef } from "react";
import { useGetHealthQuery } from "../app/api/baseApi";
import { toast } from "./Toast";

function serviceOk(v) {
  if (v === undefined || v === null) return true;
  return v === "up" || v?.ok === true || v?.status === "connected";
}

export function HealthMonitor() {
  const { data, isError, isLoading } = useGetHealthQuery(undefined, {
    pollingInterval: 60_000,
  });
  const prevDown = useRef(null);

  useEffect(() => {
    if (isLoading) return;

    const anyDown = isError
      ? true
      : !serviceOk(data?.services?.server) ||
        !serviceOk(data?.services?.mongodb) ||
        !serviceOk(data?.services?.redis);

    if (prevDown.current === null) {
      if (anyDown) {
        toast.error(
          isError
            ? "Cannot reach the backend server — check your connection."
            : "Some backend services are unavailable — features may be limited.",
          { duration: 8000 }
        );
      }
    } else if (!prevDown.current && anyDown) {
      toast.error("A backend service went down — some features may not work.", { duration: 8000 });
    } else if (prevDown.current && !anyDown) {
      toast.success("All backend services are back online.");
    }

    prevDown.current = anyDown;
  }, [data, isError, isLoading]);

  return null;
}
