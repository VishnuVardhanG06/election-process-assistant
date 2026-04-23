"use client";

import { useState, useCallback, useEffect } from "react";
import { VoterInfo, RegistrationStatus, ApiResult } from "@/types";
import { debounce } from "lodash";

interface UseVoterInfoReturn {
  voterInfo: VoterInfo | null;
  registrationStatus: RegistrationStatus | null;
  isLoading: boolean;
  error: string | null;
  fetchVoterInfo: (address: string) => void;
  address: string;
  setAddress: (addr: string) => void;
}

export function useVoterInfo(): UseVoterInfoReturn {
  const [address, setAddress] = useState("");
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVoterInfo = useCallback(
    debounce(async (addr: string) => {
      if (!addr.trim() || addr.length < 10) return;
      setIsLoading(true);
      setError(null);

      try {
        const [voterRes, regRes] = await Promise.all([
          fetch("/api/voter-info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: addr }),
          }),
          fetch("/api/voter-info/registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: addr }),
          }),
        ]);

        const voterData = (await voterRes.json()) as ApiResult<VoterInfo>;
        const regData = (await regRes.json()) as ApiResult<RegistrationStatus>;

        if (voterData.ok) setVoterInfo(voterData.data);
        else setError(voterData.error);

        if (regData.ok) setRegistrationStatus(regData.data);
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 600),
    []
  );

  return { voterInfo, registrationStatus, isLoading, error, fetchVoterInfo, address, setAddress };
}
