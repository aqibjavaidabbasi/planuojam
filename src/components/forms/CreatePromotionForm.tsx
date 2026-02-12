"use client";

import React from "react";
import { useForm } from "react-hook-form";
import type { UseFormHandleSubmit, UseFormWatch } from "react-hook-form";
import Modal from "@/components/custom/Modal";
import Input from "@/components/custom/Input";
import Select from "@/components/custom/Select";
import Button from "@/components/custom/Button";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Elements, useElements, useStripe, CardElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAppSelector } from "@/store/hooks";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHEABLE_KEY || "");

type UserListingOption = { id: string; title: string; documentId: string; };
type StarPackage = { stars: number; days: number; amount?: number };

interface CreatePromotionFormProps {
  isOpen: boolean;
  onClose: () => void;
  listings: UserListingOption[];
  onCreated?: () => void;
}

type FormValues = {
  listingDocumentId: string;
  packageIndex?: number; // index into siteSettings.starPackages.package
  stars?: number; // for custom
  days?: number; // for custom
};

function CheckoutSection(props: {
  isCustomSelected: boolean;
  selectedPkgIndex: number | undefined;
  packages: StarPackage[];
  pricePerStarPerDay: number;
  currencyShort: string;
  isSubmitting: boolean;
  onClose: () => void;
  onCreated?: () => void;
  reset: () => void;
  authUserId?: string | number;
  watch: UseFormWatch<FormValues>;
  handleSubmitFromForm: UseFormHandleSubmit<FormValues>;
  getListingTitle: (id: string) => string | undefined;
}) {
  const {
    isCustomSelected,
    selectedPkgIndex,
    packages,
    pricePerStarPerDay,
    currencyShort,
    isSubmitting,
    onClose,
    onCreated,
    reset,
    authUserId,
    watch,
    handleSubmitFromForm,
    getListingTitle,
  } = props;

  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("Profile");
  const tModals = useTranslations("Modals");
  const cardOptions = React.useMemo(() => ({ hidePostalCode: true }), []);
  const [cardComplete, setCardComplete] = React.useState(false);

  const submitPromotion = async (values: FormValues) => {
    try {
      if (!authUserId) {
        toast.error("Please login to continue");
        return;
      }
      if (!stripe || !elements) {
        toast.error(tModals("BuyStars.paymentErrorTitle"));
        return;
      }

      let stars: number | undefined = undefined;
      let days: number | undefined = undefined;
      if (!isCustomSelected && values.packageIndex !== undefined && packages[values.packageIndex]) {
        const pkg = packages[values.packageIndex];
        stars = Number(pkg.stars);
        days = Number(pkg.days);
      } else {
        stars = Number(values.stars || 0);
        days = Number(values.days || 0);
      }

      if (!stars || !days) {
        toast.error(t("promotions.errors.required"));
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        toast.error(tModals("BuyStars.cardInputNotReady", { defaultMessage: "Card input is not ready." }));
        return;
      }
      if (!cardComplete) {
        toast.error("Please complete your card details");
        return;
      }

      if (!Number.isFinite(stars as number) || (stars as number) <= 0) {
        toast.error(t("promotions.errors.required", { default: "Required" }));
        return;
      }
      if (!Number.isFinite(days as number) || (days as number) <= 0) {
        toast.error(t("promotions.errors.required", { default: "Required" }));
        return;
      }

      const amount = Number(pricePerStarPerDay) * Number(stars) * Number(days);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error(t("promotions.errors.required", { default: "Required" }));
        return;
      }

      const intentRes = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authUserId,
          amount,
          currency: currencyShort,
          purpose: "promotion",
          listingDocumentId: values.listingDocumentId,
          listingTitle: getListingTitle(String(values.listingDocumentId)),
          promotionStars: stars,
          promotionDays: days,
        }),
      });
      const intentJson = await intentRes.json();
      const clientSecret: string | undefined = intentJson?.clientSecret;
      if (!clientSecret) {
        toast.error(tModals("BuyStars.paymentClientSecretMissing"));
        return;
      }

      const card = elements.getElement(CardElement);
      if (!card) {
        toast.error(tModals("BuyStars.cardInputNotReady"));
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        toast.error(result.error.message || tModals("BuyStars.paymentFailed"));
        return;
      }

      toast.success(t("promotions.created"));

      onCreated?.();
      reset();
      onClose();
    } catch {
      
    }
  };

  return (
    <div className="grid gap-3">
      <div className="mt-2 max-w-md">
        <CardElement options={cardOptions} onChange={(e) => setCardComplete(!!e.complete)} />
      </div>
      <div className="flex items-center justify-between gap-3 pt-2">
          <Button style="ghost" type="button" onClick={onClose}>
            {t("promotions.cancel")}
          </Button>
          <Button
            style="primary"
            type="button"
            onClick={handleSubmitFromForm(submitPromotion)}
            disabled={isSubmitting || !stripe || !elements || !cardComplete || (()=>{
              if (!isCustomSelected && typeof selectedPkgIndex === 'number' && packages[selectedPkgIndex]) {
                const s = Number(packages[selectedPkgIndex].stars)||0; const d = Number(packages[selectedPkgIndex].days)||0; return !(s>0 && d>0);
              } else {
                const s = Number(watch("stars")||0); const d = Number(watch("days")||0); return !(s>0 && d>0);
              }
            })()}
          >
            {isSubmitting ? t("promotions.creating") : t("promotions.create")}
          </Button>
      </div>
    </div>
  );
}

