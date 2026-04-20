"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/custom/Button";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";
import { FaExternalLinkAlt } from "react-icons/fa";

interface InvoiceData {
  documentId: string;
  id: number;
  stripeInvoiceId?: string;
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  invoiceStatus?: string;
  hostedUrl?: string;
  periodStart?: string;
  periodEnd?: string;
}

export default function InvoicesTab() {
  const t = useTranslations("Profile");
  const user = useAppSelector((state: RootState) => state.auth.user);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.documentId) return;

      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(`/api/invoices?userId=${user.documentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch invoices");
        }

        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          setInvoices(data.data);
        } else {
          setInvoices([]);
        }
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError(err instanceof Error ? err.message : "Error fetching invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user?.documentId]);

  const getStatusClasses = (invoiceStatus?: string) => {
    switch (invoiceStatus) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "void":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 w-full h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4">
        <div>
          <h2 className="text-2xl pt-5 lg:pt-0 font-semibold text-gray-800 m-0">
            {t("tabs.invoices", { default: "Invoices" })}
          </h2>
          <p className="text-gray-600 mt-2 m-0 hidden sm:block">
            {t("invoicesDesc", { default: "View and download your billing history." })}
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 mt-6 lg:mt-0">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExternalLinkAlt className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {t("noInvoicesTitle", { default: "No invoices yet" })}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {t("noInvoicesDesc", { default: "When you have active subscriptions or billing events, your invoices will appear here." })}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 mt-4 xl:mt-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("invoiceTable.number", { default: "Invoice Number" })}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("invoiceTable.date", { default: "Date" })}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("invoiceTable.amount", { default: "Amount" })}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("invoiceTable.status", { default: "Status" })}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("invoiceTable.actions", { default: "Actions" })}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.documentId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.periodStart ? new Date(invoice.periodStart).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.amount?.toFixed(2)} {invoice.currency?.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusClasses(invoice.invoiceStatus)}`}>
                      {invoice.invoiceStatus ? invoice.invoiceStatus.charAt(0).toUpperCase() + invoice.invoiceStatus.slice(1) : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right flex justify-end gap-2">
                    {invoice.hostedUrl && (
                      <Button style="ghost" onClick={() => window.open(invoice.hostedUrl, "_blank")} tooltip={t("invoiceTable.view", { default: "View" })}>
                        <FaExternalLinkAlt className="text-gray-500 hover:text-primary" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
