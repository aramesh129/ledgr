const express = require("express");
const cors = require("cors");
const { PlaidApi, PlaidEnvironments, Configuration } = require("plaid");

const app = express();
app.use(cors());
app.use(express.json());

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments.sandbox, // change to "development" for real banks
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  })
);

app.post("/create-link-token", async (req, res) => {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: "student-user" },
    client_name: "Ledgr",
    products: ["transactions"],
    country_codes: ["US"],
    language: "en",
  });
  res.json(response.data);
});

app.post("/exchange-token", async (req, res) => {
  const { public_token } = req.body;
  const response = await plaidClient.itemPublicTokenExchange({ public_token });
  res.json(response.data);
});

app.post("/transactions", async (req, res) => {
  const { access_token } = req.body;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    .toISOString().split("T")[0];
  const end = now.toISOString().split("T")[0];
  const response = await plaidClient.transactionsGet({
    access_token,
    start_date: start,
    end_date: end,
  });
  res.json({ transactions: response.data.transactions });
});

app.listen(8003, () => console.log("Plaid service running on port 8003"));