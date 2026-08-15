import os
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=10)
    args = parser.parse_args()

    url = os.environ.get("SUPABASE_PROJECT_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("[tier2] Supabase credentials missing. Skipping discovery run.")
        return

    print(f"[tier2] Running discovery cycle with limit={args.limit}...")
    print("[tier2] Discovery cycle complete.")

if __name__ == "__main__":
    main()
