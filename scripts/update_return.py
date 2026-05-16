import yfinance as yf
import json
from datetime import date

BENCHMARK = "^GSPC"

TICKERS = [
    {"ticker": "GSL",  "start_date": "2025-11-01", "output": "data/gsl-return.json"},
    {"ticker": "UUUU", "start_date": "2025-12-01", "output": "data/uuuu-return.json"},
]

sp500 = yf.Ticker(BENCHMARK)

for cfg in TICKERS:
    TICKER = cfg["ticker"]
    START_DATE = cfg["start_date"]
    OUTPUT = cfg["output"]

    ticker = yf.Ticker(TICKER)
    hist = ticker.history(start=START_DATE, auto_adjust=False)

    if len(hist) < 1:
        print(f"No price data for {TICKER}")
        continue

    start_price = hist["Close"].iloc[0]
    end_price = hist["Close"].iloc[-1]

    divs = ticker.dividends
    divs_since = divs[divs.index.tz_localize(None) >= START_DATE] if divs.index.tz is None else divs[divs.index.tz_convert(None) >= START_DATE]
    total_dividends = float(divs_since.sum())

    total_return = ((end_price - start_price + total_dividends) / start_price) * 100

    sp_hist = sp500.history(start=START_DATE, auto_adjust=True)
    sp_start = sp_hist["Close"].iloc[0]
    sp_end = sp_hist["Close"].iloc[-1]
    sp500_return = ((sp_end - sp_start) / sp_start) * 100

    data = {
        "ticker": TICKER,
        "start_date": START_DATE,
        "as_of": date.today().isoformat(),
        "total_return": round(total_return, 1),
        "sp500_return": round(sp500_return, 1)
    }

    with open(OUTPUT, "w") as f:
        json.dump(data, f)

    print(f"{TICKER} total return from {START_DATE}: {data['total_return']}%")
    print(f"S&P 500 (vs {TICKER}) from {START_DATE}: {data['sp500_return']}%")
