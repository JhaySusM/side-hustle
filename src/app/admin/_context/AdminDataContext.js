"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AdminDataContext = createContext(null);

const ENDPOINTS = [
  { key: "usersRes", url: "/api/users" },
  { key: "productsRes", url: "/api/products" },
  { key: "categoriesRes", url: "/api/categories" },
  { key: "transactionsRes", url: "/api/admin/transactions" },
  { key: "messagesRes", url: "/api/admin/messages" },
  { key: "reportsRes", url: "/api/admin/reports" },
  { key: "notificationsRes", url: "/api/admin/notifications" },
  { key: "sellerFeaturesRes", url: "/api/admin/seller-features" },
];

const EMPTY_DATA = {
  users: [],
  products: [],
  categories: [],
  transactions: [],
  transactionSummary: {},
  conversations: [],
  reports: [],
  reportSummary: {},
  notificationCampaigns: [],
  sellers: [],
};

export function AdminDataProvider({ children }) {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const refetchAll = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const responses = await Promise.all(
        ENDPOINTS.map(({ url }) => fetch(url, { credentials: "include", cache: "no-store" }))
      );

      if (responses.some((res) => res.status === 401)) {
        setSessionExpired(true);
        if (!silent) setLoading(false);
        return;
      }

      const payloads = await Promise.all(responses.map((res) => res.json()));
      const [users, products, categories, transactions, messages, reports, notifications, sellerFeatures] = payloads;

      for (const [index, res] of responses.entries()) {
        if (!res.ok) {
          throw new Error(payloads[index]?.error || `Failed to load ${ENDPOINTS[index].url}`);
        }
      }

      setData({
        users: users.users || [],
        products: products.products || [],
        categories: categories.categories || [],
        transactions: transactions.transactions || [],
        transactionSummary: transactions.summary || {},
        conversations: messages.conversations || [],
        reports: reports.reports || [],
        reportSummary: reports.summary || {},
        notificationCampaigns: notifications.campaigns || [],
        sellers: sellerFeatures.sellers || [],
      });
      setSessionExpired(false);
    } catch (err) {
      // Background polls fail silently so a flaky network blip doesn't blank
      // out the page the admin is actively looking at.
      if (!silent) setError(err.message || "Failed to load admin data");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const patchUsers = useCallback((updater) => {
    setData((prev) => ({ ...prev, users: updater(prev.users) }));
  }, []);
  const patchSellers = useCallback((updater) => {
    setData((prev) => ({ ...prev, sellers: updater(prev.sellers) }));
  }, []);
  const patchProducts = useCallback((updater) => {
    setData((prev) => ({ ...prev, products: updater(prev.products) }));
  }, []);
  const patchReports = useCallback((updater) => {
    setData((prev) => ({ ...prev, reports: updater(prev.reports) }));
  }, []);
  const patchConversations = useCallback((updater) => {
    setData((prev) => ({ ...prev, conversations: updater(prev.conversations) }));
  }, []);
  const patchNotificationCampaigns = useCallback((updater) => {
    setData((prev) => ({ ...prev, notificationCampaigns: updater(prev.notificationCampaigns) }));
  }, []);

  useEffect(() => {
    refetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background refresh so the notification bell (new users/listings/messages)
  // reflects activity that happened after the initial page load, without a
  // full page reload. Matches the 45s cadence Navbar.js already uses for its
  // customer-facing notification poll.
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchAll({ silent: true });
    }, 45000);
    return () => clearInterval(intervalId);
  }, [refetchAll]);

  const value = useMemo(
    () => ({
      ...data,
      loading,
      error,
      sessionExpired,
      refetchAll,
      patchUsers,
      patchSellers,
      patchProducts,
      patchReports,
      patchConversations,
      patchNotificationCampaigns,
    }),
    [
      data,
      loading,
      error,
      sessionExpired,
      refetchAll,
      patchUsers,
      patchSellers,
      patchProducts,
      patchReports,
      patchConversations,
      patchNotificationCampaigns,
    ]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
