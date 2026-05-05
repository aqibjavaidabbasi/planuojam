"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/custom/Button";
import Input from "@/components/custom/Input";
import TextArea from "@/components/custom/TextArea";
import {
  BuyerInvoiceInformation,
  fetchBuyerInvoiceInformation,
  isBuyerInvoiceInformationComplete,
  saveBuyerInvoiceInformation,
} from "@/services/buyerInvoiceInformation";
import { customUpdateProfile } from "@/services/authCustom";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import type { User } from "@/types/userTypes";
import { useTranslations } from "next-intl";

const emptyInfo: BuyerInvoiceInformation = {
  companyName: "",
  companyId: "",
  companyVAT: "",
  companyAddress: "",
  contactPerson: "",
  individualName: "",
  individualSurname: "",
  registrationAddress: "",
};

export default function InvoiceInformationSection({ user }: { user: User | null }) {
  const t = useTranslations("Profile.InvoiceInformation");
  const dispatch = useAppDispatch();
  const [customerType, setCustomerType] = useState<"individual" | "company">(
    user?.invoiceCustomerType || "individual"
  );
  const [info, setInfo] = useState<BuyerInvoiceInformation>(emptyInfo);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCustomerType(user?.invoiceCustomerType || "individual");
  }, [user?.invoiceCustomerType]);

  useEffect(() => {
    let cancelled = false;

    async function loadInfo() {
      if (!user?.documentId) return;
      setLoading(true);
      try {
        const loaded = await fetchBuyerInvoiceInformation(user.documentId);
        if (!cancelled) {
          setInfo({ ...emptyInfo, ...(loaded || {}) });
        }
      } catch {
        if (!cancelled) {
          setInfo(emptyInfo);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInfo();
    return () => {
      cancelled = true;
    };
  }, [user?.documentId]);

  const updateField = (field: keyof BuyerInvoiceInformation, value: string) => {
    setInfo((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (customerType === "individual") {
      return Boolean(
        info.individualName?.trim() &&
          info.individualSurname?.trim() &&
          info.registrationAddress?.trim()
      );
    }

    return Boolean(
      info.companyName?.trim() &&
        info.companyId?.trim() &&
        info.companyAddress?.trim() &&
        info.contactPerson?.trim()
    );
  };

  const handleSave = async () => {
    if (!user?.id) return;

    if (!validate()) {
      toast.error(
        customerType === "company"
          ? t("validation.companyRequired")
          : t("validation.individualRequired")
      );
      return;
    }

    setSaving(true);
    try {
      const [saved, profile] = await Promise.all([
        saveBuyerInvoiceInformation(user.id, info.documentId, info),
        customUpdateProfile({ invoiceCustomerType: customerType }),
      ]);

      setInfo({ ...emptyInfo, ...saved });
      if (profile && typeof profile === "object" && "user" in profile) {
        dispatch(setUser((profile as { user: User }).user));
      }
      toast.success(t("toasts.saved"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("toasts.saveFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  const complete = isBuyerInvoiceInformationComplete(customerType, info);
  const hasCompanyInformation = isBuyerInvoiceInformationComplete("company", info);
  const hasIndividualInformation = isBuyerInvoiceInformationComplete("individual", info);
  const lockedCustomerType =
    isBuyerInvoiceInformationComplete(customerType, info)
      ? customerType
      : hasCompanyInformation
        ? "company"
        : hasIndividualInformation
          ? "individual"
          : null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-800">
          {t("title")}
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          {t("description")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {(["individual", "company"] as const).map((type) => (
          <label key={type} className="relative">
            <input
              type="radio"
              value={type}
              className="sr-only disabled:cursor-not-allowed"
              checked={customerType === type}
              onChange={() => setCustomerType(type)}
              disabled={
                saving ||
                loading ||
                Boolean(lockedCustomerType && lockedCustomerType !== type)
              }
            />
            <div
              className={`border-2 border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary ${
                customerType === type ? "border-primary bg-primary/15" : ""
              } ${
                saving ||
                loading ||
                Boolean(lockedCustomerType && lockedCustomerType !== type)
                  ? "cursor-not-allowed opacity-60"
                  : ""
              }`}
            >
              <div className="text-center">
                <div className="font-medium text-gray-800">{t(`types.${type}`)}</div>
              </div>
            </div>
          </label>
        ))}
      </div>

      {!complete && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("incompleteNotice")}
        </div>
      )}

      {customerType === "individual" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            label={t("fields.individualName")}
            value={info.individualName || ""}
            onChange={(event) => updateField("individualName", event.target.value)}
            required
            disabled={saving || loading}
          />
          <Input
            type="text"
            label={t("fields.individualSurname")}
            value={info.individualSurname || ""}
            onChange={(event) => updateField("individualSurname", event.target.value)}
            required
            disabled={saving || loading}
          />
          <div className="md:col-span-2">
            <TextArea
              label={t("fields.registrationAddress")}
              rows={3}
              value={info.registrationAddress || ""}
              onChange={(event) => updateField("registrationAddress", event.target.value)}
              required
              disabled={saving || loading}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            label={t("fields.companyName")}
            value={info.companyName || ""}
            onChange={(event) => updateField("companyName", event.target.value)}
            required
            disabled={saving || loading}
          />
          <Input
            type="text"
            label={t("fields.companyId")}
            value={info.companyId || ""}
            onChange={(event) => updateField("companyId", event.target.value)}
            required
            disabled={saving || loading}
          />
          <Input
            type="text"
            label={t("fields.companyVAT")}
            value={info.companyVAT || ""}
            onChange={(event) => updateField("companyVAT", event.target.value)}
            disabled={saving || loading}
          />
          <Input
            type="text"
            label={t("fields.contactPerson")}
            value={info.contactPerson || ""}
            onChange={(event) => updateField("contactPerson", event.target.value)}
            required
            disabled={saving || loading}
          />
          <div className="md:col-span-2">
            <TextArea
              label={t("fields.companyAddress")}
              rows={3}
              value={info.companyAddress || ""}
              onChange={(event) => updateField("companyAddress", event.target.value)}
              required
              disabled={saving || loading}
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        <Button
          style="primary"
          extraStyles="!rounded-md"
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? t("actions.saving") : t("actions.save")}
        </Button>
      </div>
    </div>
  );
}
