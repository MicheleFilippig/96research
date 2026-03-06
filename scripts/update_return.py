import yfinance as yf
import json
from datetime import date

TICKER = "GSL"
BENCHMARK = "^GSPC"
START_DATE = "2025-11-01"
OUTPUT = "data/gsl-return.json"

# --- GSL: unadjusted price + dividends (no reinvestment) ---
ticker = yf.Ticker(TICKER)
hist = ticker.history(start=START_DATE, auto_adjust=False)

if len(hist) < 1:
    print("No price data found")
    exit(1)

start_price = hist["Close"].iloc[0]
end_price = hist["Close"].iloc[-1]

divs = ticker.dividends
divs_since = divs[divs.index.tz_localize(None) >= START_DATE] if divs.index.tz is None else divs[divs.index.tz_convert(None) >= START_DATE]
total_dividends = float(divs_since.sum())

gsl_return = ((end_price - start_price + total_dividends) / start_price) * 100

# --- S&P 500: adjusted prices (dividends reinvested, standard benchmark convention) ---
sp500 = yf.Ticker(BENCHMARK)
sp_hist = sp500.history(start=START_DATE, auto_adjust=True)

if len(sp_hist) < 1:
    print("No S&P 500 data found")
    exit(1)

sp_start = sp_hist["Close"].iloc[0]
sp_end = sp_hist["Close"].iloc[-1]
sp500_return = ((sp_end - sp_start) / sp_start) * 100

data = {
    "ticker": TICKER,
    "start_date": START_DATE,
    "as_of": date.today().isoformat(),
    "total_return": round(gsl_return, 1),
    "sp500_return": round(sp500_return, 1)
}

with open(OUTPUT, "w") as f:
    json.dump(data, f)

print(f"GSL total return from {START_DATE}: {data['total_return']}%")
print(f"S&P 500 total return from {START_DATE}: {data['sp500_return']}%")
