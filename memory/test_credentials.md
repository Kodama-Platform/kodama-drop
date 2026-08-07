# Kodama Talk — Test Credentials

Frontend-only, **no accounts**. State is mock + localStorage (keys prefixed `kodama-talk/v1`).

## Owner unlock (mock rule)
- Seed claimed places: **`alex`** (Alex Rivera) and **`studio`** (North Studio).
- To unlock any claimed place as owner: open `/<address>`, click **"This is me"**, enter **any password with 4+ characters** (e.g. `secret`). Optionally "Remember this device".

## Claiming a new place
- Open any unclaimed address (e.g. `/my-new-place`) → **Claim this address** → set display name + any 4+ char owner password → opens the Shelf.

## Notes
- Owner passwords cannot be "reset" (by design — device-held credential in the future ZK model). In the mock, any 4+ char password unlocks a claimed place.
- If a flow carries odd state, clear `localStorage` (keys `kodama-talk/v1/*`) and reload.
- No email/phone/username/API keys anywhere.
