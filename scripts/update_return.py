import yfinance as yf
import json
from datetime import date

TICKER = "GSL"
START_DATE = "2025-11-01"
OUTPUT = "data/gsl-return.json"

ticker = yf.Ticker(TICKER)

# Get unadjusted prices
hist = ticker.history(start=START_DATE, auto_adjust=False)

if len(hist) < 1:
    print("No price data found")
    exit(1)

start_price = hist["Close"].iloc[0]
end_price = hist["Close"].iloc[-1]

# Get dividends paid from start date to today
divs = ticker.dividends
divs_since = divs[divs.index.tz_localize(None) >= START_DATE] if divs.index.tz is None else divs[divs.index.tz_convert(None) >= START_DATE]
total_dividends = float(divs_since.sum())

# Total return without reinvestment
total_return = ((end_price - start_price + total_dividends) / start_price) * 100

data = {
    "ticker": TICKER,
    "start_date": START_DATE,
    "as_of": date.today().isoformat(),
    "total_return": round(total_return, 1)
}

with open(OUTPUT, "w") as f:
    json.dump(data, f)

print(f"GSL total return from {START_DATE}: {data['total_return']}%")
