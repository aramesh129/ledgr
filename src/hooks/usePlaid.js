import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function usePlaid() {
  const [loading, setLoading] = useState(false);
  const saveToken = useMutation(api.plaid.saveAccessToken);
  const addTxn = useMutation(api.transactions.add);

  async function connectBank() {
    setLoading(true);
    try {
      const linkRes = await fetch(
        `${import.meta.env.VITE_PLAID_SERVICE_URL}/create-link-token`,
        { method: "POST" }
      );
      const { link_token } = await linkRes.json();

      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: async (publicToken, metadata) => {
          const exchangeRes = await fetch(
            `${import.meta.env.VITE_PLAID_SERVICE_URL}/exchange-token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ public_token: publicToken }),
            }
          );
          const { access_token, item_id } = await exchangeRes.json();

          await saveToken({
            accessToken: access_token,
            itemId: item_id,
            institutionName: metadata.institution.name,
          });

          const txnRes = await fetch(
            `${import.meta.env.VITE_PLAID_SERVICE_URL}/transactions`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ access_token }),
            }
          );
          const { transactions } = await txnRes.json();
          for (const t of transactions) {
            await addTxn({
              date: t.date,
              merchant: t.merchant_name ?? t.name,
              amount: -t.amount, // Plaid returns positive for debits
              category: t.personal_finance_category?.primary ?? "Other",
              source: "plaid",
            });
          }
        },
        onExit: () => setLoading(false),
      });
      handler.open();
    } catch (e) {
      console.error("Plaid error:", e);
      setLoading(false);
    }
  }

  return { connectBank, loading };
}