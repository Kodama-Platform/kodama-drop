-- KNP-1 cutover: temporary KSP/legacy pages are disposable — clear slate.
-- pages.ciphertext = KSC note envelope (base64)
-- pages.iv         = unused for KNP (empty placeholder)
-- pages.salt       = password wrap salt (base64) when owner password is set
-- pages.kdf_params = KnpPlaceMeta JSON (protocol, suite, keys, policy, epoch, version)

truncate table public.pages restart identity cascade;
