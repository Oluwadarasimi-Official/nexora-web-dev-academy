-- Nexora Web Dev. Academy — migration 002: seed the 30 initial access codes.
-- SECURITY: ONLY SHA-256 hashes are stored here. Plaintext codes are NOT in this
-- file, NOT in the repository, NOT in docs, logs or UI. The plaintext list lives
-- only in the owner's confidential specification PDF (Appendix A).
-- Hashing: SHA-256 of the exact code string, no salt prefix (see redeem_code() in
-- 001_schema.sql, which hashes the submitted code the same way).
-- Idempotent: INSERT ... ON CONFLICT (code_hash) DO NOTHING — rerunning adds nothing.
-- To issue a future batch, hash the new codes the same way and add a new migration;
-- never edit this file to add plaintext.

INSERT INTO public.access_codes (code_hash, status) VALUES ('e8fb317f501b866feba53320b9112e3abfedd8dbb73631f79359d58ec12d0f17', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #01
INSERT INTO public.access_codes (code_hash, status) VALUES ('491d746d0affddcd57061e67f243d83a984cf47a2a1d46fc33160be4280376a7', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #02
INSERT INTO public.access_codes (code_hash, status) VALUES ('7c3d50f382216ba051f524568ce66537e2990d10788817c89cae99a5018ca9d4', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #03
INSERT INTO public.access_codes (code_hash, status) VALUES ('fe906433cdd3d837bf95a2577e4bd5c2db323676d500d3d8dfae216b2c2f9449', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #04
INSERT INTO public.access_codes (code_hash, status) VALUES ('7e62c8a339c3ac95134ba2c2289e25b68069631ee868e43ff3e90546122fa55d', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #05
INSERT INTO public.access_codes (code_hash, status) VALUES ('1ff653048c54086a4b02e9f22d5f8743b75727c18dda5cd9a4682d15fd108353', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #06
INSERT INTO public.access_codes (code_hash, status) VALUES ('343cc956c9378c960b4f2c0a13bc6027d64ee755a7ec62fca30762caee5874fe', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #07
INSERT INTO public.access_codes (code_hash, status) VALUES ('2a8f81a78333d621155a3d4e6f45695e7a45483466c27d902ed2fcda7d96e36c', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #08
INSERT INTO public.access_codes (code_hash, status) VALUES ('99c6802719f73aee7af2ba8ec5c06bd035b44504e8aad9713963cb3bba3f677d', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #09
INSERT INTO public.access_codes (code_hash, status) VALUES ('a895d599c5f765a28c124fc6846a396d9764965ae9b3a1fcc1a78e277ec8be5b', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #10
INSERT INTO public.access_codes (code_hash, status) VALUES ('092f87ea31d9c1b864c6554227ae7eb80412cb953aed395af2c9aa3d69b20909', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #11
INSERT INTO public.access_codes (code_hash, status) VALUES ('74ad7648bbba08abbde28f663a3915d09a36591a8db26666eb336b6c211fda16', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #12
INSERT INTO public.access_codes (code_hash, status) VALUES ('136299281e9549d2765eaeabf7de98701820fb53aa2d9b3919632acd05750389', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #13
INSERT INTO public.access_codes (code_hash, status) VALUES ('def7df7bd5d4e8f321422e00853fbfa39b95eb33b5b95264996fc23c26dbc673', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #14
INSERT INTO public.access_codes (code_hash, status) VALUES ('ed43e03fe068ece6021ab253adad102f124e6bc9fe457839faf8cf1fecc49348', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #15
INSERT INTO public.access_codes (code_hash, status) VALUES ('3a041addf1f393d0eb0ede7d7aec15d9741bdd5d26eb4e64aaec976c7f148d38', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #16
INSERT INTO public.access_codes (code_hash, status) VALUES ('1691ecc2f69f4bd9910a4722db227f1937b405ef455ec0e52bf3f270a371109e', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #17
INSERT INTO public.access_codes (code_hash, status) VALUES ('d05e471263ac06dafff013bdeaf862184eb3600591add64d7af01e36668e22c7', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #18
INSERT INTO public.access_codes (code_hash, status) VALUES ('379d6733bc2756de3ab100b8b081b7f2e8a1d6812d90e10408fc1da7bccb4493', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #19
INSERT INTO public.access_codes (code_hash, status) VALUES ('d37dfdf95d2b27d8f9ee90c5ac67b2f2aa777875d1b71f51f2865dba65255499', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #20
INSERT INTO public.access_codes (code_hash, status) VALUES ('db6b44f4e2c6d756c32edc9f91145ae717407aa1ae0114ff3b21d9ce85cb2d8a', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #21
INSERT INTO public.access_codes (code_hash, status) VALUES ('e94a1c8eb46ba86eb62aedbe9103b764f01dd49bf81ce2c0431dd1095801b7f3', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #22
INSERT INTO public.access_codes (code_hash, status) VALUES ('8712a64719da86382f34db5847f6154f631f625d3ff7ebae09c3765cc82593fb', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #23
INSERT INTO public.access_codes (code_hash, status) VALUES ('a39faef999c763e16c5f7d0219706d44b31ef927b9d78ef7d1d3db0cbec427f3', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #24
INSERT INTO public.access_codes (code_hash, status) VALUES ('7d0789489c75f5f172e14a515ef10444780c703f06efa7d81fd56e71b839977d', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #25
INSERT INTO public.access_codes (code_hash, status) VALUES ('6724118906938a1829d6fac69478de3dd546097bb36464ad37fd8d8798faef10', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #26
INSERT INTO public.access_codes (code_hash, status) VALUES ('f1a3f3e3fb2665fb1bb706f3b48d4c34153c6a03c88c22d9dacb48146fec0235', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #27
INSERT INTO public.access_codes (code_hash, status) VALUES ('14da105bcd230edf02660c2d1265c0ce3234c0abf86eb07c571dd0c6ac39daf2', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #28
INSERT INTO public.access_codes (code_hash, status) VALUES ('d235a98143f718760c1f3dd5bc02f687d4cdf4a36a078433074ddc00b05fc718', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #29
INSERT INTO public.access_codes (code_hash, status) VALUES ('4cda6be18f57264db40ae271fcfa20f395384a1ad17a8f8dba09c11b50418be8', 'unused') ON CONFLICT (code_hash) DO NOTHING; -- code #30

-- Verification (run after applying): SELECT status, count(*) FROM public.access_codes GROUP BY status; -- expect unused = 30
