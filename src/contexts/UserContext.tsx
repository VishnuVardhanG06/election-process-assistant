"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  UserContext,
  UserLocation,
  ElectionType,
  UserRole,
  RegistrationStatusValue,
  DisclosureLevel,
  Message,
} from "@/types";

const DEFAULT_CONTEXT: UserContext = {
  location: { country: "United States" },
  electionType: "national",
  userRole: "voter",
  registrationStatus: "unknown",
  conversationHistory: [],
  detectedIntent: "",
  upcomingElections: [],
  daysUntilDeadline: null,
  disclosureLevel: "brief",
};

interface UserContextValue {
  userContext: UserContext;
  updateLocation: (location: Partial<UserLocation>) => void;
  updateRole: (role: UserRole) => void;
  updateRegistrationStatus: (status: RegistrationStatusValue) => void;
  setDisclosureLevel: (level: DisclosureLevel) => void;
  addMessage: (message: Message) => void;
  setDaysUntilDeadline: (days: number | null) => void;
  setUpcomingElections: (elections: string[]) => void;
  resetContext: () => void;
}

const UserCtx = createContext<UserContextValue | undefined>(undefined);

export function UserContextProvider({ children }: { children: ReactNode }) {
  const [userContext, setUserContext] = useState<UserContext>(DEFAULT_CONTEXT);

  const updateLocation = useCallback((location: Partial<UserLocation>) => {
    setUserContext((prev) => ({
      ...prev,
      location: { ...prev.location, ...location },
    }));
  }, []);

  const updateRole = useCallback((role: UserRole) => {
    setUserContext((prev) => ({ ...prev, userRole: role }));
  }, []);

  const updateRegistrationStatus = useCallback((status: RegistrationStatusValue) => {
    setUserContext((prev) => ({ ...prev, registrationStatus: status }));
  }, []);

  const setDisclosureLevel = useCallback((level: DisclosureLevel) => {
    setUserContext((prev) => ({ ...prev, disclosureLevel: level }));
  }, []);

  const addMessage = useCallback((message: Message) => {
    setUserContext((prev) => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, message],
    }));
  }, []);

  const setDaysUntilDeadline = useCallback((days: number | null) => {
    setUserContext((prev) => ({ ...prev, daysUntilDeadline: days }));
  }, []);

  const setUpcomingElections = useCallback((elections: string[]) => {
    setUserContext((prev) => ({ ...prev, upcomingElections: elections }));
  }, []);

  const resetContext = useCallback(() => {
    setUserContext(DEFAULT_CONTEXT);
  }, []);

  return (
    <UserCtx.Provider
      value={{
        userContext,
        updateLocation,
        updateRole,
        updateRegistrationStatus,
        setDisclosureLevel,
        addMessage,
        setDaysUntilDeadline,
        setUpcomingElections,
        resetContext,
      }}
    >
      {children}
    </UserCtx.Provider>
  );
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUserContext must be used within UserContextProvider");
  return ctx;
}