const CreatePromotionForm: React.FC<CreatePromotionFormProps> = ({
  isOpen,
  onClose,
  listings,
  onCreated,
}) => {
  const t = useTranslations("Profile");
  const { siteSettings } = useSiteSettings();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      listingDocumentId: "",
      packageIndex: undefined,
      stars: undefined,
      days: undefined,
    },
  });

  const packages: StarPackage[] = siteSettings?.starPackages?.package || [];
  const currencySymbol = siteSettings?.currency?.symbol || "$";
  const selectedPkgIndex = watch("packageIndex");
  const [isCustomSelected, setIsCustomSelected] = React.useState<boolean>(false);
  const authUser = useAppSelector((s) => s.auth.user);
  const pricePerStarPerDay = Number(siteSettings?.pricePerStarPerDay || 0);
  const currencyShort = siteSettings?.currency?.shortCode || "usd";
  const currencySym = siteSettings?.currency?.symbol || "$";

  return (
    <Elements stripe={stripePromise}>
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      size="md"
      title={<span className="pr-8">{t("promotions.title")}</span>}
      footer={
        <CheckoutSection
          isCustomSelected={isCustomSelected}
          selectedPkgIndex={typeof selectedPkgIndex === 'number' ? selectedPkgIndex : undefined}
          packages={packages}
          pricePerStarPerDay={pricePerStarPerDay}
          currencyShort={currencyShort}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onCreated={onCreated}
          reset={() => reset()}
          authUserId={authUser?.id}
          watch={watch}
          handleSubmitFromForm={handleSubmit}
          getListingTitle={(id: string) => {
            const found = listings.find(l => String(l.documentId) === String(id));
            return found?.title;
          }}
        />
      }
    >
      <form id="create-promotion-form" onSubmit={(e) => e.preventDefault()} className="grid gap-4 max-w-xl py-4">
        <div>
          <Select
            options={listings.map((l) => ({ value: l.id, label: l.title }))}
            placeholder={t("promotions.selectListing")}
            disabled={isSubmitting}
            required
            label={t("promotions.selectListing")}
            {...register("listingDocumentId", { required: true })}
          />
          {errors.listingDocumentId && (
            <p className="text-xs text-red-500 mt-1">{t("promotions.errors.required", { defaultMessage: "Required" })}</p>
          )}
        </div>

        {/* Package selection grid + Custom option */}
        {packages.length ? (
          <div>
            <div className="mb-2 text-sm font-medium">
              {t("promotions.selectPackage", { defaultMessage: "Select package (optional)" })}
            </div>
            <div className="flex flex-wrap gap-4 items-center justify-center">
              {packages.map((p, idx) => {
                const isSelected = !isCustomSelected && selectedPkgIndex === idx;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setIsCustomSelected(false);
                      setValue("packageIndex", idx);
                    }}
                    className={`text-left rounded-2xl border-2 p-3 cursor-pointer transition-all w-45 h-30 ${
                      isSelected
                        ? "border-primary bg-gradient-to-br from-primary to-[#e6a942] text-white shadow-lg -translate-y-0.5"
                        : "border-gray-200 bg-white hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-1">
                      <h3 className={`text-base font-bold ${isSelected ? "text-white" : "text-primary"}`}>
                        {p.stars.toLocaleString()} ⭐
                      </h3>
                      <div className={`text-sm ${isSelected ? "text-white" : "text-gray-700"}`}>
                        {t("promotions.days", { defaultMessage: "Days" })}: {p.days ?? "-"}
                      </div>
                      <div className={`text-lg font-extrabold ${isSelected ? "text-white" : "text-gray-900"}`}>
                        {currencySymbol}
                        {p.amount}
                      </div>
                    </div>
                  </button>
                );
              })}
              {/* Custom card */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomSelected(true);
                  setValue("packageIndex", undefined);
                }}
                className={`text-left rounded-2xl border-2 p-3 cursor-pointer transition-all w-45 h-30 ${
                  isCustomSelected
                    ? "border-primary bg-gradient-to-br from-primary to-[#e6a942] text-white shadow-lg -translate-y-0.5"
                    : "border-gray-200 bg-white hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <div className="flex flex-col items-center text-center gap-1">
                  <h3 className={`text-base font-bold ${isCustomSelected ? "text-white" : "text-primary"}`}>
                    {t("promotions.custom")}
                  </h3>
                  <div className={`text-sm ${isCustomSelected ? "text-white" : "text-gray-700"}`}>
                    {t("promotions.customStarsAndDays")}
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          // If no predefined packages, default to custom input
          <></>
        )}

        {/* Custom stars + days (shown only when Custom selected or when no packages) */}
        {(isCustomSelected || packages.length === 0) && (
          <div className="grid grid-cols-1 gap-4">
            <Input
              type="number"
              label={t("promotions.customStars")}
              placeholder="100"
              disabled={isSubmitting}
              {...register("stars", { valueAsNumber: true, min: 1 })}
            />
            <Input
              type="number"
              label={t("promotions.customDays")}
              placeholder="7"
              disabled={isSubmitting}
              {...register("days", { valueAsNumber: true, min: 1 })}
            />
          </div>
        )}

        {/* Helper price note for custom */}
        {siteSettings?.pricePerStarPerDay ? (
          <p className="text-xs text-gray-500">{t("promotions.priceHint")}</p>
        ) : null}
        <div className="text-sm font-medium text-gray-800">
          {(() => {
            let stars = 0, days = 0;
            if (!isCustomSelected && typeof selectedPkgIndex === 'number' && packages[selectedPkgIndex]) {
              stars = Number(packages[selectedPkgIndex].stars) || 0;
              days = Number(packages[selectedPkgIndex].days) || 0;
            } else {
              stars = Number(watch("stars") || 0);
              days = Number(watch("days") || 0);
            }
            const total = Number(pricePerStarPerDay) * stars * days;
            return total > 0 ? (
              <span>
                {t("promotions.total")}: {currencySym}{total}
              </span>
            ) : null;
          })()}
        </div>
      </form>
    </Modal>
    </Elements>
  );
};

export default CreatePromotionForm;
